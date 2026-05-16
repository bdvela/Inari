# STATUS.md — Sistema Inteligente de Propuestas de Eventos

Generado: 2026-05-16. Actualizado manualmente tras análisis de código y git log.

---

## 1. Árbol de directorios (3 niveles)

```
Inari/
├── .env.example
├── .env.railway.example
├── .gitignore
├── CLAUDE.md
├── DESIGN.md
├── DONE.md
├── README.md
├── STATUS.md
├── VISUAL_STATUS.md
├── alembic.ini
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       ├── f885370731d7_initial_schema.py
│       ├── a3c1d8e0f2b4_drop_pdf_url_from_quotations.py
│       ├── b7e2f1c9d3a5_add_style_analysis_to_quotations.py
│       ├── c4d2e8f1a9b3_add_base_packages.py
│       ├── d1e4f7a2c8b0_add_quotation_change_logs.py
│       └── e2f5a8b3c1d7_add_quotation_requests.py
├── backend/
│   ├── main.py
│   ├── api/
│   │   ├── dependencies/
│   │   │   └── auth.py
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── images.py
│   │       ├── packages.py
│   │       ├── providers.py
│   │       ├── quotations.py      ← 1403 líneas
│   │       └── rules.py
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
│       ├── packages/
│       │   ├── exceptions.py
│       │   ├── schemas.py
│       │   └── selector.py
│       ├── pdf_gen/
│       │   ├── generator.py
│       │   └── templates/
│       │       └── proposal.html   ← plantilla 3 páginas con portada oscura
│       ├── proposal_gen/
│       │   ├── generator.py
│       │   ├── narrative.py
│       │   ├── prompts.py
│       │   └── schemas.py
│       ├── rules_engine/
│       │   ├── engine.py
│       │   └── schemas.py
│       ├── storage/
│       │   ├── exceptions.py
│       │   ├── service.py
│       │   └── supabase_client.py
│       └── visual_analysis/
│           ├── client.py
│           ├── exceptions.py
│           ├── prompts.py
│           ├── schemas.py
│           ├── service_inference.py
│           ├── style_analysis.py
│           └── text_parser.py
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
│       │   ├── RegisterWithQuotationModal.tsx
│       │   └── shared/
│       │       ├── ConfirmModal.tsx
│       │       ├── DateInput.tsx
│       │       ├── EventTypeSelect.tsx
│       │       ├── Layout.tsx
│       │       ├── LoadingSpinner.tsx
│       │       ├── QualityBar.tsx
│       │       └── SkeletonCard.tsx
│       ├── context/
│       │   └── AuthContext.tsx
│       ├── pages/
│       │   ├── AdminPackagesPage.tsx
│       │   ├── AdminProvidersPage.tsx
│       │   ├── AdminRulesPage.tsx
│       │   ├── DashboardPage.tsx
│       │   ├── GuestResultPage.tsx
│       │   ├── GuestWizardPage.tsx
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
├── specs/
│   ├── HU-cotizacion-sin-registro.md
│   ├── HU-extraccion-automatica-datos-evento-cotizacion.md
│   ├── HU-generacion-automatica-narrativa-pdf-cotizacion.md
│   ├── HU-inferencia-servicios-desde-imagenes-referencia.md
│   ├── HU-panel-admin.md
│   ├── HU-panel-cliente.md
│   ├── HU-panel-ejecutivo.md
│   └── HU-seleccion-automatica-paquete-servicios-por-invitados.md
└── tests/
    ├── conftest.py
    ├── integration/
    │   ├── conftest.py
    │   ├── test_auth.py
    │   ├── test_providers.py
    │   ├── test_quotations.py
    │   └── test_rules.py
    └── unit/
        ├── optimizer/
        │   ├── conftest.py
        │   ├── test_engine.py
        │   ├── test_greedy.py
        │   └── test_ilp.py
        ├── packages/
        │   └── test_hu_seleccion_paquete.py
        ├── pdf_gen/
        │   └── test_generator.py
        ├── proposal_gen/
        │   ├── test_hu_narrativa_pdf.py
        │   └── test_narrative.py
        ├── rules_engine/
        │   └── test_engine.py
        └── visual_analysis/
            ├── test_client.py
            ├── test_hu_extraccion_automatica.py
            ├── test_hu_inferencia_servicios.py
            ├── test_style_analysis.py
            └── test_text_parser.py
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
| Storage | local / S3 / Supabase (configurable) |

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
ALLOWED_ORIGINS                 # CSV: http://localhost:5173,https://tudominio.com

# Storage
STORAGE_BACKEND                 # "local" | "s3" | "supabase"
STORAGE_BASE_URL                # URL base para URLs públicas (default: http://localhost:8000)

# Optimizador
OPTIMIZER_ILP_MAX_COMBINATIONS  # umbral ILP vs Greedy (default: 500)
PREMIUM_BUDGET_MULTIPLIER       # multiplicador presupuesto premium (default: 1.30)
QUALITY_WEIGHT_HISTORICAL       # peso puntuación histórica (default: 0.5)
QUALITY_WEIGHT_PRICE            # peso precio (default: 0.3)
QUALITY_WEIGHT_EXPERIENCE       # peso experiencia en tipo evento (default: 0.2)

# Modelo Gemini
VISION_MODEL                    # default: "gemini-2.5-flash"

# App
DEBUG                           # false en producción
```

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
| POST | `/auth/register` | No | Registro; retorna JWT + rol |
| POST | `/auth/login` | No | Login email/password; retorna JWT + rol |
| POST | `/auth/register-and-quote` | No | Registro + cotización guardada en un paso (guest flow) |
| GET | `/auth/me` | Sí | Perfil del usuario autenticado |
| PATCH | `/auth/me` | Sí | Editar nombre |
| POST | `/auth/me/change-password` | Sí | Cambiar contraseña (valida actual) |

### Cotizaciones (`/quotations`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/quotations/parse-description` | No (público) | CU conversacional: extrae parámetros del evento desde texto libre vía Gemini |
| POST | `/quotations/generate` | Sí | CU-01: genera cotización básica+premium; multipart (imagen opcional + params) |
| POST | `/quotations/preview` | No | Pipeline completo sin guardar en BD (guest flow sin registro) |
| GET | `/quotations/` | Sí | Lista cotizaciones; staff ve todas + campo `pending_requests` |
| GET | `/quotations/stats` | Sí | Métricas del dashboard |
| GET | `/quotations/{id}` | Sí | Detalle con proveedores, análisis IA, paquete, servicios inferidos |
| POST | `/quotations/reprocess/{evento_id}` | Sí | CU-02: reprocesa con nuevo presupuesto, crea nueva versión |
| GET | `/quotations/{id}/alternatives/{detalle_id}` | Sí | Proveedores alternativos para un ítem |
| POST | `/quotations/{id}/swap` | Sí | Intercambia proveedor; valida is_active, compatibilidad, fecha |
| GET | `/quotations/{id}/pair` | Sí | Cotización + gemela básica/premium del mismo evento |
| GET | `/quotations/{id}/changelog` | Sí | Historial de cambios (solo ejecutivo/admin) |
| GET | `/quotations/{id}/pdf` | Sí | PDF para cliente (sin proveedores) |
| GET | `/quotations/{id}/pdf?interno=true` | Sí | PDF interno (con proveedores) |
| POST | `/quotations/{id}/requests` | Sí | Cliente crea solicitud de ajuste (mensaje libre) |
| GET | `/quotations/{id}/requests` | Sí | Lista solicitudes de la cotización |
| PATCH | `/quotations/requests/{request_id}` | Sí (ejecutivo+) | Actualiza estado de solicitud (en_revision/resuelta) |

### Proveedores (`/providers`)
| Método | Ruta | Rol mínimo | Descripción |
|---|---|---|---|
| GET | `/providers/` | ejecutivo | Lista proveedores activos |
| POST | `/providers/` | admin | Crea proveedor |
| PUT | `/providers/{id}` | admin | Actualiza proveedor |
| DELETE | `/providers/{id}` | admin | Soft delete |

### Reglas de negocio (`/rules`)
| Método | Ruta | Rol mínimo | Descripción |
|---|---|---|---|
| GET | `/rules/` | ejecutivo | Lista todas las reglas |
| POST | `/rules/` | admin | Crea regla |
| PUT | `/rules/{id}` | admin | Actualiza es_obligatorio/condicion/descripcion |
| DELETE | `/rules/{id}` | admin | Elimina regla |
| GET | `/rules/event-types/` | ejecutivo | Lista EventTypes disponibles |
| GET | `/rules/services/` | ejecutivo | Lista servicios activos (para dropdowns) |

### Paquetes base (`/packages`)
| Método | Ruta | Rol mínimo | Descripción |
|---|---|---|---|
| GET | `/packages/` | ejecutivo | Lista paquetes activos ordenados por rango |
| POST | `/packages/` | admin | Crea paquete base |
| PUT | `/packages/{id}` | admin | Actualiza paquete |
| DELETE | `/packages/{id}` | admin | Soft delete |

### Imágenes (`/images`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/images/{date_key}/{filename}` | No | Sirve imagen de storage local (dev) |

---

## 5. Páginas y rutas del frontend

| Ruta | Componente | Acceso | Descripción |
|---|---|---|---|
| `/` | `LandingPage` | Público | Página de inicio con fotos, stats, CTAs hacia `/cotizar` |
| `/login` | `LoginPage` | Público | Login; redirige por rol: admin→/admin/providers, resto→/dashboard |
| `/register` | `RegisterPage` | Público | Registro de nuevo cliente |
| `/cotizar` | `GuestWizardPage` | Público | Wizard de cotización sin registro; si autenticado → /quotations/new |
| `/propuesta` | `GuestResultPage` | Público | Resultado de preview para guest; opciones: registrarse/guardar, solo ver, solo registrarse |
| `/dashboard` | `DashboardPage` | Autenticado | Panel diferenciado: cliente (cards por evento), staff (tabla + filtros + badge pendientes) |
| `/quotations/new` | `NewQuotationPage` | Autenticado | Wizard: paso 1 descripción libre → Gemini pre-llena; paso 2 form+dropzone; paso 3 loading |
| `/quotations/:id` | `QuotationResultPage` | Autenticado | 2-col desktop: izq=servicios, der=análisis IA+narrativa+PDF; ajustes cliente; changelog ejecutivo |
| `/admin/providers` | `AdminProvidersPage` | Admin | CRUD de proveedores con select de servicio |
| `/admin/rules` | `AdminRulesPage` | Ejecutivo+ | Vista/gestión de reglas de negocio agrupadas por tipo de evento |
| `/admin/packages` | `AdminPackagesPage` | Ejecutivo+ | Vista/gestión de paquetes base con form inline |

---

## 6. Modelo de datos — entidades

| Entidad | Tabla | Nota |
|---|---|---|
| Usuario | `users` | roles: CLIENTE, EJECUTIVO, ADMIN |
| Evento | `events` | |
| ImagenReferencia | `reference_images` | URL storage + JSON análisis visual |
| Proveedor | `providers` | quality_index float, compatible_event_types array, is_active |
| Servicio | `services` | categoría (catering, deco, foto, etc.) |
| Cotización | `quotations` | version int, level enum, style_analysis_json, parametros_json |
| DetalleCotización | `quotation_details` | fila por proveedor seleccionado |
| ReglaDeNegocio | `business_rules` | JSON condición configurable |
| PaqueteBase | `base_packages` | name, content, cost, min_guests, max_guests, is_active |
| LogOptimización | `optimization_logs` | input_json, output_json, algoritmo, ms — inmutable |
| LogCambio | `quotation_change_logs` | acción, descripción, usuario — inmutable (migración d1e4f7a2c8b0) |
| SolicitudAjuste | `quotation_requests` | mensaje, estado VARCHAR, cliente_id (migración e2f5a8b3c1d7) |

---

## 7. Estado de módulos principales

### Análisis visual (`backend/modules/visual_analysis/`)
- **Existe:** sí — 5 archivos Python (client, schemas, prompts, style_analysis, text_parser, service_inference)
- **Modelo:** Google Gemini (configurable via `VISION_MODEL`, default `gemini-2.5-flash`)
- **Funciones:**
  - `analyze_image()` → `VisualAnalysisResult` (event_type, style, inferred_services, visual_elements, confidence)
  - `analyze_style_references(images)` → `StyleAnalysisResult` (dominant_colors, aesthetic_style, luxury_level 1-5, style_keywords, suggested_services)
  - `parse_description(text)` → `ParsedDescription` (event_type, guest_count, date, budget, style_hints, confidence)
  - `normalize_event_type(raw)` → `EventType` enum
  - `merge_inferred_services(suggested, confidence, required, optional)` → `list[str]` (umbral 0.6, alias map)
- **Parseo robusto:** JSON puro, JSON en markdown, JSON embebido en texto
- **Fallo graceful:** errores → `VisualAnalysisError` o string vacío; nunca bloquean el flujo

### Motor de reglas de negocio (`backend/modules/rules_engine/`)
- **Existe:** sí
- **Configurable:** reglas en tabla `business_rules`; defaults hardcodeados si vacío
- **Tipos de evento:** boda, corporativo, cumpleaños, quinceañeros, conferencia, otro
- **Admin UI:** sí — `AdminRulesPage` con CRUD vía `/rules/`

### Motor de selección de proveedores / optimizador (`backend/modules/optimizer/`)
- **Módulo más maduro del proyecto**
- **Algoritmos:** ILP (PuLP/CBC) y Greedy con fallback automático
- **`quality_weight`:** multiplicador configurable (default 1.0; sube si análisis de estilo detecta luxury_level alto)
- **Aislamiento:** no importa nada de `api/`, `models/`, ni `pdf_gen/`
- **Cobertura:** 96% (ILP: 100%, Greedy: 97%, Engine: 90%)

### Módulo de paquetes base (`backend/modules/packages/`)
- **Existe:** sí
- **`select_package(guest_count, packages)`** → `PackageSelectionResult` con alerta si supera rango
- **Integración:** costo del paquete se descuenta del presupuesto antes de pasar al optimizer
- **Admin UI:** sí — `AdminPackagesPage`

### Generación de narrativa (`backend/modules/proposal_gen/narrative.py`)
- **`generate_narrative(...)`** → string de 2-3 párrafos en español (tono cálido + profesional)
- **Máx 80 palabras,** sin markdown, sin nombres de proveedores, sin símbolo S/
- **Si falla:** retorna `""` — nunca bloquea PDF

### Generación de PDF (`backend/modules/pdf_gen/`)
- **Tecnología:** WeasyPrint + Jinja2
- **Estructura 3 páginas:**
  - Portada oscura (#1A1714) con logo INARI GROUP
  - Servicios en cards con quality bar visual
  - Resumen inversión + términos + firma del cliente
- **Versión cliente:** sin nombres de proveedores
- **Versión ejecutivo:** con proveedores completos
- **Sin WeasyPrint:** lanza `RuntimeError` con mensaje claro (no fallback silencioso)

### Autenticación y roles
- **3 roles:** CLIENTE, EJECUTIVO, ADMIN
- **Endpoints auth:** registro, login, register-and-quote, me, me/change-password
- **Control de acceso:** CLIENTE solo sus cotizaciones; EJECUTIVO ve todas + proveedores; ADMIN todo + CRUD
- **403 cross-client:** intento de ver cotización ajena → redirect con mensaje

### Solicitudes de ajuste (human-in-the-loop)
- **Modelo:** `QuotationRequest` con estados: pendiente → en_revision → resuelta
- **Vista cliente:** widget inline en QuotationResultPage para enviar mensaje
- **Vista ejecutivo:** panel en QuotationResultPage con botones de estado
- **Dashboard staff:** badge naranja en cotizaciones con solicitudes pendientes

---

## 8. Tests existentes

### Unitarios (`tests/unit/`)
| Archivo | Módulo | Tests | Estado |
|---|---|---|---|
| `optimizer/test_greedy.py` | Greedy | 11 | ✅ PASS |
| `optimizer/test_engine.py` | Engine | 7 | ✅ PASS |
| `optimizer/test_ilp.py` | ILP | 12 | ✅ PASS |
| `rules_engine/test_engine.py` | RulesEngine | 8 | ✅ PASS |
| `packages/test_hu_seleccion_paquete.py` | Packages | 19 | ✅ PASS |
| `visual_analysis/test_client.py` | VA Client | 13 | ✅ PASS |
| `visual_analysis/test_text_parser.py` | TextParser | 10 | ✅ PASS |
| `visual_analysis/test_style_analysis.py` | StyleAnalysis | 7 | ✅ PASS |
| `visual_analysis/test_hu_extraccion_automatica.py` | HU extracción | 23 | ✅ PASS |
| `visual_analysis/test_hu_inferencia_servicios.py` | HU inferencia | 15 | ✅ PASS |
| `proposal_gen/test_narrative.py` | Narrative | 4 | ✅ PASS |
| `proposal_gen/test_hu_narrativa_pdf.py` | HU narrativa | 14 | ✅ PASS |
| `pdf_gen/test_generator.py` | PDF template | 11 | ⚠️ 4 FAIL |

**Unitarios: 149 pasando, 4 fallos en `test_generator.py`**

Los 4 fallos son por template renovado (portada oscura 3-páginas) — tests comprueban strings ("ILP", nombres de proveedores, "Sin Calificación", "Por definir") que ya no aparecen en el nuevo HTML. Tests desactualizados, no hay regresión funcional.

### Integración (`tests/integration/`)
| Archivo | Tests | Flujos cubiertos |
|---|---|---|
| `test_auth.py` | ~5 | Registro, login, token inválido |
| `test_providers.py` | ~5 | CRUD con roles |
| `test_quotations.py` | 14 | CU-01, CU-02, auth, swap validaciones |
| `test_rules.py` | ~10 | CRUD reglas con roles |

**Integración: ~34 tests estimados**

### Cobertura
| Módulo | Cobertura |
|---|---|
| `optimizer/` | 96% (ILP 100%, Greedy 97%, Engine 90%) |
| `rules_engine/` | 100% |
| `packages/` | 94% |
| `visual_analysis/` | alta (13+23+15+10+7 tests) |
| `proposal_gen/narrative` | cubierto |
| `pdf_gen/` | baja — 4 tests fallan, 7 pasan |

**Casos obligatorios del CLAUDE.md vs cobertura:**
1. Presupuesto suficiente → cubierto
2. Presupuesto justo → mejor ratio → cubierto
3. Presupuesto insuficiente → `feasible=False` → cubierto
4. Proveedor no disponible en fecha → cubierto
5. Proveedor incompatible con tipo → cubierto
6. Catálogo vacío → graceful → cubierto

---

## 9. Lo que está incompleto, roto o ausente

### Tests que fallan (deuda técnica conocida)
- **`test_generator.py` — 4 fallos:** template PDF renovado a 3 páginas con portada oscura. Tests asumen estructura antigua. Actualizar los 4 tests para la nueva plantilla.

### Ausente / pendiente
- **Tests de integración para swap con validaciones:** los 3 casos nuevos (proveedor inactivo, incompatible, fecha bloqueada) no están cubiertos en `test_quotations.py`.
- **Tests de integración para rules router:** `/rules/` CRUD sin tests de integración.
- **Endpoint de búsqueda backend:** filtro client-side en dashboard con `LIMIT 100`. Para >100 cotizaciones, agregar `GET /quotations/?search=&estado=&limit=&offset=`.
- **Solicitudes de ajuste sin tests:** `QuotationRequest` modelo y endpoints sin cobertura unitaria ni de integración.
- **Ajustes de perfil desde UI:** `GET/PATCH /auth/me` y `change-password` implementados en backend; no hay pantalla de perfil en frontend (solo los endpoints existen).

### Deuda técnica conocida
- **`update_status` en `QuotationRepository`:** método sin callers. Candidato a eliminar.
- **`_generate_html_fallback` en `pdf_gen/generator.py`:** definida pero nunca llamada (se lanza RuntimeError en su lugar). Candidata a eliminar.
- **CORS en `STORAGE_BASE_URL`:** si se usa storage externo, verificar que el bucket permita CORS desde origins del frontend.

---

## 10. Lo que funciona bien y no debe tocarse

### Motor de optimización — completo y correctamente aislado
`backend/modules/optimizer/` es el módulo más maduro. ILP + Greedy con fallback, 30 tests, 96% cobertura, todos los casos obligatorios cubiertos. No tocar sin actualizar tests.

### Flujo completo CU-01 y CU-02 — funcional end-to-end
Pipeline: descripción/imagen → análisis visual → reglas → paquete → optimizer → propuesta → PDF. Flujo alternativo (análisis visual falla) implementado y testeado. Versionado de cotizaciones correcto.

### Flujo guest — funcional end-to-end
`/cotizar` → preview sin BD → `GuestResultPage` → `RegisterWithQuotationModal` → cotización guardada. Preserva imágenes entre guest y registro.

### Human-in-the-loop — funcional
Solicitudes de ajuste cliente→ejecutivo. Flujo completo: mensaje, estados, badge en dashboard.

### Arquitectura modular respeta fronteras
Módulos en `backend/modules/` no se importan entre sí lateralmente. Endpoints orquestan, no deciden. Repositories centralizan acceso a BD.

### Auth con 3 roles — completo
JWT + CLIENTE/EJECUTIVO/ADMIN. Acceso diferenciado. Testeado en integración. Paneles diferenciados por rol en frontend.

### Sistema de diseño — coherente
Design tokens en `DESIGN.md` y `tailwind.config.js`. Fuente Cormorant Garamond para headings. Paleta: `inari-night`, `inari-gold`, `inari-cream`, `inari-text`. Componentes shared reutilizables.
