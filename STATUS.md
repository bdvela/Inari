# STATUS.md — Sistema Inteligente de Propuestas de Eventos

Generado: 2026-05-16. Branch activo: `v2.3-redesign`.
Tests: **292 backend PASS · 9 frontend PASS · 0 TypeScript errors**.

---

## 1. Árbol de directorios (3 niveles, actualizado v2.3)

```
Inari/
├── CLAUDE.md / DESIGN.md / DONE.md / README.md / STATUS.md
├── alembic.ini
├── alembic/
│   ├── env.py
│   └── versions/
│       ├── f885370731d7_initial_schema.py
│       ├── a3c1d8e0f2b4_drop_pdf_url_from_quotations.py
│       ├── b7e2f1c9d3a5_add_style_analysis_to_quotations.py
│       ├── c4d2e8f1a9b3_add_base_packages.py
│       ├── d1e4f7a2c8b0_add_quotation_change_logs.py
│       ├── e2f5a8b3c1d7_add_quotation_requests.py
│       ├── f0a1b2c3d4e5_add_chat_sessions.py        ← v2.3
│       ├── a1b2c3d4e5f0_add_provider_tier.py         ← v2.3
│       └── b1c2d3e4f5a6_add_system_config.py         ← v2.3
├── backend/
│   ├── main.py
│   ├── .env.example
│   ├── api/
│   │   ├── dependencies/auth.py
│   │   ├── routers/
│   │   │   ├── admin.py        ← v2.3 NUEVO
│   │   │   ├── auth.py
│   │   │   ├── chat.py         ← v2.3 NUEVO
│   │   │   ├── images.py
│   │   │   ├── packages.py
│   │   │   ├── providers.py
│   │   │   ├── public.py       ← v2.3 NUEVO
│   │   │   ├── quotations.py
│   │   │   └── rules.py
│   │   └── schemas/
│   │       ├── public_quotation.py   ← v2.3 NUEVO
│   │       └── quotation.py          ← v2.3 NUEVO
│   ├── core/
│   │   ├── config.py
│   │   ├── config_service.py   ← v2.3 NUEVO
│   │   ├── database.py
│   │   ├── logging.py
│   │   └── security.py
│   ├── models/
│   │   ├── base.py
│   │   ├── chat_session.py     ← v2.3 NUEVO
│   │   ├── models.py
│   │   ├── system_config.py    ← v2.3 NUEVO
│   │   └── repositories/
│   │       ├── provider_repository.py
│   │       └── quotation_repository.py
│   └── modules/
│       ├── assistant/          ← v2.3 NUEVO
│       │   └── chat_orchestrator.py
│       ├── auth/               ← v2.3 NUEVO
│       │   └── client_tokens.py
│       ├── optimizer/
│       │   ├── engine.py
│       │   ├── exceptions.py
│       │   ├── greedy.py
│       │   ├── ilp.py
│       │   └── schemas.py      ← v2.3 +tier en ProviderOption
│       ├── packages/
│       ├── pdf_gen/
│       ├── proposal_gen/
│       │   └── generator.py    ← v2.3 +all_providers param
│       ├── rules_engine/
│       ├── storage/
│       └── visual_analysis/
├── frontend/
│   ├── vite.config.ts          ← v2.3 +vitest config
│   └── src/
│       ├── App.tsx             ← v2.3 muchas rutas nuevas
│       ├── test-setup.ts       ← v2.3 NUEVO
│       ├── components/shared/
│       │   └── Layout.tsx      ← v2.3 menú admin expandido
│       ├── pages/
│       │   ├── AdminOptimizationLogsPage.tsx  ← v2.3 NUEVO
│       │   ├── AdminProvidersPage.tsx          ← v2.3 +tier
│       │   ├── AdminSystemConfigPage.tsx       ← v2.3 NUEVO
│       │   ├── ChatQuotationPage.tsx           ← v2.3 NUEVO
│       │   ├── DashboardPage.tsx
│       │   ├── LandingPage.tsx                 ← v2.3 sin /cotizar
│       │   ├── LoginPage.tsx
│       │   ├── NewQuotationPage.tsx            ← en /new/classic
│       │   ├── PublicQuotationPage.tsx         ← v2.3 NUEVO
│       │   ├── QuotationResultPage.tsx         ← v2.3 +aprobar+algoritmo
│       │   ├── RegisterPage.tsx                ← v2.3 solo staff
│       │   └── __tests__/
│       │       ├── AdminProvidersPage.test.tsx  ← v2.3 NUEVO
│       │       └── QuotationResultPage.test.tsx ← v2.3 NUEVO
│       ├── services/
│       │   ├── api.ts          ← v2.3 +adminApi, +http export
│       │   ├── chatApi.ts      ← v2.3 NUEVO
│       │   └── publicApi.ts    ← v2.3 NUEVO
│       └── types/
│           └── index.ts        ← v2.3 +Provider.tier, +algorithm_used?
└── tests/
    ├── integration/
    │   ├── conftest.py
    │   ├── test_admin_config.py           ← v2.3 NUEVO
    │   ├── test_approve_and_share.py      ← v2.3 NUEVO
    │   ├── test_auth.py
    │   ├── test_auth_regression.py        ← v2.3 NUEVO
    │   ├── test_chat_endpoints.py         ← v2.3 NUEVO
    │   ├── test_deprecated_endpoints.py   ← v2.3 NUEVO
    │   ├── test_dual_generation.py        ← v2.3 NUEVO
    │   ├── test_optimization_logs_api.py  ← v2.3 NUEVO
    │   ├── test_providers.py
    │   ├── test_public_pdf.py             ← v2.3 NUEVO
    │   ├── test_public_quotation.py       ← v2.3 NUEVO
    │   ├── test_public_requests.py        ← v2.3 NUEVO
    │   ├── test_quotations.py
    │   └── test_rules.py
    └── unit/
        ├── assistant/
        ├── optimizer/
        ├── packages/
        ├── pdf_gen/
        ├── proposal_gen/
        ├── rules_engine/
        ├── test_chat_orchestrator.py   ← v2.3 NUEVO
        ├── test_client_tokens.py       ← v2.3 NUEVO
        └── visual_analysis/
```

---

## 2. Stack tecnológico

### Backend
| Componente | Tecnología | Versión |
|---|---|---|
| Framework web | FastAPI | 0.115.0 |
| ORM | SQLAlchemy (async) | 2.0.36 |
| Driver DB | asyncpg + aiosqlite (tests) | 0.29.0 |
| Migraciones | Alembic | 1.13.3 |
| Validación | Pydantic v2 | 2.9.2 |
| Auth | python-jose + passlib/bcrypt | 3.3.0 / 1.7.4 |
| LLM visual | Google Gemini SDK (google-genai) | 1.73.1 |
| Optimización | PuLP (ILP solver CBC) | 2.9.0 |
| PDF | WeasyPrint + Jinja2 | 61.2 / 3.1.4 |

### Frontend
| Componente | Tecnología | Versión |
|---|---|---|
| Framework UI | React | ^18.3.1 |
| Lenguaje | TypeScript | ^5.5.3 |
| Bundler | Vite | ^5.4.2 |
| Tests | Vitest + @testing-library/react | 4.1.6 |
| CSS | Tailwind CSS | ^3.4.11 |
| Estado servidor | TanStack React Query | ^5.56.2 |
| HTTP | Axios | ^1.7.7 |
| Routing | React Router DOM | ^6.26.2 |
| Formularios | React Hook Form + Zod | ^7.53.0 / ^3.23.8 |
| Toasts | Sonner | ^1.5.0 |

---

## 3. Variables de entorno requeridas

```bash
# PostgreSQL
DATABASE_URL                    # postgresql+asyncpg://...

# Backend seguridad
SECRET_KEY                      # JWT signing secret (staff)
CLIENT_TOKEN_SECRET             # JWT signing secret (tokens cliente — DIFERENTE de SECRET_KEY)
ACCESS_TOKEN_EXPIRE_MINUTES     # default: 480

# LLM
GEMINI_API_KEY                  # Google AI Studio
VISION_MODEL                    # default: "gemini-2.5-flash"

# CORS / Frontend
ALLOWED_ORIGINS                 # CSV: http://localhost:5173,...
FRONTEND_BASE_URL               # URL base para links de cliente (default: http://localhost:5173)

# Storage
STORAGE_BACKEND                 # "local" | "s3" | "supabase"
STORAGE_BASE_URL                # default: http://localhost:8000

# Optimizador
OPTIMIZER_ILP_MAX_COMBINATIONS  # umbral ILP vs Greedy (default: 500)
PREMIUM_BUDGET_MULTIPLIER       # default: 1.30
```

---

## 4. Endpoints del backend

Base: `/api/v1`

### Auth (`/auth`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/register` | No | Registro; retorna JWT |
| POST | `/auth/login` | No | Login email/password |
| POST | `/auth/register-and-quote` | No | **[DEPRECATED]** Registro + cotización en un paso |
| GET | `/auth/me` | Sí | Perfil autenticado |
| PATCH | `/auth/me` | Sí | Editar nombre |
| POST | `/auth/me/change-password` | Sí | Cambiar contraseña |

### Cotizaciones (`/quotations`)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/quotations/parse-description` | No | Extrae parámetros desde texto libre (Gemini) |
| POST | `/quotations/generate` | Sí | CU-01: genera par básico+premium con tier-filtering |
| POST | `/quotations/preview` | No | **[DEPRECATED]** Pipeline sin guardar (guest flow eliminado) |
| GET | `/quotations/` | Sí | Lista cotizaciones |
| GET | `/quotations/stats` | Sí | Métricas dashboard |
| GET | `/quotations/{id}` | Sí | Detalle completo |
| POST | `/quotations/reprocess/{evento_id}` | Sí | CU-02: nueva versión |
| GET | `/quotations/{id}/alternatives/{detalle_id}` | Sí | Proveedores alternativos |
| POST | `/quotations/{id}/swap` | Sí | Intercambia proveedor |
| GET | `/quotations/{id}/pair` | Sí | Cotización + gemela básico/premium |
| GET | `/quotations/{id}/changelog` | Sí | Historial de cambios |
| GET | `/quotations/{id}/pdf` | Sí | PDF (versión ejecutivo o cliente) |
| POST | `/quotations/{id}/requests` | Sí | Solicitud de ajuste (staff) |
| GET | `/quotations/{id}/requests` | Sí | Lista solicitudes |
| PATCH | `/quotations/requests/{id}` | Sí (ejecutivo+) | Actualiza estado solicitud |
| POST | `/quotations/{id}/approve-and-share` | Sí (ejecutivo+) | **NUEVO v2.3** Aprueba + emite link firmado |

### Público (`/public`) — sin auth de staff
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/public/quotations/by-token` | **NUEVO v2.3** Cotización pública via token firmado |
| GET | `/public/quotations/by-token/pdf` | **NUEVO v2.3** PDF cliente (sin proveedores) |
| POST | `/public/quotations/by-token/requests` | **NUEVO v2.3** Solicitud de ajuste desde link |
| GET | `/public/quotations/by-token/requests` | **NUEVO v2.3** Lista solicitudes del cliente |

### Chat (`/chat`) — auth requerida
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/chat/start` | **NUEVO v2.3** Inicia sesión de chat conversacional |
| POST | `/chat/{session_id}/message` | **NUEVO v2.3** Envía mensaje, extrae params |
| POST | `/chat/{session_id}/confirm` | **NUEVO v2.3** Confirma y genera cotización |

### Admin (`/admin`) — solo ADMIN
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/admin/optimizer-config` | **NUEVO v2.3** Lee quality_weight actual |
| PUT | `/admin/optimizer-config` | **NUEVO v2.3** Actualiza quality_weight (0.0–5.0) |
| GET | `/admin/optimization-logs` | **NUEVO v2.3** Lista logs paginada con filtros |
| GET | `/admin/optimization-logs/{id}` | **NUEVO v2.3** Detalle con input/output JSON |

### Proveedores, Reglas, Paquetes, Imágenes
_(sin cambios de rutas en v2.3; proveedores ahora incluye campo `tier`)_

---

## 5. Páginas y rutas del frontend

| Ruta | Componente | Acceso | Descripción |
|---|---|---|---|
| `/` | `LandingPage` | Público | Landing; CTAs → WhatsApp/Instagram (sin /cotizar) |
| `/login` | `LoginPage` | Público | Login por rol |
| `/register` | `RegisterPage` | Público | Solo personal autorizado (aviso explícito) |
| `/cotizar` | `Navigate /` | — | **ELIMINADO** — redirige a landing |
| `/propuesta` | `Navigate /` | — | **ELIMINADO** — redirige a landing |
| `/p/:token` | `PublicQuotationPage` | Público | **NUEVO** Propuesta cliente via link firmado |
| `/dashboard` | `DashboardPage` | Autenticado | Panel por rol |
| `/quotations/new` | `ChatQuotationPage` | Autenticado | **NUEVO** Chat conversacional (reemplaza wizard) |
| `/quotations/new/classic` | `NewQuotationPage` | Autenticado | Wizard clásico (fallback) |
| `/quotations/:id` | `QuotationResultPage` | Autenticado | Detalle + botón "Aprobar y enviar" |
| `/admin/providers` | `AdminProvidersPage` | Admin | CRUD + campo tier + filtro por nivel |
| `/admin/rules` | `AdminRulesPage` | Ejecutivo+ | Reglas de negocio |
| `/admin/packages` | `AdminPackagesPage` | Ejecutivo+ | Paquetes base |
| `/admin/system-config` | `AdminSystemConfigPage` | Admin | **NUEVO** Slider quality_weight |
| `/admin/optimization-logs` | `AdminOptimizationLogsPage` | Admin | **NUEVO** Logs del optimizer |

---

## 6. Modelo de datos — entidades (v2.3)

| Entidad | Tabla | Nota |
|---|---|---|
| Usuario | `users` | roles: CLIENTE, EJECUTIVO, ADMIN |
| Evento | `events` | |
| ImagenReferencia | `reference_images` | URL storage + JSON análisis visual |
| Proveedor | `providers` | +`tier VARCHAR(10)` DEFAULT 'basico' ← v2.3 |
| Servicio | `services` | categoría |
| Cotización | `quotations` | +estados APROBADA_ENVIADA/CANCELADA/RECHAZADA ← v2.3 |
| DetalleCotización | `quotation_details` | fila por proveedor seleccionado |
| ReglaDeNegocio | `business_rules` | JSON condición configurable |
| PaqueteBase | `base_packages` | name, cost, min/max_guests |
| LogOptimización | `optimization_logs` | input/output JSON — inmutable |
| LogCambio | `quotation_change_logs` | acción, usuario — inmutable |
| SolicitudAjuste | `quotation_requests` | mensaje, estado VARCHAR |
| SesiónChat | `chat_sessions` | ← v2.3 UUID PK, messages JSON, extracted_params |
| ConfigSistema | `system_config` | ← v2.3 key-value para parámetros ajustables |

---

## 7. Estado de módulos principales

### M1 — Análisis visual (`backend/modules/visual_analysis/`)
- **Estado:** ✅ COMPLETO
- **Funciones:** `analyze_image`, `analyze_style_references`, `parse_description`, `normalize_event_type`, `merge_inferred_services`
- **Modelo:** Gemini 2.5 Flash

### M2 — Motor de reglas (`backend/modules/rules_engine/`)
- **Estado:** ✅ COMPLETO — 100% cobertura
- **Configurable:** reglas en BD `business_rules`, CRUD vía `/rules/`

### M3 — Optimizador (`backend/modules/optimizer/`)
- **Estado:** ✅ COMPLETO — **94% cobertura** (ILP 100%, Greedy 87%, Engine 90%)
- **v2.3:** `ProviderOption.tier` añadido; `generate_proposals` acepta `all_providers` para separar pool básico/premium
- **`quality_weight`:** ahora se lee desde `system_config` al inicio de cada ejecución (admin ajustable)
- **Aislamiento:** no importa nada de `api/`, `models/`, ni `pdf_gen/`

### M4 — Paquetes base (`backend/modules/packages/`)
- **Estado:** ✅ COMPLETO — 94% cobertura
- `select_package(guest_count, packages)` con alerta si supera rango
- Admin UI: `AdminPackagesPage`

### M5 — Generación de propuestas (`backend/modules/proposal_gen/`)
- **Estado:** ✅ COMPLETO
- `generate_proposals` → dual-tier (básico con providers tier=basico, premium con todos)
- `generate_narrative` → texto 2-3 párrafos en español vía Gemini

### M6 — PDF (`backend/modules/pdf_gen/`)
- **Estado:** ✅ COMPLETO
- Template 3 páginas: portada oscura + servicios + términos + firma
- Versión cliente (sin proveedores) y ejecutivo (con proveedores)
- `show_providers=False` en endpoint público

### M7 — Tokens de cliente (`backend/modules/auth/`) ← NUEVO v2.3
- **Estado:** ✅ COMPLETO — 14 tests unitarios
- `create_client_token(quotation_id, expires_in_days)` — JWT firmado con `CLIENT_TOKEN_SECRET` separado de staff
- `verify_client_token(token)` — valida firma, exp, scope
- `jti` (UUID v4) garantiza tokens únicos entre aprobaciones del mismo recurso
- Payload: `{sub: "client", qid, scope, jti, iat, exp}` — sin PII

### M8 — Asistente conversacional (`backend/modules/assistant/`) ← NUEVO v2.3
- **Estado:** ✅ COMPLETO — 9 tests unitarios
- Orquesta chat → extrae parámetros via `parse_description` (reutiliza M1) → DB
- `start_session`, `process_message`, `confirm_session`, `expire_sessions` (TTL 24h)
- Merge acumulativo: campos nuevos sobreescriben, None no sobreescribe

---

## 8. Tests — resumen v2.3

### Unitarios
| Archivo | Tests | Estado |
|---|---|---|
| `optimizer/test_greedy.py` | 11 | ✅ |
| `optimizer/test_engine.py` | 7 | ✅ |
| `optimizer/test_ilp.py` | 12 | ✅ |
| `rules_engine/test_engine.py` | 8 | ✅ |
| `packages/test_hu_seleccion_paquete.py` | 19 | ✅ |
| `visual_analysis/test_client.py` | 13 | ✅ |
| `visual_analysis/test_text_parser.py` | 10 | ✅ |
| `visual_analysis/test_style_analysis.py` | 7 | ✅ |
| `visual_analysis/test_hu_extraccion_automatica.py` | 23 | ✅ |
| `visual_analysis/test_hu_inferencia_servicios.py` | 15 | ✅ |
| `proposal_gen/test_narrative.py` | 4 | ✅ |
| `proposal_gen/test_hu_narrativa_pdf.py` | 14 | ✅ |
| `pdf_gen/test_generator.py` | 11 | ✅ |
| `test_client_tokens.py` ← v2.3 | 14 | ✅ |
| `test_chat_orchestrator.py` ← v2.3 | 9 | ✅ |

**Unitarios: 177 PASS**

### Integración
| Archivo | Tests | Estado |
|---|---|---|
| `test_auth.py` | 8 | ✅ |
| `test_auth_regression.py` ← v2.3 | 9 | ✅ |
| `test_providers.py` | 5 | ✅ |
| `test_quotations.py` | 14 | ✅ |
| `test_rules.py` | 10 | ✅ |
| `test_approve_and_share.py` ← v2.3 | 9 | ✅ |
| `test_public_quotation.py` ← v2.3 | 7 | ✅ |
| `test_public_pdf.py` ← v2.3 | 6 | ✅ |
| `test_public_requests.py` ← v2.3 | 6 | ✅ |
| `test_chat_endpoints.py` ← v2.3 | 5 | ✅ |
| `test_dual_generation.py` ← v2.3 | 6 | ✅ |
| `test_admin_config.py` ← v2.3 | 7 | ✅ |
| `test_optimization_logs_api.py` ← v2.3 | 8 | ✅ |
| `test_deprecated_endpoints.py` ← v2.3 | 6 | ✅ |

**Integración: 115 PASS**

### Frontend (vitest)
| Archivo | Tests | Estado |
|---|---|---|
| `QuotationResultPage.test.tsx` ← v2.3 | 4 | ✅ |
| `AdminProvidersPage.test.tsx` ← v2.3 | 5 | ✅ |

**Frontend: 9 PASS**

### **Total: 292 backend + 9 frontend = 301 tests PASS**

### Cobertura (pytest --cov, pytest.ini mide optimizer + rules_engine)
| Módulo | Cobertura |
|---|---|
| `optimizer/engine.py` | 90% |
| `optimizer/greedy.py` | 87% |
| `optimizer/ilp.py` | 100% |
| `optimizer/schemas.py` | 100% |
| `rules_engine/engine.py` | 100% |
| `rules_engine/schemas.py` | 100% |
| **Total medido** | **94%** |

---

## 9. Deuda técnica conocida (v2.3)

### Endpoints deprecated (sin callers activos en frontend v2.3+)
- `POST /auth/register-and-quote` — marcado `[DEPRECATED]`; tiene bug pre-existente `UnboundLocalError: extra_optional` nunca detectado (GuestWizardPage eliminado). Eliminar en v2.4.
- `POST /quotations/preview` — marcado `[DEPRECATED]`; sin callers. Eliminar en v2.4.
- `guestApi` en `api.ts` — funciones huérfanas (no hay páginas que las llamen). Limpiar en v2.4.

### Tests pendientes
- `test_generator.py` — 11 PASS actualmente. Template PDF renovado es compatible.
- Swap con validaciones (proveedor inactivo, incompatible, fecha) — sin tests de integración.
- Rules CRUD — tests de integración existentes pero podrían ampliarse.

### Funcionalidad parcial
- `algorithm_used` y `execution_ms` no devueltos por `GET /quotations/{id}` — UI preparada con campos opcionales, muestra cuando estén disponibles.
- `narrativa` en PublicQuotationPage — solo muestra si está en `parametros_json["narrative"]`; generación Gemini es on-demand para PDF.

---

## 10. Lo que funciona bien y no debe tocarse

- **Módulo optimizer:** ILP + Greedy + fallback, 94% cobertura, 30 tests. No tocar sin actualizar tests.
- **Tokens de cliente:** `jti` garantiza unicidad; scope `request_adjustment`/`view`/`download_pdf` correctamente verificado en endpoints públicos.
- **Flujo CU-01 completo:** descripción → análisis visual → reglas → tier-filtering → dual optimizer → par básico/premium → PDF.
- **Flujo de aprobación:** aprobar → link firmado → vista pública → solicitud ajuste → staff lo atiende.
- **Chat conversacional:** acumulación de parámetros entre turnos, `parse_description` mockeado en tests (no llama Gemini), correcciones del usuario funcionan.
- **Arquitectura modular:** fronteras respetadas. `optimizer/` y `assistant/` no importan de `api/` o `models/`. `config_service.py` está en `core/` para evitar que `optimizer/` importe de `models/`.
- **Seguridad JWT doble:** `SECRET_KEY` para staff, `CLIENT_TOKEN_SECRET` para clientes — claves distintas, tokens incompatibles entre sí.
