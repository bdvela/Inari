"""
Endpoints de autenticación: registro y login.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_db
from backend.core.security import create_access_token, hash_password, verify_password
from backend.models.models import User, UserRole, Event, EventType, Quotation, QuotationLevel, QuotationStatus, QuotationDetail, BasePackage
from backend.models.repositories import ProviderRepository, QuotationRepository
from backend.modules.optimizer.schemas import OptimizationInput, ProviderOption
from backend.modules.proposal_gen.generator import generate_proposals
from backend.modules.rules_engine.engine import evaluate_rules
from backend.modules.rules_engine.schemas import RuleEvaluationInput
from backend.modules.packages.selector import select_package
from backend.modules.packages.schemas import ServicePackage as ServicePackageSvc
from backend.modules.packages.exceptions import NoPackagesConfiguredError
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone

router = APIRouter(prefix="/auth", tags=["Autenticación"])


class RegisterRequest(BaseModel):
    nombre: str
    email: EmailStr
    telefono: str | None = None
    password: str
    role: UserRole = UserRole.CLIENTE


class RegisterAndQuoteRequest(BaseModel):
    # Datos de registro
    nombre: str
    email: EmailStr
    telefono_whatsapp: str
    password: str
    mensaje: str | None = None
    # Datos del evento (del preview)
    evento_tipo: str
    evento_fecha: str
    num_invitados: int
    presupuesto_maximo: float
    estilo: str | None = None
    descripcion: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str
    nombre: str | None = None


class RegisterAndQuoteResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str
    nombre: str
    quotation_basica_id: int | None = None
    quotation_premium_id: int | None = None
    basica_factible: bool = False
    premium_factible: bool = False


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email ya registrado")

    user = User(
        nombre=req.nombre,
        email=req.email,
        telefono=req.telefono,
        hashed_password=hash_password(req.password),
        role=req.role,
    )
    db.add(user)
    await db.flush()

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user_id=user.id, role=user.role.value, nombre=user.nombre)


@router.post("/register-and-quote", response_model=RegisterAndQuoteResponse, status_code=status.HTTP_201_CREATED)
async def register_and_quote(req: RegisterAndQuoteRequest, db: AsyncSession = Depends(get_db)):
    """
    Crea cuenta + genera cotización en un solo paso.
    Usado por visitantes que completaron el preview y quieren enviar su propuesta a INARI.
    """
    from backend.models.models import BusinessRule
    from backend.modules.rules_engine.schemas import RuleDefinition
    from datetime import date as date_type

    # 1. Validar email único
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email ya registrado. Inicia sesión para recuperar tu cotización.")

    # 2. Crear usuario
    user = User(
        nombre=req.nombre,
        email=req.email,
        telefono=req.telefono_whatsapp,
        hashed_password=hash_password(req.password),
        role=UserRole.CLIENTE,
    )
    db.add(user)
    await db.flush()

    # 3. Generar cotización (misma lógica que generate_quotation)
    event_date = date_type.fromisoformat(req.evento_fecha)

    event = Event(
        cliente_id=user.id,
        tipo=EventType(req.evento_tipo),
        fecha=event_date,
        num_invitados=req.num_invitados,
        presupuesto_maximo=req.presupuesto_maximo,
        estilo=req.estilo,
        descripcion=req.descripcion,
    )
    db.add(event)
    await db.flush()

    # Reglas
    db_rules_result = await db.execute(
        select(BusinessRule)
        .where(BusinessRule.tipo_evento == EventType(req.evento_tipo))
        .options(selectinload(BusinessRule.servicio))
    )
    db_rules = list(db_rules_result.scalars().all())
    rule_definitions = [
        RuleDefinition(
            service_id=str(r.servicio_id),
            service_name=r.servicio.nombre if r.servicio else str(r.servicio_id),
            es_obligatorio=r.es_obligatorio,
            condicion=r.condicion,
        )
        for r in db_rules
    ]
    rule_result = evaluate_rules(RuleEvaluationInput(
        event_type=req.evento_tipo,
        num_invitados=req.num_invitados,
        rules=rule_definitions,
    ))

    # Proveedores
    provider_repo = ProviderRepository(db)
    db_providers = await provider_repo.get_available_for_event(EventType(req.evento_tipo), event_date)
    provider_options = [
        ProviderOption(
            id=p.id, service_id=p.servicio_id,
            service_name=p.servicio.nombre if p.servicio else str(p.servicio_id),
            nombre=p.nombre, costo=p.costo_base, quality_index=p.indice_calidad,
            tipos_evento_compatibles=p.tipos_evento_compatibles,
            fechas_no_disponibles=p.fechas_no_disponibles,
        )
        for p in db_providers
    ]

    # Paquetes
    package_cost = 0.0
    selected_pkg_info = None
    db_pkgs_result = await db.execute(select(BasePackage).where(BasePackage.is_active == True))  # noqa: E712
    db_pkgs = list(db_pkgs_result.scalars().all())
    if db_pkgs:
        pkg_list = [
            ServicePackageSvc(id=p.id, name=p.name, content=p.content,
                              cost=p.cost, min_guests=p.min_guests, max_guests=p.max_guests)
            for p in db_pkgs
        ]
        try:
            pkg_result = select_package(req.num_invitados, pkg_list)
            if pkg_result.selected_package:
                package_cost = pkg_result.selected_package.cost
                selected_pkg_info = {"id": pkg_result.selected_package.id, "name": pkg_result.selected_package.name, "cost": pkg_result.selected_package.cost}
        except NoPackagesConfiguredError:
            pass

    available_budget = max(0.0, req.presupuesto_maximo - package_cost)
    quot_repo = QuotationRepository(db)
    version = await quot_repo.get_next_version(event.id)

    mensaje_json = {"mensaje_cliente": req.mensaje.strip()} if req.mensaje and req.mensaje.strip() else {}

    q_basica = Quotation(
        cliente_id=user.id, evento_id=event.id, version=version,
        nivel=QuotationLevel.BASICO, estado=QuotationStatus.PROCESANDO,
        parametros_json={"event_type": req.evento_tipo, "num_invitados": req.num_invitados,
                         "budget": req.presupuesto_maximo, "package_selected": selected_pkg_info, **mensaje_json},
    )
    q_premium = Quotation(
        cliente_id=user.id, evento_id=event.id, version=version,
        nivel=QuotationLevel.PREMIUM, estado=QuotationStatus.PROCESANDO,
        parametros_json={"event_type": req.evento_tipo, "num_invitados": req.num_invitados,
                         "budget": req.presupuesto_maximo * 1.3, "package_selected": selected_pkg_info, **mensaje_json},
    )
    db.add(q_basica)
    db.add(q_premium)
    await db.flush()

    opt_input = OptimizationInput(
        budget=available_budget,
        required_services=rule_result.required_services,
        optional_services=rule_result.optional_services,
        event_type=req.evento_tipo,
        event_date=event_date,
        providers=provider_options,
    )

    basica, premium, res_basica, res_premium = generate_proposals(
        base_input=opt_input,
        quotation_id_base=q_basica.id,
        quotation_id_premium=q_premium.id,
        evento_tipo=req.evento_tipo,
        evento_fecha=event_date,
        num_invitados=req.num_invitados,
        estilo=req.estilo,
        cliente_nombre=user.nombre,
        version=version,
    )

    for quotation, result in [(q_basica, res_basica), (q_premium, res_premium)]:
        if result.feasible:
            for sp in result.selected_providers:
                db.add(QuotationDetail(
                    cotizacion_id=quotation.id,
                    proveedor_id=sp.provider_id,
                    costo_negociado=sp.costo,
                    es_obligatorio=sp.es_obligatorio,
                    nombre_servicio=sp.service_name,
                ))
            quotation.estado = QuotationStatus.COMPLETADO
            quotation.costo_total = result.total_cost + package_cost
            quotation.quality_score = result.quality_score
        else:
            quotation.estado = QuotationStatus.ERROR

    await db.flush()

    token = create_access_token({"sub": str(user.id)})
    return RegisterAndQuoteResponse(
        access_token=token,
        user_id=user.id,
        role=user.role.value,
        nombre=user.nombre,
        quotation_basica_id=q_basica.id,
        quotation_premium_id=q_premium.id,
        basica_factible=res_basica.feasible,
        premium_factible=res_premium.feasible,
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email, User.is_active == True))  # noqa: E712
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user_id=user.id, role=user.role.value, nombre=user.nombre)
