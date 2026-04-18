"""
Script de seed: crea datos iniciales necesarios para que el sistema funcione.

Crea:
  - 1 usuario admin
  - 1 usuario ejecutivo de prueba
  - Catálogo de servicios (catering, decoracion, etc.)
  - Catálogo de proveedores con datos realistas para Lima/Perú
  - Reglas de negocio por tipo de evento

Uso:
    python -m scripts.seed
    python -m scripts.seed --reset   (elimina datos existentes antes de insertar)
"""
import argparse
import asyncio
import sys
from pathlib import Path

# Agregar raíz al path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import delete, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from backend.core.config import get_settings
from backend.core.security import hash_password
from backend.models.models import (
    BusinessRule,
    EventType,
    Provider,
    Service,
    User,
    UserRole,
)

settings = get_settings()

engine = create_async_engine(settings.DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# ---------------------------------------------------------------------------
# Datos de seed
# ---------------------------------------------------------------------------

SERVICES = [
    {"id": 1,  "nombre": "catering",              "tipo": "alimentacion",  "descripcion": "Servicio de alimentación y bebidas para el evento"},
    {"id": 2,  "nombre": "decoracion",             "tipo": "ambientacion",  "descripcion": "Decoración temática y ambientación del espacio"},
    {"id": 3,  "nombre": "fotografia",             "tipo": "multimedia",    "descripcion": "Fotografía profesional del evento"},
    {"id": 4,  "nombre": "videografia",            "tipo": "multimedia",    "descripcion": "Filmación y edición de video del evento"},
    {"id": 5,  "nombre": "musica",                 "tipo": "entretenimiento","descripcion": "DJ, banda o grupo musical"},
    {"id": 6,  "nombre": "iluminacion",            "tipo": "tecnico",       "descripcion": "Diseño e instalación de iluminación especial"},
    {"id": 7,  "nombre": "mobiliario",             "tipo": "logistica",     "descripcion": "Sillas, mesas, carpas y mobiliario de evento"},
    {"id": 8,  "nombre": "flores",                 "tipo": "ambientacion",  "descripcion": "Arreglos florales y centros de mesa"},
    {"id": 9,  "nombre": "torta",                  "tipo": "alimentacion",  "descripcion": "Torta de celebración personalizada"},
    {"id": 10, "nombre": "transporte",             "tipo": "logistica",     "descripcion": "Transporte de invitados y traslados"},
    {"id": 11, "nombre": "animacion",              "tipo": "entretenimiento","descripcion": "Animadores, show infantil, magos, etc."},
    {"id": 12, "nombre": "sonido",                 "tipo": "tecnico",       "descripcion": "Sistema de sonido profesional y micrófonos"},
    {"id": 13, "nombre": "maestro_de_ceremonias",  "tipo": "entretenimiento","descripcion": "MC y conductor del evento"},
    {"id": 14, "nombre": "seguridad",              "tipo": "logistica",     "descripcion": "Personal de seguridad y control de acceso"},
]

ALL_EVENTS = ["boda", "corporativo", "cumpleanos", "quinceanos", "conferencia", "otro"]
SOCIAL = ["boda", "cumpleanos", "quinceanos", "otro"]
CORPORATE = ["corporativo", "conferencia"]

PROVIDERS = [
    # CATERING (servicio_id=1)
    {"nombre": "Gourmet Perú Catering",     "servicio_id": 1, "costo_base": 4500, "indice_calidad": 0.92, "puntuacion_historica": 0.95, "experiencia_en_tipo_evento": 0.90, "tipos": ALL_EVENTS},
    {"nombre": "Sabores del Perú",           "servicio_id": 1, "costo_base": 3200, "indice_calidad": 0.82, "puntuacion_historica": 0.80, "experiencia_en_tipo_evento": 0.85, "tipos": ALL_EVENTS},
    {"nombre": "Catering Express Lima",      "servicio_id": 1, "costo_base": 1800, "indice_calidad": 0.68, "puntuacion_historica": 0.65, "experiencia_en_tipo_evento": 0.70, "tipos": ALL_EVENTS},
    {"nombre": "Mesa Real Eventos",          "servicio_id": 1, "costo_base": 5800, "indice_calidad": 0.96, "puntuacion_historica": 0.97, "experiencia_en_tipo_evento": 0.95, "tipos": ALL_EVENTS},

    # DECORACION (servicio_id=2)
    {"nombre": "Detalles & Sueños",          "servicio_id": 2, "costo_base": 2800, "indice_calidad": 0.90, "puntuacion_historica": 0.92, "experiencia_en_tipo_evento": 0.88, "tipos": SOCIAL},
    {"nombre": "Ambientes Lima",             "servicio_id": 2, "costo_base": 1500, "indice_calidad": 0.72, "puntuacion_historica": 0.70, "experiencia_en_tipo_evento": 0.75, "tipos": ALL_EVENTS},
    {"nombre": "Decora Fácil",               "servicio_id": 2, "costo_base": 800,  "indice_calidad": 0.55, "puntuacion_historica": 0.52, "experiencia_en_tipo_evento": 0.58, "tipos": ALL_EVENTS},
    {"nombre": "Studio Deco Miraflores",     "servicio_id": 2, "costo_base": 3500, "indice_calidad": 0.94, "puntuacion_historica": 0.96, "experiencia_en_tipo_evento": 0.92, "tipos": SOCIAL},

    # FOTOGRAFIA (servicio_id=3)
    {"nombre": "Luz y Momento Estudio",      "servicio_id": 3, "costo_base": 2500, "indice_calidad": 0.93, "puntuacion_historica": 0.95, "experiencia_en_tipo_evento": 0.91, "tipos": ALL_EVENTS},
    {"nombre": "Foto Recuerdos Peru",        "servicio_id": 3, "costo_base": 1200, "indice_calidad": 0.70, "puntuacion_historica": 0.68, "experiencia_en_tipo_evento": 0.72, "tipos": ALL_EVENTS},
    {"nombre": "Flash Premium Photography", "servicio_id": 3, "costo_base": 3800, "indice_calidad": 0.97, "puntuacion_historica": 0.98, "experiencia_en_tipo_evento": 0.96, "tipos": ALL_EVENTS},
    {"nombre": "Click Express",              "servicio_id": 3, "costo_base": 700,  "indice_calidad": 0.58, "puntuacion_historica": 0.55, "experiencia_en_tipo_evento": 0.60, "tipos": ALL_EVENTS},

    # VIDEOGRAFIA (servicio_id=4)
    {"nombre": "Cine & Bodas Peru",          "servicio_id": 4, "costo_base": 2200, "indice_calidad": 0.88, "puntuacion_historica": 0.90, "experiencia_en_tipo_evento": 0.86, "tipos": SOCIAL},
    {"nombre": "Video Memories",             "servicio_id": 4, "costo_base": 1400, "indice_calidad": 0.72, "puntuacion_historica": 0.70, "experiencia_en_tipo_evento": 0.74, "tipos": ALL_EVENTS},
    {"nombre": "4K Events Video",            "servicio_id": 4, "costo_base": 3200, "indice_calidad": 0.94, "puntuacion_historica": 0.95, "experiencia_en_tipo_evento": 0.93, "tipos": ALL_EVENTS},

    # MUSICA (servicio_id=5)
    {"nombre": "DJ Master Ballroom",         "servicio_id": 5, "costo_base": 1800, "indice_calidad": 0.88, "puntuacion_historica": 0.90, "experiencia_en_tipo_evento": 0.86, "tipos": SOCIAL},
    {"nombre": "Orquesta Sabor Latino",      "servicio_id": 5, "costo_base": 4500, "indice_calidad": 0.95, "puntuacion_historica": 0.96, "experiencia_en_tipo_evento": 0.94, "tipos": SOCIAL},
    {"nombre": "DJ Express Lima",            "servicio_id": 5, "costo_base": 800,  "indice_calidad": 0.62, "puntuacion_historica": 0.60, "experiencia_en_tipo_evento": 0.64, "tipos": ALL_EVENTS},
    {"nombre": "Piano & Jazz Trio",          "servicio_id": 5, "costo_base": 2800, "indice_calidad": 0.85, "puntuacion_historica": 0.87, "experiencia_en_tipo_evento": 0.83, "tipos": ["boda", "corporativo", "conferencia"]},

    # ILUMINACION (servicio_id=6)
    {"nombre": "LightShow Pro Peru",         "servicio_id": 6, "costo_base": 1500, "indice_calidad": 0.87, "puntuacion_historica": 0.89, "experiencia_en_tipo_evento": 0.85, "tipos": ALL_EVENTS},
    {"nombre": "Luces & Efectos",            "servicio_id": 6, "costo_base": 900,  "indice_calidad": 0.70, "puntuacion_historica": 0.68, "experiencia_en_tipo_evento": 0.72, "tipos": ALL_EVENTS},
    {"nombre": "Illumina Events",            "servicio_id": 6, "costo_base": 2200, "indice_calidad": 0.92, "puntuacion_historica": 0.93, "experiencia_en_tipo_evento": 0.91, "tipos": ALL_EVENTS},

    # MOBILIARIO (servicio_id=7)
    {"nombre": "Rentar&Fiesta Lima",         "servicio_id": 7, "costo_base": 1200, "indice_calidad": 0.80, "puntuacion_historica": 0.82, "experiencia_en_tipo_evento": 0.78, "tipos": ALL_EVENTS},
    {"nombre": "Mobiliario Elite",           "servicio_id": 7, "costo_base": 2500, "indice_calidad": 0.91, "puntuacion_historica": 0.93, "experiencia_en_tipo_evento": 0.89, "tipos": ALL_EVENTS},
    {"nombre": "Sillas & Mesas Express",     "servicio_id": 7, "costo_base": 600,  "indice_calidad": 0.62, "puntuacion_historica": 0.60, "experiencia_en_tipo_evento": 0.64, "tipos": ALL_EVENTS},

    # FLORES (servicio_id=8)
    {"nombre": "Flora & Arte Miraflores",    "servicio_id": 8, "costo_base": 1800, "indice_calidad": 0.93, "puntuacion_historica": 0.95, "experiencia_en_tipo_evento": 0.91, "tipos": SOCIAL},
    {"nombre": "Jardin de Eventos",          "servicio_id": 8, "costo_base": 1000, "indice_calidad": 0.78, "puntuacion_historica": 0.76, "experiencia_en_tipo_evento": 0.80, "tipos": SOCIAL},
    {"nombre": "Flores del Campo Peru",      "servicio_id": 8, "costo_base": 500,  "indice_calidad": 0.60, "puntuacion_historica": 0.58, "experiencia_en_tipo_evento": 0.62, "tipos": ALL_EVENTS},

    # TORTA (servicio_id=9)
    {"nombre": "Pasteleria Arte & Sabor",    "servicio_id": 9, "costo_base": 1200, "indice_calidad": 0.94, "puntuacion_historica": 0.96, "experiencia_en_tipo_evento": 0.92, "tipos": SOCIAL},
    {"nombre": "Sweet Lima Cakes",           "servicio_id": 9, "costo_base": 700,  "indice_calidad": 0.80, "puntuacion_historica": 0.78, "experiencia_en_tipo_evento": 0.82, "tipos": SOCIAL},
    {"nombre": "Tortas Express",             "servicio_id": 9, "costo_base": 350,  "indice_calidad": 0.62, "puntuacion_historica": 0.60, "experiencia_en_tipo_evento": 0.64, "tipos": ALL_EVENTS},

    # TRANSPORTE (servicio_id=10)
    {"nombre": "Lima Transfer VIP",          "servicio_id": 10, "costo_base": 2500, "indice_calidad": 0.90, "puntuacion_historica": 0.92, "experiencia_en_tipo_evento": 0.88, "tipos": ALL_EVENTS},
    {"nombre": "Transporte Eventos Peru",    "servicio_id": 10, "costo_base": 1200, "indice_calidad": 0.72, "puntuacion_historica": 0.70, "experiencia_en_tipo_evento": 0.74, "tipos": ALL_EVENTS},

    # ANIMACION (servicio_id=11)
    {"nombre": "Show Kids Lima",             "servicio_id": 11, "costo_base": 900,  "indice_calidad": 0.85, "puntuacion_historica": 0.87, "experiencia_en_tipo_evento": 0.83, "tipos": ["cumpleanos", "quinceanos", "otro"]},
    {"nombre": "Magia & Risas Peru",         "servicio_id": 11, "costo_base": 600,  "indice_calidad": 0.75, "puntuacion_historica": 0.73, "experiencia_en_tipo_evento": 0.77, "tipos": ["cumpleanos", "quinceanos", "otro"]},
    {"nombre": "Animadores Corporativos",    "servicio_id": 11, "costo_base": 1500, "indice_calidad": 0.80, "puntuacion_historica": 0.82, "experiencia_en_tipo_evento": 0.78, "tipos": CORPORATE},

    # SONIDO (servicio_id=12)
    {"nombre": "Sound Pro Lima",             "servicio_id": 12, "costo_base": 1500, "indice_calidad": 0.88, "puntuacion_historica": 0.90, "experiencia_en_tipo_evento": 0.86, "tipos": ALL_EVENTS},
    {"nombre": "Audio Events Peru",          "servicio_id": 12, "costo_base": 800,  "indice_calidad": 0.72, "puntuacion_historica": 0.70, "experiencia_en_tipo_evento": 0.74, "tipos": ALL_EVENTS},
    {"nombre": "Mega Sound System",          "servicio_id": 12, "costo_base": 2200, "indice_calidad": 0.93, "puntuacion_historica": 0.95, "experiencia_en_tipo_evento": 0.91, "tipos": ALL_EVENTS},

    # MAESTRO DE CEREMONIAS (servicio_id=13)
    {"nombre": "MC Carlos Vidal",            "servicio_id": 13, "costo_base": 1200, "indice_calidad": 0.90, "puntuacion_historica": 0.92, "experiencia_en_tipo_evento": 0.88, "tipos": ["boda", "quinceanos", "corporativo"]},
    {"nombre": "Animadores & MC Lima",       "servicio_id": 13, "costo_base": 700,  "indice_calidad": 0.72, "puntuacion_historica": 0.70, "experiencia_en_tipo_evento": 0.74, "tipos": ALL_EVENTS},

    # SEGURIDAD (servicio_id=14)
    {"nombre": "Seguridad Elite Peru",       "servicio_id": 14, "costo_base": 1800, "indice_calidad": 0.90, "puntuacion_historica": 0.92, "experiencia_en_tipo_evento": 0.88, "tipos": ALL_EVENTS},
    {"nombre": "Protección Eventos SAC",     "servicio_id": 14, "costo_base": 1000, "indice_calidad": 0.75, "puntuacion_historica": 0.73, "experiencia_en_tipo_evento": 0.77, "tipos": ALL_EVENTS},
]

# Reglas de negocio: servicios obligatorios/opcionales por tipo de evento
RULES = [
    # BODA — servicios obligatorios
    {"tipo_evento": "boda", "servicio_id": 1, "es_obligatorio": True,  "descripcion": "Catering obligatorio para boda"},
    {"tipo_evento": "boda", "servicio_id": 2, "es_obligatorio": True,  "descripcion": "Decoracion obligatoria para boda"},
    {"tipo_evento": "boda", "servicio_id": 3, "es_obligatorio": True,  "descripcion": "Fotografia obligatoria para boda"},
    {"tipo_evento": "boda", "servicio_id": 5, "es_obligatorio": True,  "descripcion": "Musica obligatoria para boda"},
    {"tipo_evento": "boda", "servicio_id": 8, "es_obligatorio": True,  "descripcion": "Flores obligatorias para boda"},
    {"tipo_evento": "boda", "servicio_id": 9, "es_obligatorio": True,  "descripcion": "Torta obligatoria para boda"},
    # BODA — opcionales
    {"tipo_evento": "boda", "servicio_id": 4,  "es_obligatorio": False, "descripcion": "Videografia opcional boda"},
    {"tipo_evento": "boda", "servicio_id": 6,  "es_obligatorio": False, "descripcion": "Iluminacion opcional boda"},
    {"tipo_evento": "boda", "servicio_id": 10, "es_obligatorio": False, "descripcion": "Transporte opcional boda"},
    {"tipo_evento": "boda", "servicio_id": 13, "es_obligatorio": False, "descripcion": "MC opcional boda"},
    {"tipo_evento": "boda", "servicio_id": 14, "es_obligatorio": False, "descripcion": "Seguridad opcional boda (>200 invitados)", "condicion": {"min_invitados": 200}},

    # CORPORATIVO — obligatorios
    {"tipo_evento": "corporativo", "servicio_id": 1,  "es_obligatorio": True,  "descripcion": "Catering obligatorio corporativo"},
    {"tipo_evento": "corporativo", "servicio_id": 12, "es_obligatorio": True,  "descripcion": "Sonido obligatorio corporativo"},
    {"tipo_evento": "corporativo", "servicio_id": 6,  "es_obligatorio": True,  "descripcion": "Iluminacion obligatoria corporativo"},
    {"tipo_evento": "corporativo", "servicio_id": 7,  "es_obligatorio": True,  "descripcion": "Mobiliario obligatorio corporativo"},
    # CORPORATIVO — opcionales
    {"tipo_evento": "corporativo", "servicio_id": 3,  "es_obligatorio": False, "descripcion": "Fotografia opcional corporativo"},
    {"tipo_evento": "corporativo", "servicio_id": 4,  "es_obligatorio": False, "descripcion": "Videografia opcional corporativo"},
    {"tipo_evento": "corporativo", "servicio_id": 2,  "es_obligatorio": False, "descripcion": "Decoracion opcional corporativo"},

    # CUMPLEANOS — obligatorios
    {"tipo_evento": "cumpleanos", "servicio_id": 1, "es_obligatorio": True,  "descripcion": "Catering obligatorio cumpleanos"},
    {"tipo_evento": "cumpleanos", "servicio_id": 2, "es_obligatorio": True,  "descripcion": "Decoracion obligatoria cumpleanos"},
    {"tipo_evento": "cumpleanos", "servicio_id": 9, "es_obligatorio": True,  "descripcion": "Torta obligatoria cumpleanos"},
    # CUMPLEANOS — opcionales
    {"tipo_evento": "cumpleanos", "servicio_id": 3,  "es_obligatorio": False, "descripcion": "Fotografia opcional cumpleanos"},
    {"tipo_evento": "cumpleanos", "servicio_id": 5,  "es_obligatorio": False, "descripcion": "Musica opcional cumpleanos"},
    {"tipo_evento": "cumpleanos", "servicio_id": 11, "es_obligatorio": False, "descripcion": "Animacion opcional cumpleanos"},

    # QUINCEANOS — obligatorios
    {"tipo_evento": "quinceanos", "servicio_id": 1, "es_obligatorio": True,  "descripcion": "Catering obligatorio quinceanos"},
    {"tipo_evento": "quinceanos", "servicio_id": 2, "es_obligatorio": True,  "descripcion": "Decoracion obligatoria quinceanos"},
    {"tipo_evento": "quinceanos", "servicio_id": 3, "es_obligatorio": True,  "descripcion": "Fotografia obligatoria quinceanos"},
    {"tipo_evento": "quinceanos", "servicio_id": 5, "es_obligatorio": True,  "descripcion": "Musica obligatoria quinceanos"},
    {"tipo_evento": "quinceanos", "servicio_id": 8, "es_obligatorio": True,  "descripcion": "Flores obligatorias quinceanos"},
    {"tipo_evento": "quinceanos", "servicio_id": 9, "es_obligatorio": True,  "descripcion": "Torta obligatoria quinceanos"},
    # QUINCEANOS — opcionales
    {"tipo_evento": "quinceanos", "servicio_id": 4,  "es_obligatorio": False, "descripcion": "Videografia opcional quinceanos"},
    {"tipo_evento": "quinceanos", "servicio_id": 6,  "es_obligatorio": False, "descripcion": "Iluminacion opcional quinceanos"},
    {"tipo_evento": "quinceanos", "servicio_id": 13, "es_obligatorio": False, "descripcion": "MC opcional quinceanos"},

    # CONFERENCIA — obligatorios
    {"tipo_evento": "conferencia", "servicio_id": 12, "es_obligatorio": True,  "descripcion": "Sonido obligatorio conferencia"},
    {"tipo_evento": "conferencia", "servicio_id": 6,  "es_obligatorio": True,  "descripcion": "Iluminacion obligatoria conferencia"},
    {"tipo_evento": "conferencia", "servicio_id": 7,  "es_obligatorio": True,  "descripcion": "Mobiliario obligatorio conferencia"},
    {"tipo_evento": "conferencia", "servicio_id": 1,  "es_obligatorio": True,  "descripcion": "Catering obligatorio conferencia"},
    # CONFERENCIA — opcionales
    {"tipo_evento": "conferencia", "servicio_id": 3, "es_obligatorio": False, "descripcion": "Fotografia opcional conferencia"},
    {"tipo_evento": "conferencia", "servicio_id": 4, "es_obligatorio": False, "descripcion": "Videografia opcional conferencia"},
]

USERS = [
    {
        "nombre": "Administrador Sistema",
        "email": "admin@inari.pe",
        "password": "admin123",
        "role": UserRole.ADMIN,
        "telefono": "999000001",
    },
    {
        "nombre": "Carlos Ejecutivo",
        "email": "ejecutivo@inari.pe",
        "password": "exec123",
        "role": UserRole.EJECUTIVO,
        "telefono": "999000002",
    },
    {
        "nombre": "María Cliente Demo",
        "email": "cliente@inari.pe",
        "password": "demo123",
        "role": UserRole.CLIENTE,
        "telefono": "999000003",
    },
]


# ---------------------------------------------------------------------------
# Funciones de seed
# ---------------------------------------------------------------------------

async def reset_data(session: AsyncSession) -> None:
    """Elimina datos existentes en orden correcto (FK constraints)."""
    print("Eliminando datos existentes...")
    for table in [
        "optimization_logs", "quotation_details", "quotations",
        "reference_images", "events", "business_rules",
        "providers", "services", "users",
    ]:
        await session.execute(text(f"DELETE FROM {table}"))
        await session.execute(text(f"ALTER SEQUENCE IF EXISTS {table}_id_seq RESTART WITH 1"))
    await session.commit()
    print("  Datos eliminados.")


async def seed_services(session: AsyncSession) -> dict[str, int]:
    """Inserta servicios y retorna {nombre: id}."""
    print("Insertando servicios...")
    service_map = {}
    for s in SERVICES:
        service = Service(
            nombre=s["nombre"],
            tipo=s["tipo"],
            descripcion=s.get("descripcion"),
        )
        session.add(service)
        await session.flush()
        service_map[s["nombre"]] = service.id
        print(f"  + {s['nombre']} (id={service.id})")
    return service_map


async def seed_providers(session: AsyncSession) -> None:
    """Inserta proveedores con datos realistas."""
    print("Insertando proveedores...")
    for p in PROVIDERS:
        provider = Provider(
            nombre=p["nombre"],
            servicio_id=p["servicio_id"],
            costo_base=p["costo_base"],
            indice_calidad=p["indice_calidad"],
            puntuacion_historica=p["puntuacion_historica"],
            experiencia_en_tipo_evento=p["experiencia_en_tipo_evento"],
            tipos_evento_compatibles=p["tipos"],
            fechas_no_disponibles=[],
        )
        session.add(provider)
    await session.flush()
    print(f"  {len(PROVIDERS)} proveedores insertados.")


async def seed_rules(session: AsyncSession) -> None:
    """Inserta reglas de negocio por tipo de evento."""
    print("Insertando reglas de negocio...")
    for r in RULES:
        rule = BusinessRule(
            tipo_evento=EventType(r["tipo_evento"]),
            servicio_id=r["servicio_id"],
            es_obligatorio=r["es_obligatorio"],
            descripcion=r.get("descripcion"),
            condicion=r.get("condicion"),
        )
        session.add(rule)
    await session.flush()
    print(f"  {len(RULES)} reglas insertadas.")


async def seed_users(session: AsyncSession) -> None:
    """Inserta usuarios de prueba."""
    print("Insertando usuarios...")
    for u in USERS:
        user = User(
            nombre=u["nombre"],
            email=u["email"],
            hashed_password=hash_password(u["password"]),
            role=u["role"],
            telefono=u.get("telefono"),
        )
        session.add(user)
    await session.flush()
    print(f"  {len(USERS)} usuarios insertados.")
    print()
    print("  Credenciales de acceso:")
    for u in USERS:
        print(f"    {u['role'].value:12} | {u['email']:30} | pass: {u['password']}")


async def main(reset: bool = False) -> None:
    async with SessionLocal() as session:
        if reset:
            await reset_data(session)
        else:
            # Idempotente: skip si ya hay datos (Docker restart seguro)
            count = await session.scalar(select(func.count()).select_from(Service))
            if count and count > 0:
                print(f"Seed ya ejecutado ({count} servicios). Saltando.")
                return

        await seed_services(session)
        await seed_providers(session)
        await seed_rules(session)
        await seed_users(session)

        await session.commit()
        print()
        print("Seed completado exitosamente.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed inicial de la BD")
    parser.add_argument("--reset", action="store_true", help="Eliminar datos antes de insertar")
    args = parser.parse_args()
    asyncio.run(main(reset=args.reset))
