"""
Endpoints públicos — acceso sin autenticación de staff.

Rutas bajo /public no usan get_current_user.
El acceso se controla mediante tokens firmados de cliente (JWT).
"""
import io
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.api.schemas.public_quotation import (
    CondicionesPago,
    EventoPublico,
    PaqueteBase,
    PublicQuotationResponse,
    ServicioExterno,
    SolicitudAjuste,
    SolicitudAjusteCreate,
    VersionAnterior,
)
from backend.core.database import get_db
from backend.models.models import (
    BasePackage,
    Provider,
    Quotation,
    QuotationDetail,
    QuotationRequest,
    QuotationStatus,
)
from backend.modules.auth.client_tokens import verify_client_token
from backend.modules.pdf_gen.generator import generate_pdf, is_pdf_available
from backend.modules.proposal_gen.schemas import Proposal, ProposalItem

router = APIRouter(prefix="/public", tags=["Público"])


@router.get("/quotations/by-token", response_model=PublicQuotationResponse)
async def get_quotation_by_token(
    token: str = Query(..., description="Token firmado emitido por approve-and-share"),
    db: AsyncSession = Depends(get_db),
):
    try:
        payload = verify_client_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    quotation_id: int = payload["qid"]
    expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc).isoformat()

    result = await db.execute(
        select(Quotation)
        .where(Quotation.id == quotation_id)
        .options(
            selectinload(Quotation.evento),
            selectinload(Quotation.detalles)
            .selectinload(QuotationDetail.proveedor)
            .selectinload(Provider.servicio),
        )
    )
    quotation = result.scalar_one_or_none()
    if not quotation:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")

    if quotation.estado in (QuotationStatus.CANCELADA, QuotationStatus.RECHAZADA):
        raise HTTPException(status_code=403, detail="Esta cotización no está disponible")

    # Paquete base — carga desde BD para obtener contenido completo
    paquete: PaqueteBase | None = None
    pkg_info = (quotation.parametros_json or {}).get("package_selected")
    if pkg_info and pkg_info.get("id"):
        pkg_row = await db.execute(
            select(BasePackage).where(BasePackage.id == pkg_info["id"])
        )
        pkg = pkg_row.scalar_one_or_none()
        paquete = PaqueteBase(
            nombre=pkg.name if pkg else pkg_info.get("name", "Paquete base"),
            contenido=pkg.content if pkg else "",
            costo=pkg.cost if pkg else pkg_info.get("cost", 0.0),
        )

    # Servicios externos — excluye nombre y ID de proveedor
    servicios = [
        ServicioExterno(
            categoria=(
                d.proveedor.servicio.tipo
                if d.proveedor and d.proveedor.servicio
                else d.nombre_servicio
            ),
            descripcion=d.nombre_servicio,
            costo=d.costo_negociado,
            es_obligatorio=d.es_obligatorio,
        )
        for d in quotation.detalles
    ]

    # Narrativa — almacenada en parametros_json si fue generada previamente
    narrativa: str | None = (quotation.parametros_json or {}).get("narrative")

    # Versiones anteriores del mismo evento + nivel — sin datos internos
    prev_result = await db.execute(
        select(Quotation)
        .where(
            Quotation.evento_id == quotation.evento_id,
            Quotation.nivel == quotation.nivel,
            Quotation.version < quotation.version,
        )
        .order_by(Quotation.version)
    )
    versiones_anteriores = [
        VersionAnterior(
            id=q.id,
            version=q.version,
            costo_total=q.costo_total,
            created_at=q.created_at.isoformat() if q.created_at else "",
        )
        for q in prev_result.scalars().all()
    ]

    evento = quotation.evento
    return PublicQuotationResponse(
        id=quotation.id,
        evento=EventoPublico(
            tipo=evento.tipo.value,
            fecha=evento.fecha,
            num_invitados=evento.num_invitados,
            estilo=evento.estilo,
        ),
        paquete_base=paquete,
        servicios_externos=servicios,
        narrativa=narrativa,
        costo_total=quotation.costo_total,
        presupuesto_cliente=evento.presupuesto_maximo,
        condiciones_pago=CondicionesPago(),
        versiones_anteriores=versiones_anteriores,
        expires_at=expires_at,
    )


@router.get("/quotations/by-token/pdf")
async def get_quotation_pdf_by_token(
    token: str = Query(..., description="Token firmado emitido por approve-and-share"),
    db: AsyncSession = Depends(get_db),
):
    """Descarga el PDF de la propuesta sin login. Versión cliente: sin nombres de proveedores."""
    try:
        payload = verify_client_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    quotation_id: int = payload["qid"]

    result = await db.execute(
        select(Quotation)
        .where(Quotation.id == quotation_id)
        .options(
            selectinload(Quotation.evento),
            selectinload(Quotation.cliente),
            selectinload(Quotation.detalles)
            .selectinload(QuotationDetail.proveedor),
        )
    )
    quotation = result.scalar_one_or_none()
    if not quotation:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")

    if quotation.estado in (QuotationStatus.CANCELADA, QuotationStatus.RECHAZADA):
        raise HTTPException(status_code=403, detail="Esta cotización no está disponible")

    evento = quotation.evento
    items = [
        ProposalItem(
            servicio=d.nombre_servicio,
            proveedor="",  # show_providers=False oculta este campo en el template
            costo=d.costo_negociado,
            es_obligatorio=d.es_obligatorio,
            quality_index=d.proveedor.indice_calidad if d.proveedor else 0.5,
        )
        for d in quotation.detalles
    ]

    narrative = (quotation.parametros_json or {}).get("narrative", "")

    proposal = Proposal(
        quotation_id=quotation.id,
        nivel=quotation.nivel.value,
        evento_tipo=evento.tipo.value,
        evento_fecha=evento.fecha,
        num_invitados=evento.num_invitados,
        estilo=evento.estilo,
        presupuesto_maximo=evento.presupuesto_maximo,
        cliente_nombre=quotation.cliente.nombre or "Cliente",
        items=items,
        costo_total=quotation.costo_total or 0.0,
        quality_score=quotation.quality_score or 0.0,
        algorithm_used="GREEDY",
        generated_at=datetime.now(timezone.utc),
        version=quotation.version,
        narrative=narrative,
        show_providers=False,  # versión cliente — nunca expone proveedores
    )

    content_bytes = generate_pdf(proposal)

    tipo_str = evento.tipo.value
    fecha_str = evento.fecha.isoformat()

    if is_pdf_available():
        return StreamingResponse(
            io.BytesIO(content_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="propuesta_{tipo_str}_{fecha_str}.pdf"'
            },
        )
    # Fallback HTML imprimible (dev sin WeasyPrint nativo)
    return StreamingResponse(
        io.BytesIO(content_bytes),
        media_type="text/html; charset=utf-8",
        headers={
            "Content-Disposition": f'inline; filename="propuesta_{tipo_str}_{fecha_str}.html"'
        },
    )


# ─── Helpers para endpoints de solicitudes ───────────────────────────────────

def _check_scope(payload: dict[str, Any], required: str) -> None:
    """Lanza 403 si el scope del token no incluye el permiso requerido."""
    scope: list[str] = payload.get("scope", [])
    if required not in scope:
        raise HTTPException(
            status_code=403,
            detail=f"Este enlace no tiene permiso para '{required}'",
        )


async def _load_quotation_from_token(
    token: str, db: AsyncSession
) -> tuple[dict[str, Any], "Quotation"]:  # type: ignore[type-arg]
    """Valida token, retorna (payload, quotation). Lanza 401/404/403 si falla."""
    try:
        payload = verify_client_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    quotation_id: int = payload["qid"]
    result = await db.execute(
        select(Quotation).where(Quotation.id == quotation_id)
    )
    quotation = result.scalar_one_or_none()
    if not quotation:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    if quotation.estado in (QuotationStatus.CANCELADA, QuotationStatus.RECHAZADA):
        raise HTTPException(status_code=403, detail="Esta cotización no está disponible")

    return payload, quotation


# ─── Solicitudes de ajuste ────────────────────────────────────────────────────

@router.post("/quotations/by-token/requests", response_model=SolicitudAjuste, status_code=201)
async def create_public_request(
    token: str = Query(...),
    body: SolicitudAjusteCreate = Body(...),
    db: AsyncSession = Depends(get_db),
):
    """Crea solicitud de ajuste desde el enlace firmado del cliente."""
    payload, quotation = await _load_quotation_from_token(token, db)
    _check_scope(payload, "request_adjustment")

    req = QuotationRequest(
        quotation_id=quotation.id,
        cliente_id=quotation.cliente_id,
        mensaje=body.mensaje,
        estado="pendiente",
        created_at=datetime.now(timezone.utc),
    )
    db.add(req)
    await db.flush()

    return SolicitudAjuste(
        id=req.id,
        mensaje=req.mensaje,
        estado=req.estado,
        created_at=req.created_at.isoformat(),
    )


@router.get("/quotations/by-token/requests", response_model=list[SolicitudAjuste])
async def list_public_requests(
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Lista solicitudes de ajuste anteriores del cliente para esta cotización."""
    payload, quotation = await _load_quotation_from_token(token, db)
    _check_scope(payload, "request_adjustment")

    result = await db.execute(
        select(QuotationRequest)
        .where(QuotationRequest.quotation_id == quotation.id)
        .order_by(QuotationRequest.created_at.asc())
    )
    requests = result.scalars().all()

    return [
        SolicitudAjuste(
            id=r.id,
            mensaje=r.mensaje,
            estado=r.estado,
            created_at=r.created_at.isoformat(),
        )
        for r in requests
    ]
