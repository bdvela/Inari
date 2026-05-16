# DONE.md — Sesión de elevación a producción

Fecha: 2026-04-28. Referencia: STATUS.md generado en misma sesión.

---

## v2.3 — Redesign completo (2026-05-16)

Branch: `v2.3-redesign`. Tests: **292 backend PASS · 9 frontend PASS · 0 TypeScript errors**. Cobertura optimizer: 94%.

### HU implementadas

| ID | Título | Estado |
|---|---|---|
| HU-C01 | Página pública /p/:token sin login | ✅ COMPLETO |
| HU-C02 | PDF descargable desde link firmado | ✅ COMPLETO |
| HU-C03 | Solicitudes de ajuste desde link público | ✅ COMPLETO |
| HU-E01 | Aprobar cotización y generar link único | ✅ COMPLETO |
| HU-E02 | Generación dual básico/premium con tier proveedor | ✅ COMPLETO |
| HU-E03 | Vista de par básico/premium + botón aprobar | ✅ COMPLETO |
| HU-A01 | Configuración quality_weight desde UI admin | ✅ COMPLETO |
| HU-A02 | Inspección de logs del optimizer | ✅ COMPLETO |
| HU-A03 | Panel admin con campo tier en proveedores | ✅ COMPLETO |
| HU-T01 | Chat conversacional para iniciar cotización | ✅ COMPLETO |
| HU-T02 | Eliminación flujo guest (wizard público) | ✅ COMPLETO |
| HU-SEC | Tokens JWT firmados para cliente (sin sesión) | ✅ COMPLETO |
| HU-DEP | Documentación endpoints deprecated | ✅ COMPLETO |

### Nuevos archivos backend

**Módulos:**
- `backend/modules/auth/__init__.py`
- `backend/modules/auth/client_tokens.py` — `create_client_token`, `verify_client_token`, `jti` único
- `backend/modules/assistant/__init__.py`
- `backend/modules/assistant/chat_orchestrator.py` — `start_session`, `process_message`, `confirm_session`, `expire_sessions`

**Routers:**
- `backend/api/routers/public.py` — `GET/POST /public/quotations/by-token` y sub-endpoints
- `backend/api/routers/chat.py` — `POST /chat/start`, `/{id}/message`, `/{id}/confirm`
- `backend/api/routers/admin.py` — optimizer-config + optimization-logs

**Modelos:**
- `backend/models/chat_session.py` — `ChatSession` (UUID PK, messages JSON, extracted_params)
- `backend/models/system_config.py` — `SystemConfig` (key-value para parámetros del sistema)

**Core:**
- `backend/core/config_service.py` — `get_quality_weight`, `set_quality_weight`

**Schemas:**
- `backend/api/schemas/public_quotation.py` — schemas públicos sin datos sensibles
- `backend/api/schemas/quotation.py` — `QuotationLevelEnum`, `DualGenerationResponse`

**Migraciones:**
- `f0a1b2c3d4e5_add_chat_sessions.py` — tabla `chat_sessions`
- `a1b2c3d4e5f0_add_provider_tier.py` — columna `providers.tier` VARCHAR(10) DEFAULT 'basico'
- `b1c2d3e4f5a6_add_system_config.py` — tabla `system_config` + seed quality_weight=1.0

### Archivos backend modificados

- `backend/models/models.py` — Provider +`tier`, QuotationStatus +`APROBADA_ENVIADA/CANCELADA/RECHAZADA`
- `backend/modules/optimizer/schemas.py` — `ProviderOption` +`tier: str = "basico"`
- `backend/modules/proposal_gen/generator.py` — `generate_proposals` +`all_providers` param (tier-aware)
- `backend/api/routers/quotations.py` — tier filtering, quality_weight desde DB, `approve_and_share`, fix `r.estado.value` bug
- `backend/api/routers/auth.py` — `register_and_quote` marcado `[DEPRECATED]` + bug descubierto (`UnboundLocalError: extra_optional`)
- `backend/main.py` — registros de routers `public`, `chat`, `admin`
- `alembic/env.py` — imports `chat_session`, `system_config` models
- `tests/integration/conftest.py` — imports modelos nuevos para `create_all`

### Nuevos tests

**Integración (10 archivos, ~90 tests):**
- `test_auth_regression.py` — contratos JWT, mismos mensajes 401, scope de roles
- `test_approve_and_share.py` — flujo completo aprobación + tokens únicos (jti)
- `test_public_quotation.py` — endpoint público, sin proveedor en response, 401/403
- `test_public_pdf.py` — PDF/HTML sin proveedor, narrativa, condiciones de pago
- `test_public_requests.py` — solicitudes de ajuste desde link, scope, validación 200-1000
- `test_chat_endpoints.py` — flujo chat completo, 403, 410 expirado, 422 vacío
- `test_dual_generation.py` — cotización dual por tier, logs, fallback
- `test_admin_config.py` — quality_weight CRUD, rol ADMIN, integración optimizer
- `test_optimization_logs_api.py` — paginación, filtros, 405 en DELETE/PATCH/PUT
- `test_deprecated_endpoints.py` — documentación endpoints deprecated

**Unitarios (2 archivos):**
- `tests/unit/test_client_tokens.py` — 14 tests JWT (sin PII, jti, expiración, manipulación)
- `tests/unit/test_chat_orchestrator.py` — 9 tests orquestador con parse_description mockeado

### Nuevos archivos frontend

**Páginas:**
- `frontend/src/pages/ChatQuotationPage.tsx` — interfaz chat 2-col con panel parámetros en vivo
- `frontend/src/pages/PublicQuotationPage.tsx` — vista pública /p/:token con historial + solicitudes
- `frontend/src/pages/AdminSystemConfigPage.tsx` — slider quality_weight 0-5
- `frontend/src/pages/AdminOptimizationLogsPage.tsx` — tabla paginada + modal JSON detail

**Servicios:**
- `frontend/src/services/publicApi.ts` — endpoints públicos sin auth interceptor
- `frontend/src/services/chatApi.ts` — chat endpoints con auth

**Tests:**
- `frontend/src/test-setup.ts` — setup vitest + @testing-library/jest-dom
- `frontend/src/pages/__tests__/QuotationResultPage.test.tsx` — 4 smoke tests
- `frontend/src/pages/__tests__/AdminProvidersPage.test.tsx` — 5 smoke tests

### Archivos frontend modificados

- `frontend/src/App.tsx` — rutas `/p/:token`, `/quotations/new` → chat, `/admin/*` nuevas, redirect `/cotizar`→`/`
- `frontend/src/components/shared/Layout.tsx` — menú "Sistema" + "Logs optimizer" para admin
- `frontend/src/services/api.ts` — `http` exportado, `adminApi`, tipos nuevos
- `frontend/src/types/index.ts` — `Provider.tier`, `Quotation.algorithm_used?`, `algorithm_used?`
- `frontend/src/pages/AdminProvidersPage.tsx` — dropdown tier, badge TierBadge, filtro por tier
- `frontend/src/pages/QuotationResultPage.tsx` — botón "Aprobar y enviar", modal URL cliente, chip algoritmo
- `frontend/src/pages/LandingPage.tsx` — CTAs `/cotizar` → WhatsApp/Instagram, sección Contáctanos
- `frontend/src/pages/RegisterPage.tsx` — aviso solo personal autorizado
- `vite.config.ts` — configuración vitest (jsdom, globals, setupFiles)

### Archivos eliminados

- `frontend/src/pages/GuestWizardPage.tsx` — flujo guest reemplazado por chat
- `frontend/src/pages/GuestResultPage.tsx` — flujo guest reemplazado por /p/:token
- `frontend/src/components/RegisterWithQuotationModal.tsx` — modal guest eliminado

---

## Sesión 14 — Solicitudes de ajuste cliente → ejecutivo (human-in-the-loop) (2026-05-07)

Commit: `6a8bfd2`

### Modelo y migración
- `QuotationRequest` en `backend/models/models.py` — id, cotizacion_id, cliente_id, mensaje, estado (VARCHAR: pendiente/en_revision/resuelta), created_at
- Migración `e2f5a8b3c1d7_add_quotation_requests.py` — tabla `quotation_requests`
- `core/database.py`: `create_all` con `checkfirst=True`
- `Quotation.requests` relationship con `order_by=created_at`

### Endpoints
- `POST /quotations/{id}/requests` — cliente crea solicitud de ajuste (mensaje libre)
- `GET /quotations/{id}/requests` — lista solicitudes de una cotización (client/ejecutivo/admin)
- `PATCH /quotations/requests/{request_id}` — ejecutivo/admin actualiza estado (en_revision/resuelta)
- `GET /quotations/` — ahora retorna `pending_requests` (count int) en cada item para staff

### Frontend
- Vista cliente en `QuotationResultPage`: widget "Solicitar ajuste" inline — textarea, botón submit, confirmación, estado de solicitud activa
- Vista ejecutivo en `QuotationResultPage`: panel de solicitudes con botones "En revisión" / "Resuelta"
- Dashboard staff (`DashboardPage`): badge naranja en filas con solicitudes pendientes
- `services/api.ts`: funciones `createRequest`, `getRequests`, `updateRequest`
- `types/index.ts`: interfaz `QuotationRequest` con campos estado

### Tests
- 196 pasando, 4 fallos en `test_generator.py` (template PDF renovado, tests desactualizados — deuda técnica)

---

## Sesión 13 — Vista cotización cliente 2-col desktop + dashboard responsive (2026-05-07)

Commit: `b8c8104`

### Frontend
- `QuotationResultPage`: layout 2 columnas en desktop (left: hero/métricas/servicios, right sticky: análisis IA/toggle nivel/narrativa/PDF). Mobile: single-column sin cambios.
- `Layout`: sidebar drawer mobile con hamburger, backdrop, auto-close on navigate
- `DashboardPage` cliente: cards agrupadas por evento (básica + premium en misma card), toggle card/lista, métricas sin jerga interna ("Propuestas activas", no "Cotizaciones")

---

## Sesión 12 — UX completo: paneles por rol, flujo guest, landing redesign (2026-05-07)

Commit: `750decd`

### Dashboard cliente
- Cards agrupadas por evento (básica/premium juntas), toggle card/lista
- Responsive: columnas colapsables en mobile
- Métricas útiles: presupuesto promedio, eventos este mes

### Sidebar / Layout
- Responsive con drawer mobile + hamburger menu
- Menú diferenciado por rol: cliente (Dashboard/Nueva/Ajustes), staff (+ Reglas/Paquetes/Proveedores)

### Flujo guest completo
- `GuestWizardPage` → llama `POST /quotations/preview` → muestra resultado en `GuestResultPage`
- Registro/login in-page (`RegisterWithQuotationModal`) preservando resultados de preview
- Opciones: registrarse con cotización guardada, solo ver resultado, solo registrarse

### Auth nuevos endpoints
- `GET /auth/me` — perfil del usuario autenticado
- `PATCH /auth/me` — editar nombre
- `POST /auth/me/change-password` — cambiar contraseña (valida password actual)

### Backend
- `evento_fecha` incluido en listado `GET /quotations/`
- `POST /quotations/parse-description` ahora acepta requests sin auth (útil para guest wizard)

### Landing page
- Rediseño completo con fotos, animaciones scroll, contador stats (eventos, clientes, etc.)

### Register
- Rediseño visual alineado con LoginPage

---

## Sesión 11 — Paneles por rol, PDF 3-páginas, cotización sin registro (2026-05-07)

Commit: `6f1d61e`

### Paneles diferenciados por rol
- Layout menú lateral: cliente (Dashboard/Nueva), ejecutivo (Dashboard/Nueva/Reglas/Paquetes), admin (Proveedores/Reglas/Paquetes)
- Dashboard cliente: subtítulo "Mis eventos y propuestas", empty state con CTA "Crear mi primera cotización"
- 403 cross-client: intento de ver cotización ajena → redirect con mensaje claro
- Bloque "Datos del cliente" en `NewQuotationPage` wizard — visible solo para ejecutivo (nombre + DNI)
- Modal confirmación en delete de reglas y paquetes

### Historial de cambios de cotización
- Modelo `QuotationChangeLog` + migración `d1e4f7a2c8b0`
- Log automático en: crear cotización, reproceso, swap de proveedor
- `GET /quotations/{id}/changelog` — endpoint para leer logs
- Panel colapsable en `QuotationResultPage` (solo ejecutivo/admin)

### PDF mejorado — 3 páginas
- Página 1: portada oscura (#1A1714) con logo INARI GROUP, tipo evento, cliente, fecha
- Página 2: servicios en cards con índice de calidad visual
- Página 3: resumen inversión + términos y condiciones + firma del cliente
- **Versión cliente** (sin nombres de proveedores) y **versión ejecutivo** (con proveedores)
- Botones diferenciados en UI: "PDF interno" / "PDF para cliente"
- Loaders en botones de descarga
- Narrativa: 80 palabras máx, sin markdown, sin nombres de proveedores

### Imágenes de referencia
- `style_images` se guardan en storage y crean `ReferenceImage` en BD al generar cotización
- `STORAGE_BASE_URL` corregido a `localhost:8000` por default
- Lightbox fullscreen con portal en `QuotationResultPage` (navegación ←→, Esc)

### Cotización sin registro (HU nueva)
- `GET /cotizar` → `GuestWizardPage` (público, sin sidebar)
- `POST /quotations/preview` — pipeline completo (análisis visual + reglas + optimizer + propuesta) sin guardar en BD
- `POST /auth/register-and-quote` — crea cuenta + cotización guardada en un paso
- `GuestWizardPage.tsx`, `GuestResultPage.tsx`, `RegisterWithQuotationModal.tsx`
- Landing CTAs apuntan a `/cotizar`

### Specs nuevas
- `specs/HU-panel-cliente.md`
- `specs/HU-panel-ejecutivo.md`
- `specs/HU-panel-admin.md`
- `specs/HU-cotizacion-sin-registro.md`

### Tipografía
- Cormorant Garamond reemplaza Syne/Playfair Display en headings (más elegante para eventos)

---

## Sesión 10 — HU inferencia servicios desde imágenes (2026-05-06)

### Spec
`specs/HU-inferencia-servicios-desde-imagenes-referencia.md`

### Módulo `backend/modules/visual_analysis/service_inference.py`
- `merge_inferred_services(suggested, confidence, required, optional) → list[str]`
- Umbral fijo 0.6 — por debajo retorna `[]`
- Deduplicación contra `required_services` y `optional_services`
- `_ALIAS_MAP` — mapea términos comunes fuera del catálogo al servicio más cercano
  (ej: "DJ" → "musica", "ambientacion" → "decoracion", "show de baile" → "animacion")
- Sin mapeo posible → descarta silenciosamente

### Backend `quotations.py`
- `extra_optional` inicializado en `[]` antes del análisis de estilo
- Tras `evaluate_rules`, llama `merge_inferred_services` con `style_result.suggested_services`
- `rule_result.optional_services` actualizado con los servicios inferidos válidos
- `parametros_json` guarda `image_inferred_services` para trazabilidad
- `get_quotation` expone `image_inferred_services` en el response
- Response de `generate` incluye `image_inferred_services`

### Prompts
- `STYLE_ANALYSIS_SYSTEM_PROMPT` actualizado — ahora extrae `visual_elements` y `suggested_services`
- `StyleAnalysisResult` schema: añadidos `visual_elements: list[str]` y `suggested_services: list[str]`

### Frontend
- `Quotation.image_inferred_services: string[]` en `types/index.ts`
- `InferredServicesCard` en `QuotationResultPage` — vista ejecutivo con estado por servicio
- Mensaje cliente: "Detectamos que podrías necesitar: X, Y" (solo para rol cliente)
- `StyleAnalysisCard` ya existente complementa con elementos decorativos y paleta

### Decisión de diseño
- Servicios inferidos = opcionales siempre. El optimizer los descarta si no hay presupuesto.
- Umbral 0.6 no configurable en esta versión — evita complejidad sin caso de uso claro aún.
- No se re-aplica en reproceso manual — el ejecutivo controla qué servicios incluir al ajustar.

### Tests
- 15 tests nuevos en `test_hu_inferencia_servicios.py` — todos GREEN
- **200 tests totales pasando. tsc: 0 errores.**

---

## Sesión 9 — Rediseño visual completo (2026-05-06)

### Backend
- `parametros_json` en generate/reprocess almacena `package_selected`
- `get_quotation` retorna `package_selected` desde `parametros_json`
- `types/index.ts`: `PackageSelected` interface + añadida a `Quotation` y `GenerateQuotationResult`

### Componentes shared nuevos
- `QualityBar.tsx` — barra semántica (ok ≥80%, accent ≥50%, amber <50%)
- `EventTypeSelect.tsx` — dropdown custom, cierre por click externo, check en opción activa
- `DateInput.tsx` — input DD/MM/AAAA con auto-slashes, devuelve ISO al form via Controller

### P1 — NewQuotationPage
- `<select>` nativo → `EventTypeSelect` via react-hook-form Controller
- `<input type="date">` → `DateInput` DD/MM/AAAA
- Dropzone: grid 2×2 con previews cuadrados, borde naranja en dragOver
- 78 inline styles → className (Tailwind + design system classes)
- Stepper existente conservado, migrado a className

### P2 — QuotationResultPage
- Grid proveedores: 3 cols → 2 cols (más espacio respiración)
- Badge "Premium": `position:absolute` → inline en header de card
- Provider oculto: celda vacía → texto `"Proveedor seleccionado"` en text-muted/italic
- Panel paquete base INARI GROUP antes del grid (si `package_selected` existe)
- Banner warning amarillo si `exceeds_max_range === true`
- 115 inline styles reducidos, QualityBar reutilizado

### P3 — DashboardPage
- Botón "Exportar" eliminado (sin funcionalidad, confundía al usuario)
- Calidad en tabla: texto % → `QualityBar` con color semántico
- Import `Download` eliminado

### P4 — AdminProvidersPage
- Form "ID Servicio" numérico → `<select>` cargado desde `GET /rules/services/`
- Tabla columna "Servicio": `#4` → nombre del servicio via `serviceNameById()`

### P5 — LandingPage
- Demo credentials: card `.glass-raised` con ícono `KeyRound`, descripción de rol, botón btn-primary
- Import `KeyRound` agregado

### P6 — LoginPage
- Botón Google + divider eliminados
- "¿Olvidaste tu clave?" → texto gris muted sin link
- "¿Aún no eres parte del equipo?" → "¿Aún no tienes acceso? Solicítalo a tu administrador"
- Import `Globe` eliminado

**tsc: 0 errores. 185 backend tests pasando.**

---

## Sesión 8 — Tests + implementación HU-03: narrativa automática en PDF (2026-05-06)

### Decisión de diseño — firma de generate_narrative
Opción B: tests adaptados a firma existente. Cambiar la firma habría roto
`download_pdf` (quotations.py línea ~933) que ya la consume con los 7 parámetros originales.
Solo se añadió `cliente_nombre: str | None = None` como parámetro opcional (aditivo, sin breaking change).

### TAREA 1 — Cambio en `backend/modules/proposal_gen/narrative.py`
- Parámetro `cliente_nombre: str | None = None` añadido a `generate_narrative`
- Prompt incluye "- Cliente: {nombre}" cuando se provee
- Callers existentes no pasan el parámetro → comportamiento idéntico

### TAREA 2 — Tests unitarios HU-03
**Archivo: `tests/unit/proposal_gen/test_hu_narrativa_pdf.py`**
- 14 tests mapeados a criterios de aceptación de `specs/HU-generacion-automatica-narrativa-pdf-cotizacion.md`
- CA1 (1): generación automática devuelve string
- CA2 (1): datos del evento reflejados en narrativa
- CA3 (1): tono cálido — sin "Estimado/a"
- CA4 (1): narrativa menciona servicios seleccionados
- CA5 (2): entre 3 y 5 oraciones
- CA6 (1): sin símbolo S/ ni "soles"
- CA7 (1): datos faltantes sin placeholders (evento_fecha=None → "fecha por confirmar")
- CA8 (1): Proposal.narrative existe en schema
- CA9 (1): Proposal.narrative es mutable (edición del ejecutivo)
- CA10 (1): segunda llamada devuelve narrativa diferente
- Fallo Gemini (2): string vacío + sin excepción; sin API key → string vacío

**Total: 184 tests pasando.**

---

## Sesión 7 — Implementación completa HU-02: selección automática de paquete (2026-05-06)

### TAREA 1 — Modelo y migración
- `BasePackage` en `backend/models/models.py` — id, name, content, cost, min_guests, max_guests, is_active
- Migración `c4d2e8f1a9b3_add_base_packages.py` — tabla `base_packages`

### TAREA 2 — Endpoint admin CRUD (`/api/v1/packages/`)
- `backend/api/routers/packages.py` — GET (ejecutivo+admin), POST/PUT/DELETE (solo admin)
- Registrado en `main.py`
- Validación: min_guests < max_guests en create

### TAREA 3 — Integración en flujo generate_quotation
- Carga paquetes activos de BD antes del optimizer
- Llama `select_package(num_invitados, pkg_list)`
- `available_budget = presupuesto_maximo - package_cost` → pasa al optimizer
- `costo_total = result.total_cost + package_cost`
- Respuesta incluye `package_selected` con id, name, cost, exceeds_max_range
- Sin paquetes configurados → flujo continúa sin costo de paquete (backward compat)

### TAREA 4 — Frontend
- `ServicePackageModel` en `types/index.ts`
- `packagesApi` en `services/api.ts`
- `AdminPackagesPage.tsx` — lista ordenada por rango, form inline, CRUD completo
- Ruta `/admin/packages` en `App.tsx` (protegida: ejecutivo+)
- Ítem "Paquetes" en sidebar de `Layout.tsx`

**Total: 171 tests pasando.**

---

## Sesión 6 — Módulo packages + tests HU selección automática de paquete (2026-05-06)

### TAREA 1 — Módulo `backend/modules/packages/`

**`schemas.py`**
- `ServicePackage` — id, name, content, cost, min_guests, max_guests
- `PackageSelectionResult` — selected_package, alert, exceeds_max_range
- `PackageOverrideLog` — original_package_id, new_package_id, justification, executive_id

**`exceptions.py`**
- `NoPackagesConfiguredError` — estado inválido del sistema (sin paquetes configurados)

**`selector.py`**
- `select_package(guest_count, packages) → PackageSelectionResult`
  - None → sin paquete + alerta
  - vacío → NoPackagesConfiguredError
  - límite exacto → rango superior (max min_guests entre coincidencias)
  - supera máximo → paquete mayor + alerta + exceeds_max_range=True
- `create_override_log(original_package_id, new_package_id, justification, executive_id) → PackageOverrideLog`

### TAREA 2 — Tests unitarios HU selección de paquete

**Archivo: `tests/unit/packages/test_hu_seleccion_paquete.py`**
- 19 tests mapeados a criterios de aceptación de `specs/HU-seleccion-automatica-paquete-servicios-por-invitados.md`
- CA1 (3), CA2 (2), CA3 (2), CA4 (2), CA5 (1), CA6 (2), CA7 (1), CA8 (2), CA9 (1), CA10 (1), RN (1)

**Total: 124 tests pasando. Cobertura: 94%.**

---

## Sesión 5 — Tests HU extracción automática + normalize_event_type (2026-05-06)

### TAREA 1 — Tests unitarios HU extracción automática

**Archivo: `tests/unit/visual_analysis/test_hu_extraccion_automatica.py`**
- 23 tests nuevos mapeados a criterios de aceptación de `specs/HU-extraccion-automatica-datos-evento-cotizacion.md`
- CA2: 5 tests — extracción de cada campo (tipo, fecha, invitados, presupuesto, estilo)
- CA5: 3 tests — extracción parcial retorna `parseable=True`, campos faltantes son `None`, no lanza excepción
- CA6: 2 tests — descripción vaga retorna `parseable=False` con mensaje orientador
- CA7: 2 tests — re-análisis retorna datos frescos sin conservar llamada anterior
- CA8: 2 tests — `Event.descripcion` existe y acepta descripción original
- TestFalloGemini: 1 test — error de API no lanza excepción
- TestNormalizacionTipoEvento: 6 tests — `normalize_event_type` mapea a `EventType` enum

### TAREA 2 — Implementación de `normalize_event_type`

**`backend/modules/visual_analysis/text_parser.py`**
- Nueva función `normalize_event_type(raw: str | None) → EventType`
- Mapea string libre de Gemini al enum `EventType` via `EventType(raw.lower())`
- Valores desconocidos y `None` → `EventType.OTRO`
- Case-insensitive

**Total: 106 tests pasando. Cobertura: 94%.**

---

## Sesión 4 — Pipeline conversacional + estilo visual (2026-04-29)

### TAREA 1 — Entrada conversacional

**Endpoint `POST /quotations/parse-description`**
- Recibe `{ description: string }`, llama Gemini, extrae: `event_type`, `guest_count`, `approximate_date`, `max_budget`, `style_hints`, `mandatory_services`, `confidence`
- Si `confidence < 0.25` o error: retorna `{ parseable: false, message: "..." }`
- Nunca lanza excepción al cliente

**Módulo `backend/modules/visual_analysis/text_parser.py`**
- `parse_description(description) → ParsedDescription`
- Prompt en `prompts.py` (TEXT_PARSER_SYSTEM_PROMPT) — no hardcodeado

**Frontend `NewQuotationPage.tsx` — wizard 2 pasos:**
- Paso 1: textarea libre + botón "Analizar descripción" → Gemini pre-llena form
- Muestra badges de lo detectado + confianza
- "Completar formulario directamente" como escape hatch
- Paso 2: form editable + dropzone 1-3 imágenes de estilo
- Paso 3: loading con barra de progreso y fases animadas

### TAREA 2 — Análisis de estilo visual

**Módulo `backend/modules/visual_analysis/style_analysis.py`**
- `analyze_style_references(images) → StyleAnalysisResult`
- Acepta 1-3 imágenes, análisis conjunto como "mood board" no evento completo
- Retorna: `dominant_colors`, `aesthetic_style`, `luxury_level` (1-5), `style_keywords`, `confidence`
- Prompt en `prompts.py` (STYLE_ANALYSIS_SYSTEM_PROMPT)

**Integración en `/generate`:**
- Nuevo parámetro `style_images: list[UploadFile]` (mantiene `image` por backward compat)
- Llama `analyze_style_references` si hay style_images
- `luxury_level → quality_weight` via `_luxury_to_quality_weight()`: {1:0.70, 2:0.85, 3:1.00, 4:1.30, 5:1.60}
- Pasa `quality_weight` al optimizer

**Optimizer: `quality_weight` en schemas/greedy/ILP**
- `OptimizationInput.quality_weight: float = 1.0` (backward compatible)
- Greedy: `_select_key = quality_index * qw / costo` (balanced) o `quality_index * qw` (premium)
- ILP: objective = `quality_index * qw * x[...]`
- Default 1.0 → 111 tests existentes no cambian

**DB: `style_analysis_json` en quotations**
- Migración: `b7e2f1c9d3a5_add_style_analysis_to_quotations.py`
- Campo JSON nullable en `Quotation` model
- `get_quotation` retorna `style_analysis` en response

### TAREA 3 — Narrativa en PDF

**`backend/modules/proposal_gen/narrative.py`**
- `generate_narrative(...) → str`
- Input: tipo evento, invitados, fecha, estilo, aesthetic_style, servicios seleccionados
- Gemini genera 2-3 párrafos como ejecutivo de ventas (tono cálido + profesional)
- Máx 200 palabras, en español
- Prompt en `proposal_gen/prompts.py` (NARRATIVE_SYSTEM_PROMPT)
- Si falla: retorna `""` — nunca bloquea PDF

**`Proposal.narrative: str = ""`** — campo nuevo en schema

**`download_pdf` endpoint:**
- Llama `generate_narrative` (async) antes de construir Proposal
- Usa `style_analysis_json` guardado en quotation para personalizar
- Pasa `narrative` al Proposal → template HTML lo renderiza

**`proposal.html`:** sección "Descripción de tu evento" con borde dorado (solo si narrative != "")

### TAREA 4 — Tests nuevos (21 tests)
- `test_text_parser.py` (10): JSON puro, markdown, embebido, sin presupuesto, vago, corto, error API, sin key, etc.
- `test_style_analysis.py` (7): 1 imagen, 3 imágenes, formato inválido, error API, vacío, sin key, luxury_level clampeado
- `test_narrative.py` (4): con estilo, sin estilo, error Gemini, sin key

**Total: 85 tests pasando. tsc: 0 errores.**

### Decisiones de diseño

- **style_images separados de image**: Se mantiene el parámetro `image` (backward compat con tests de integración) y se agregan `style_images` como nuevo parámetro multipart. Los tests existentes no pasan `style_images` → quality_weight queda 1.0 → comportamiento idéntico.
- **Narrativa en PDF, no en cotización**: Se genera al momento de descargar PDF (async endpoint), no al generar cotización. Evita ralentizar el flujo principal. El `style_analysis_json` ya guardado en quotation se reutiliza.
- **`quality_weight` default 1.0**: Multiplicador neutro. Con default 1.0, todos los tests existentes del optimizer pasan sin cambios. Solo cambia cuando se detecta luxury_level via imágenes de estilo.

---

## Sesión 2 — Madurez de producto y rediseño UI (2026-04-28)

### TAREA 1 — Correcciones de lógica de roles

#### 1a. Admin bloqueado de generar cotizaciones
- **Backend:** `backend/api/routers/quotations.py` → `POST /quotations/generate` rechaza con HTTP 403 si `role == ADMIN`
- **Frontend:** `NewQuotationPage.tsx` → `useEffect` redirige admin a `/admin/providers` inmediatamente
- **Frontend:** `Layout.tsx` → "Nueva Cotización" oculto para rol `admin`

#### 1b. Flujo de login diferenciado por rol
- **Archivo:** `frontend/src/pages/LoginPage.tsx`
- Lee `user_role` del localStorage (escrito síncronamente por `persistToken`) inmediatamente tras `await login()`
- `admin` → `/admin/providers`, resto → `/dashboard`

### TAREA 2 — Robustez y UX

#### 2a. Estados de error mejorados en wizard de cotización
- **Archivo:** `frontend/src/pages/NewQuotationPage.tsx`
- Error `basica_factible && premium_factible === false` → mensaje específico de presupuesto insuficiente, no navega a resultado
- Loading con 3 fases animadas: "Analizando imagen", "Aplicando reglas", "Optimizando" — con progress de fase actual
- Nota de hasta 15s cuando hay imagen adjunta
- Banner warning si error contiene "imagen" (análisis visual falló)
- Errores de red → mensaje con hint de reintentar

#### 2b. Confirmaciones antes de acciones destructivas
- **Nuevo componente:** `frontend/src/components/shared/ConfirmModal.tsx`
  - Modal con backdrop, Playfair Display, soporte `danger` prop (botón rojo)
  - Acepta `title`, `message`, `confirmLabel`, `cancelLabel`, `onConfirm`, `onCancel`
- **Swap de proveedor:** `AlternativesPanel` muestra ConfirmModal con nombre del proveedor actual y el nuevo antes de ejecutar
- **Reproceso:** form submit ahora llama `setPendingReprocessData(data)` → ConfirmModal → `reprocessMutation.mutate()`

#### 2c. Historial de versiones de cotización
- **Archivo:** `frontend/src/pages/QuotationResultPage.tsx`
- Usa `useQuery(['quotations'])` (ya cacheado desde Dashboard) y filtra por `evento_id === quotation.evento_id && id !== current`
- Sección colapsable "Historial de versiones" con badge contador
- Lista por versión+nivel con status badge y costo
- Click navega a esa versión (lectura)
- Solo visible cuando hay otras versiones del mismo evento

### TAREA 3 — Sistema de diseño

#### Paleta y tipografía
- **`frontend/tailwind.config.js`** — cambios principales:
  - `accent` → dorado cálido (`#C9A84C` y escala)
  - `surface.50` → crema cálido (`#F5F0E8`)
  - `fontFamily.display` → `Playfair Display, Georgia, serif`
  - `fontFamily.mono` → `JetBrains Mono, Menlo, Consolas`
  - `shadow-glow` → basado en gold `rgba(201,168,76,0.25)`
  - Colores semánticos `inari-*`: `inari-night`, `inari-gold`, `inari-cream`, `inari-text`, `inari-muted`, `inari-success`, `inari-error`, `inari-border`
- **`frontend/index.html`** — Google Fonts: Playfair Display (400–800, italic) + JetBrains Mono
- **`frontend/src/index.css`** — cambios:
  - `btn-primary`: `text-inari-night` (oscuro sobre dorado — pasa WCAG AAA 7.3:1)
  - `btn-secondary`, `input-field`, bordes → usan `inari-border`, `inari-muted`
  - `.section-title` → `font-display` (Playfair Display)
  - `badge-premium` → dorado (`accent-50/800`)

#### Inline gradients actualizados (rgba red → gold)
- `LandingPage.tsx`, `LoginPage.tsx`, `RegisterPage.tsx` — gradientes radiales inline cambiados de `rgba(233,69,96,0.15)` a `rgba(201,168,76,0.10)`

### TAREA 4 — Optimizaciones técnicas

#### Componentes shared creados
- `frontend/src/components/shared/ConfirmModal.tsx` — modal de confirmación reutilizable
- `frontend/src/components/shared/LoadingSpinner.tsx` — spinner con sizes sm/md/lg y texto opcional, modo fullPage
- `frontend/src/components/shared/SkeletonCard.tsx` — skeleton con SkeletonLine helper y prop `lines`

### Verificación final sesión 2
- `tsc --noEmit` → 0 errores TypeScript
- `pytest tests/unit/` → 64/64 pasando (sin regresiones)

---

## Tareas completadas (sesión 1)

### TAREA 1 — Bugs críticos

#### 1a. CORS hardcodeado → configuración por variable de entorno
- **Archivos:** `backend/core/config.py`, `backend/main.py`, `.env.example`
- `ALLOWED_ORIGINS: str` agregado a Settings (default: localhost dev)
- `main.py` parseado de `settings.ALLOWED_ORIGINS.split(",")`
- `.env.example` documenta cómo configurar en Railway

#### 1b. `algorithm_used` hardcodeado en PDF
- **Archivo:** `backend/api/routers/quotations.py` → función `download_pdf`
- Consulta `OptimizationLog` por `cotizacion_id` y usa `algoritmo_usado` real
- Fallback: `"DESCONOCIDO"` si no existe log

#### 1c. Swap sin validación de disponibilidad/compatibilidad
- **Archivo:** `backend/api/routers/quotations.py` → endpoint `POST /quotations/{id}/swap`
- Tres validaciones antes de hacer el swap:
  1. `provider.is_active == True` → HTTP 400
  2. Tipo de evento compatible → HTTP 400
  3. Fecha del evento no bloqueada → HTTP 400
- `q.evento` ya venía cargado por `get_by_id` via `selectinload`

#### 1d. `pdf_url` nunca se escribe → eliminado (Opción A)
- **Decisión de diseño:** PDF siempre on-demand vía endpoint; campo nunca se persistía, solo agregaba ruido al modelo. Eliminar es más limpio que añadir lógica de escritura.
- **Archivos modificados:**
  - `backend/models/models.py`: campo `pdf_url` removido de `Quotation`
  - `backend/models/repositories/quotation_repository.py`: parámetro `pdf_url` removido de `update_status`
- **Migración:** `alembic/versions/a3c1d8e0f2b4_drop_pdf_url_from_quotations.py`
  - `upgrade()`: `op.drop_column("quotations", "pdf_url")`
  - `downgrade()`: restaura la columna nullable

#### 1e. WeasyPrint fallback silencioso
- **Archivo:** `backend/modules/pdf_gen/generator.py`
- Antes: retornaba HTML silenciosamente con content-type PDF
- Ahora: lanza `RuntimeError` con mensaje claro indicando qué libs nativas faltan
- `_generate_html_fallback` se mantiene definida (por si se necesita en dev futuro) pero no se llama en producción

### TAREA 2 — Funcionalidades ausentes

#### 2a. Router y UI para reglas de negocio (RF-11)
- **Backend:** `backend/api/routers/rules.py` (nuevo)
  - `GET /rules/` — lista todas las reglas (ejecutivo+)
  - `POST /rules/` — crea regla (admin)
  - `PUT /rules/{id}` — actualiza es_obligatorio/condicion/descripcion (admin)
  - `DELETE /rules/{id}` — elimina regla (admin)
  - `GET /rules/event-types/` — lista EventTypes disponibles (ejecutivo+)
  - `GET /rules/services/` — lista servicios activos para dropdown (ejecutivo+)
  - Validación de unicidad (tipo_evento + servicio_id) antes de crear
  - Registrado en `backend/main.py`
- **Frontend:** `frontend/src/pages/AdminRulesPage.tsx` (nuevo)
  - Tabla agrupada por tipo de evento
  - Formulario crear/editar con dropdown de servicios y toggle es_obligatorio
  - Condición `min_invitados` como campo simple (se serializa a JSON)
  - Solo admin puede crear/editar/eliminar; ejecutivo puede ver
- **Routing:** `/admin/rules` en `App.tsx` con `requiredRole="ejecutivo"` (ejecutivo ve, admin edita)
- **Nav:** `Layout.tsx` muestra "Reglas de Negocio" para ejecutivo y admin; "Proveedores" solo para admin

#### 2b. Vista diferenciada para Ejecutivo en Dashboard
- **Archivo:** `frontend/src/pages/DashboardPage.tsx`
- Detecta `isStaff = role === 'ejecutivo' || role === 'admin'`
- Para staff: columna "Cliente" visible en tabla, filtro de búsqueda incluye `cliente_nombre`
- Filtros: input de texto (evento o cliente) + dropdown de estado
- Resultados filtrados con `useMemo` para no re-fetch
- Contador "X de Y" cuando hay filtro activo
- **Backend:** `GET /quotations/` ahora retorna `cliente_nombre` vía `selectinload(Quotation.cliente)`
- **Frontend types:** `QuotationSummary.cliente_nombre: string | null` agregado

### TAREA 3 — Tests nuevos

#### 3a. Tests de visual_analysis
- **Archivo:** `tests/unit/visual_analysis/test_client.py` (13 tests)
- `TestParseResponse`: 7 tests — JSON puro, markdown, embebido, inválido, vacío, incompleto
- `TestAnalyzeImage`: 6 tests — éxito, confianza baja, servicios vacíos, error API, sin key, formato inválido
- Patch sobre `backend.modules.visual_analysis.client.settings` (module-level var, no `get_settings`)
- `_call_gemini_sync` mockeado para no hacer llamadas reales

#### 3b. Tests de ILP
- **Archivo:** `tests/unit/optimizer/test_ilp.py` (12 tests)
- `TestILPFeasibleCases`: catálogo pequeño, un proveedor por servicio, presupuesto exacto, cobertura, presupuesto
- `TestILPInfeasibleCases`: presupuesto insuficiente, sin proveedor, incompatible, no lanza excepción
- `TestILPOptimalityVsGreedy`: ILP calidad >= Greedy para mismo input, selección óptima bajo presupuesto justo

#### 3c. Tests de pdf_gen
- **Archivo:** `tests/unit/pdf_gen/test_generator.py` (11 tests)
- Prueba el template Jinja2 directamente via `_get_jinja_env()` — sin WeasyPrint
- Verifica: nombre cliente, ID cotización, nivel (BÁSICO/PREMIUM), algoritmo, servicios, proveedores, quality_index=0, estilo null

### TAREA 4 — Limpieza

#### 4a. ANTHROPIC_API_KEY legacy eliminado
- **Archivo:** `backend/core/config.py`
- Campo removido. Comentario `# Sistema usa Google Gemini (GEMINI_API_KEY)` agregado

#### 4b. VISION_MODEL actualizado a gemini-2.5-flash
- **Archivos:** `backend/core/config.py`, `.env.example`
- Default cambiado de `gemini-2.5-flash-lite` a `gemini-2.5-flash`

#### 4c. README de despliegue en Railway
- **Archivo:** `README.md` (era prácticamente vacío)
- Secciones: desarrollo local (backend + frontend + tests), despliegue Railway (vars de entorno, build, migraciones, WeasyPrint, CORS)

---

## Resultado de coverage final

```
backend/modules/optimizer/   → 96% (ILP: 100%, Greedy: 97%, Engine: 90%, Schemas: 100%)
backend/modules/rules_engine/ → 100%
Total unitario:               64 tests pasando, 0 fallos
```

Líneas no cubiertas en optimizer:
- `engine.py:70-73` — bloque `except` del fallback ILP→Greedy (requiere que PuLP falle, difícil de disparar en tests sin monkey-patch de PuLP)
- `greedy.py:95` — rama `optional but no budget` (cobierta condicionalmente según fixtures)

---

## Decisiones de diseño

1. **`pdf_url` removido (Opción A):** Más limpio que escribirlo on-demand porque el PDF se genera en tiempo real siempre. Guardar una URL implicaría lógica de storage adicional sin beneficio claro para este MVP.

2. **Ruta `/admin/rules` con `requiredRole="ejecutivo"`:** Ejecutivos necesitan ver las reglas para entender qué servicios se recomiendan. Solo admin puede modificarlas. La separación lectura/escritura está en el backend (require_role por endpoint).

3. **Filtro de dashboard client-side:** Con `LIMIT 100` en el backend, filtrar en el cliente es más simple y evita un endpoint de búsqueda adicional. Suficiente para MVP con carga esperada.

4. **`ALLOWED_ORIGINS` como string separado por coma:** Patrón estándar en Pydantic Settings para listas en variables de entorno. Evita serializar JSON en la variable de entorno.

5. **Patch de `settings` no de `get_settings` en tests de visual_analysis:** `settings = get_settings()` se ejecuta al importar el módulo (module-level). La caché de `@lru_cache` hace que el mock de `get_settings` no afecte a la variable ya asignada. Patch directo sobre `backend.modules.visual_analysis.client.settings` es la solución correcta.

---

## Deuda técnica restante (documentada, no implementada)

- **Tests de integración para swap con validación:** `test_quotations.py` no cubre los nuevos casos de validación del endpoint swap (proveedor inactivo, incompatible, fecha bloqueada). Agregar cuando se haga siguiente pasada de tests.

- **Endpoint de búsqueda de cotizaciones en backend:** Para volúmenes > 100 cotizaciones, el filtro client-side del dashboard dejará de funcionar. Agregar `GET /quotations/?search=&estado=&limit=&offset=` en futura iteración.

- **`update_status` en QuotationRepository sin callers:** El método existe pero ningún endpoint lo llama (los endpoints modifican el modelo directamente). Candidato a eliminar en refactor de limpieza.

- **Tests de integración para rules router:** `/rules/` CRUD no tiene tests de integración. Agregar en próxima sesión de tests.

- **CORS en `STORAGE_BASE_URL`:** Si se usa storage externo (S3/Supabase), el navegador también hará requests a ese dominio. Verificar que el bucket permita CORS desde los origins del frontend.

- **`_generate_html_fallback` en pdf_gen/generator.py:** Función definida pero nunca llamada (ahora se lanza RuntimeError). Candidata a eliminar si no se planea un modo de fallback deliberado.
