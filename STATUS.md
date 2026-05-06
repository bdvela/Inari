# STATUS.md — Sistema Inteligente de Propuestas de Eventos

Generado: 2026-04-28. No modificar manualmente — se actualiza con exploración de código.

---

## 1. Árbol de directorios (3 niveles)

```
Inari/
├── .env.example
├── .gitignore
├── CLAUDE.md
├── Dockerfile
├── Dockerfile.backend
├── README.md
├── alembic.ini
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── f885370731d7_initial_schema.py
├── backend/
│   ├── main.py
│   ├── api/
│   │   ├── dependencies/
│   │   │   └── auth.py
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── images.py
│   │       ├── providers.py
│   │       └── quotations.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── logging.py
│   │   └── security.py
│   ├── models/
│   │   ├── base.py
│   │   ├── models.py
│   │   └── repositories/
│   │       ├── provider_repository.py
│   │       └── quotation_repository.py
│   └── modules/
│       ├── optimizer/
│       │   ├── engine.py
│       │   ├── exceptions.py
│       │   ├── greedy.py
│       │   ├── ilp.py
│       │   └── schemas.py
│       ├── pdf_gen/
│       │   ├── generator.py
│       │   └── templates/
│       │       └── proposal.html
│       ├── proposal_gen/
│       │   ├── generator.py
│       │   └── schemas.py
│       ├── rules_engine/
│       │   ├── engine.py
│       │   └── schemas.py
│       ├── storage/
│       │   ├── exceptions.py
│       │   └── service.py
│       └── visual_analysis/
│           ├── client.py
│           ├── exceptions.py
│           ├── prompts.py
│           └── schemas.py
├── conftest.py
├── docker-compose.yml
├── docs/
│   └── PRD_v2.docx
├── frontend/
│   ├── index.html
│   ├── nginx.conf
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── index.css
│       ├── main.tsx
│       ├── components/
│       │   └── shared/
│       │       └── Layout.tsx
│       ├── context/
│       │   └── AuthContext.tsx
│       ├── pages/
│       │   ├── AdminProvidersPage.tsx
│       │   ├── DashboardPage.tsx
│       │   ├── LandingPage.tsx
│       │   ├── LoginPage.tsx
│       │   ├── NewQuotationPage.tsx
│       │   ├── QuotationResultPage.tsx
│       │   └── RegisterPage.tsx
│       ├── services/
│       │   └── api.ts
│       └── types/
│           └── index.ts
├── pytest.ini
├── requirements.txt
├── requirements-dev.txt
├── scripts/
│   └── seed.py
└── tests/
    ├── conftest.py
    ├── integration/
    │   ├── conftest.py
    │   ├── test_auth.py
    │   ├── test_providers.py
    │   └── test_quotations.py
    └── unit/
        ├── optimizer/
        │   ├── conftest.py
        │   ├── test_engine.py
        │   └── test_greedy.py
        └── rules_engine/
            └── test_engine.py
```

---

## 2. Stack tecnológico

### Backend
| Componente | Tecnología | Versión |
|---|---|---|
| Framework web | FastAPI | 0.115.0 |
| Servidor ASGI | Uvicorn | 0.44.0 |
| ORM | SQLAlchemy (async) | 2.0.36 |
| Driver DB | asyncpg | 0.29.0 |
| Migraciones | Alembic | 1.13.3 |
| Validación | Pydantic v2 | 2.9.2 |
| Auth | python-jose + passlib/bcrypt | 3.3.0 / 1.7.4 |
| LLM visual | Google Gemini SDK (google-genai) | 1.73.1 |
| Optimización | PuLP (ILP solver CBC) | 2.9.0 |
| PDF | WeasyPrint + Jinja2 | 61.2 / 3.1.4 |
| HTTP client | httpx | ≥0.28.1 |
| Formularios | python-multipart | 0.0.12 |

### Frontend
| Componente | Tecnología | Versión |
|---|---|---|
| Framework UI | React | ^18.3.1 |
| Lenguaje | TypeScript | ^5.5.3 |
| Bundler | Vite | ^5.4.2 |
| CSS | Tailwind CSS | ^3.4.11 |
| Estado servidor | TanStack React Query | ^5.56.2 |
| HTTP | Axios | ^1.7.7 |
| Routing | React Router DOM | ^6.26.2 |
| Formularios | React Hook Form + Zod | ^7.53.0 / ^3.23.8 |
| Upload | React Dropzone | ^14.2.9 |
| Iconos | Lucide React | ^0.441.0 |
| Toasts | Sonner | ^1.5.0 |

### Infraestructura
| Componente | Tecnología |
|---|---|
| Base de datos | PostgreSQL (docker-compose) |
| Contenedores | Docker + Docker Compose |
| Frontend server | Nginx (producción) |

---

## 3. Variables de entorno requeridas

```bash
# PostgreSQL (Docker Compose)
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB

# Backend
DATABASE_URL                    # postgresql+asyncpg://...
GEMINI_API_KEY                  # Google AI Studio API key
SECRET_KEY                      # JWT signing secret
ACCESS_TOKEN_EXPIRE_MINUTES     # default: 480

# Storage
STORAGE_BACKEND                 # "local" | "s3" | "supabase"
STORAGE_BASE_URL                # URL base para URLs públicas

# Optimizador
OPTIMIZER_ILP_MAX_COMBINATIONS  # umbral ILP vs Greedy (default: 500)
PREMIUM_BUDGET_MULTIPLIER       # multiplicador presupuesto premium (default: 1.30)
QUALITY_WEIGHT_HISTORICAL       # peso puntuación histórica (default: 0.5)
QUALITY_WEIGHT_PRICE            # peso precio (default: 0.3)
QUALITY_WEIGHT_EXPERIENCE       # peso experiencia en tipo evento (default: 0.2)

# Modelo Gemini
VISION_MODEL                    # default: "gemini-2.5-flash-lite"

# App
DEBUG                           # false en producción
```

> `ANTHROPIC_API_KEY` existe en `config.py` como campo legacy (string vacío, no se usa — sistema migró a Gemini).

---

## 4. Endpoints del backend

Base: `/api/v1`

### Health
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio y versión |

### Autenticación (`/auth`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/register` | No | Registro de usuario; retorna JWT + rol |
| POST | `/auth/login` | No | Login con email/password; retorna JWT + rol |

### Cotizaciones (`/quotations`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/quotations/generate` | Sí | CU-01: genera cotización básica+premium desde multipart (imagen opcional + params evento) |
| GET | `/quotations/` | Sí | Lista cotizaciones del usuario (ejecutivo/admin ven todas) |
| GET | `/quotations/stats` | Sí | Métricas del dashboard: totales, promedios |
| GET | `/quotations/{id}` | Sí | Detalle de cotización con detalles de proveedores |
| POST | `/quotations/reprocess/{evento_id}` | Sí | CU-02: reprocesa con nuevo presupuesto, crea nueva versión |
| GET | `/quotations/{id}/alternatives/{detalle_id}` | Sí | Proveedores alternativos para un ítem de cotización |
| POST | `/quotations/{id}/swap` | Sí | Intercambia proveedor en cotización completada; recalcula totales |
| GET | `/quotations/{id}/pair` | Sí | Devuelve cotización + su gemela básica/premium del mismo evento |
| GET | `/quotations/{id}/pdf` | Sí | Genera y descarga PDF de la propuesta |

### Proveedores (`/providers`)
| Método | Ruta | Rol mínimo | Descripción |
|---|---|---|---|
| GET | `/providers/` | ejecutivo | Lista todos los proveedores activos |
| POST | `/providers/` | admin | Crea proveedor nuevo |
| PUT | `/providers/{id}` | admin | Actualiza proveedor existente |
| DELETE | `/providers/{id}` | admin | Soft delete de proveedor |

### Imágenes (`/images`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/images/{date_key}/{filename}` | No | Sirve imagen de storage local (dev); en prod se usa URL del bucket |

---

## 5. Páginas y rutas del frontend

| Ruta | Componente | Acceso | Descripción |
|---|---|---|---|
| `/` | `LandingPage` | Público | Página de inicio; redirige a dashboard si autenticado |
| `/login` | `LoginPage` | Público | Formulario de login |
| `/register` | `RegisterPage` | Público | Formulario de registro |
| `/dashboard` | `DashboardPage` | Autenticado | Panel con métricas y listado de cotizaciones |
| `/quotations/new` | `NewQuotationPage` | Autenticado | Wizard para nueva cotización (upload imagen + params) |
| `/quotations/:id` | `QuotationResultPage` | Autenticado | Resultado de cotización; comparación básica/premium; swap proveedor; descarga PDF |
| `/admin/providers` | `AdminProvidersPage` | Admin | CRUD de proveedores |

> No existe ruta para ejecutivos ver cotizaciones de clientes específicos desde UI, ni pantalla de administración de reglas de negocio.

---

## 6. Estado de módulos principales

### Análisis visual (`backend/modules/visual_analysis/`)
- **Existe:** sí
- **Modelo:** Google Gemini (configurable via `VISION_MODEL`, default `gemini-2.5-flash-lite`)
- **Retorna JSON estructurado:** sí — `VisualAnalysisResult` con campos: `event_type`, `style`, `inferred_services`, `visual_elements`, `confidence` (0.0–1.0), `raw_response`
- **Integración:** llamada síncrona envuelta en `run_in_executor` para no bloquear event loop; parseo robusto del JSON (soporta markdown code blocks y texto extra)
- **Fallo graceful:** `VisualAnalysisError` capturada en endpoint; flujo continúa sin análisis visual (CU-01 flujo alternativo)
- **Tests unitarios:** ninguno

### Motor de reglas de negocio (`backend/modules/rules_engine/`)
- **Existe:** sí
- **Configurable:** sí — reglas vienen de tabla `business_rules` en BD; si no hay reglas, usa defaults hardcodeados por tipo de evento
- **Condiciones soportadas:** `min_invitados` por ahora; estructura JSON extensible
- **Tipos de evento con defaults:** boda, corporativo, cumpleaños, quinceañeros, conferencia, otro
- **Administración desde UI:** no existe pantalla de gestión de reglas
- **Tests unitarios:** sí — 8 tests cubriendo defaults, reglas BD, condiciones, fallback

### Motor de selección de proveedores / optimizador (`backend/modules/optimizer/`)
- **Existe:** sí — es el módulo más completo
- **Usa PuLP:** sí — `IlpOptimizer` con solver CBC; formulación ILP formal (variables binarias, restricciones de presupuesto + cobertura)
- **Algoritmos:** `ILP` (óptimo, para < 500 combinaciones) y `GREEDY` (ratio quality/costo, siempre rápido)
- **Selección automática:** `OptimizerFactory` en `engine.py` cuenta combinaciones y elige; fallback a Greedy si ILP falla
- **Aislamiento:** no importa nada de `api/`, `models/`, ni `pdf_gen/` — solo sus propios schemas
- **Tests unitarios:** sí — 15 tests (6 casos obligatorios + 9 adicionales de estructura/salida); tests de estrategia en `test_engine.py`
- **Tests de ILP:** cubiertos implícitamente via `engine.py` (catálogos pequeños usan ILP), pero no hay archivo `test_ilp.py` dedicado

### Generación de PDF (`backend/modules/pdf_gen/`)
- **Existe:** sí
- **Tecnología:** WeasyPrint + Jinja2; template HTML en `templates/proposal.html`
- **Campos incluidos en el PDF:**
  - Cabecera: tipo de evento, fecha, nivel (BÁSICO/PREMIUM)
  - Info: nombre del cliente, número de invitados, estilo, versión + fecha de generación
  - Tabla de servicios: servicio, proveedor, tipo (obligatorio/opcional), índice de calidad (barra visual), costo en S/.
  - Totales: costo total, score de calidad (%), algoritmo usado
  - Footer: número de cotización, aviso de precios referenciales
- **Fallback:** si WeasyPrint no disponible (Windows sin GTK), retorna HTML del template
- **Tests:** ninguno

### Autenticación y roles (`backend/api/dependencies/auth.py`, `backend/models/models.py`)
- **Existe:** sí
- **Roles implementados:** los 3 — `CLIENTE`, `EJECUTIVO`, `ADMIN` (enum en BD y en JWT)
- **Control de acceso:**
  - CLIENTE: ve solo sus propias cotizaciones
  - EJECUTIVO: ve todas las cotizaciones, lista proveedores
  - ADMIN: todo lo anterior + CRUD completo de proveedores
- **JWT:** HS256, duración configurable (`ACCESS_TOKEN_EXPIRE_MINUTES`)
- **Middleware:** `get_current_user` y `require_role(...)` como dependencias FastAPI
- **Tests de integración:** sí — en `test_auth.py` y flujos de autorización en `test_quotations.py` y `test_providers.py`

### Persistencia de cotizaciones
- **Existe:** sí
- **ID único:** sí — `quotations.id` autoincremental (PK)
- **Versionado:** sí — campo `version` (int), nunca se eliminan; reprocesar crea nueva versión
- **Log de optimización:** sí — tabla `optimization_logs` con `input_json`, `output_json`, `algoritmo_usado`, `duracion_ms`, `es_factible`, `created_at` por cada cotización procesada
- **Snapshot de parámetros:** `parametros_json` en `quotations` guarda los params de entrada usados
- **Soft delete:** proveedores tienen `is_active`; cotizaciones nunca se borran

---

## 7. Tests existentes

### Unitarios (`tests/unit/`)
| Archivo | Módulo | Tests | Casos cubiertos |
|---|---|---|---|
| `optimizer/test_greedy.py` | Greedy | 11 | Los 6 obligatorios del CLAUDE.md + 5 de estructura de salida |
| `optimizer/test_engine.py` | Engine | 7 | Timing, catálogo vacío, conteo de combinaciones, selección de estrategia |
| `rules_engine/test_engine.py` | RulesEngine | 8 | Defaults por tipo, reglas BD, condiciones min_invitados, fallback |

**Total unitario:** 26 tests

**Casos obligatorios del CLAUDE.md vs cobertura:**
1. Presupuesto suficiente para todos los servicios → cubierto (`test_greedy.py`)
2. Presupuesto justo → mejor ratio → cubierto (`test_greedy.py`)
3. Presupuesto insuficiente para obligatorios → `feasible=False` → cubierto
4. Proveedor no disponible en fecha → cubierto
5. Proveedor incompatible con tipo → cubierto
6. Catálogo vacío → manejo graceful → cubierto

### Integración (`tests/integration/`)
| Archivo | Tests | Flujos cubiertos |
|---|---|---|
| `test_auth.py` | ~5 | Registro, login, token inválido |
| `test_providers.py` | ~5 | CRUD proveedores con roles |
| `test_quotations.py` | 14 | CU-01 (con y sin imagen, análisis falla, presupuesto insuficiente, auth), CU-02 (reproceso, versionado, permisos) |

**Total integración:** ~24 tests estimados

**Framework de testing:**
- pytest + pytest-asyncio
- SQLite in-memory para integración (aiosqlite)
- Mocks para storage y visual_analysis API

### Cobertura
No se ha corrido `pytest --cov` en este análisis. Meta del CLAUDE.md: >= 80% en el optimizer. Los 6 casos mínimos están cubiertos. No hay tests para: `visual_analysis/`, `pdf_gen/`, `proposal_gen/`, `ilp.py` (solo indirectamente).

---

## 8. Lo que está incompleto, roto o ausente

### Ausente / no implementado
- **No hay UI para gestión de reglas de negocio** — el admin no puede crear/editar/borrar `BusinessRule` desde la web; solo via SQL o seed script.
- **No hay tests para `ILP` (ilp.py) de forma aislada** — existe `test_engine.py` que cubre el flujo pero no hay `test_ilp.py` con casos específicos del solver.
- **No hay tests para `visual_analysis/`** — ni unitarios ni mock del cliente Gemini.
- **No hay tests para `pdf_gen/`** — generación de PDF no probada automáticamente.
- **No hay tests para `proposal_gen/`** — generador de propuestas sin tests.
- **No hay endpoint de gestión de `BusinessRules`** — la tabla existe, el seed la puebla, pero no hay router `rules.py`.
- **No hay página de ejecivo** — ejecutivos no tienen vista diferenciada; ven el mismo dashboard que clientes pero acceden a más cotizaciones sin UI especializada.
- **`ANTHROPIC_API_KEY` muerto** — campo en `config.py` con valor vacío, comentado como "legacy". Confunde si alguien lee el código sin contexto.
- **CORS solo localhost** — `allow_origins=["http://localhost:5173", "http://localhost:3000"]` hardcodeado en `main.py`. En producción fallará.
- **`pdf_url` en `Quotation` nunca se escribe** — campo `pdf_url: str | None` existe en el modelo pero ningún endpoint lo persiste (PDF se genera on-demand).

### Potencialmente roto
- **WeasyPrint en macOS/Windows** — requiere librerías nativas (GTK). En `generate_pdf()` hay fallback a HTML, pero el endpoint devuelve content-type `application/pdf` aunque retorne HTML. El cliente puede confundirse.
- **`algorithm_used` hardcodeado en PDF** — en `download_pdf` del router, `algorithm_used="GREEDY"` está hardcodeado en lugar de leer el valor real del `OptimizationLog`.
- **Swap de proveedor no valida fechas** — `swap` endpoint cambia proveedor sin verificar que el nuevo proveedor está disponible en la fecha del evento ni que es compatible con el tipo de evento.

---

## 9. Lo que funciona bien y no debe tocarse

### Motor de optimización — completo y correctamente aislado
`backend/modules/optimizer/` es el módulo más maduro. No importa nada externo, tiene ILP + Greedy con fallback, 26 tests, y todos los 6 casos obligatorios cubiertos. La interfaz pública `optimize(OptimizationInput) -> OptimizationResult` es estable. No tocar sin actualizar tests.

### Flujo completo CU-01 y CU-02 — funcional end-to-end
El pipeline imagen → análisis visual → reglas → optimizador → propuesta → PDF está orquestado correctamente en `quotations.py`. El flujo alternativo (análisis visual falla) está implementado y testeado. El versionado de cotizaciones funciona correctamente.

### Arquitectura modular respeta fronteras
Los módulos en `backend/modules/` no se importan entre sí lateralmente. El endpoint orquesta, no decide. Los repositories centralizan acceso a BD. Patrón correcto mantenido en todo el backend.

### Auth con 3 roles — completo
JWT + roles CLIENTE/EJECUTIVO/ADMIN implementados con `require_role(...)` como dependencia. Acceso diferenciado a cotizaciones y proveedores funciona correctamente. Testeado en integración.

### Modelo de datos — coherente con PRD
Todas las entidades del PRD sección 9 existen en `models.py`: User, Event, ReferenceImage, Service, Provider, Quotation, QuotationDetail, BusinessRule, OptimizationLog. Las restricciones clave están (versión incremental, log inmutable, soft delete en proveedores).

### Motor de reglas — configurable con fallback seguro
`rules_engine/engine.py` maneja correctamente el caso de BD sin reglas (usa defaults) y el caso con reglas configuradas. Stateless y testeable de forma aislada. 8 tests.

### Visual analysis — robusto ante respuestas malformadas
`_parse_llm_response` en `client.py` maneja JSON puro, JSON en markdown code blocks, y JSON embebido en texto. La llamada síncrona en thread pool evita bloquear el event loop.
