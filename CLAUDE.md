# CLAUDE.md — Sistema Inteligente de Propuestas de Eventos

Contexto para Claude Code. Lee antes de tocar código.

---

## ¿Qué es este proyecto?

Plataforma web para empresa peruana de eventos (RUC 20) que automatiza cotizaciones desde imágenes de referencia de clientes.

**Problema central:** proceso manual toma 2-4 horas por cotización, subjetivo, no escala. Sistema reduce a < 3 minutos con criterio consistente.

**Documento principal:** `docs/PRD_v2.docx` — requerimientos, casos de uso, modelo de datos, decisiones de arquitectura. Consultar antes de implementar.

---

## Arquitectura general

```
frontend/          → React + TypeScript + Tailwind CSS (SPA)
backend/           → FastAPI (Python)
  ├── api/         → Endpoints REST
  ├── modules/
  │   ├── visual_analysis/   → Integración con LLM multimodal (Claude API)
  │   ├── rules_engine/      → Motor de reglas de negocio por tipo de evento
  │   ├── optimizer/         → Motor de optimización de proveedores — NÚCLEO
  │   ├── proposal_gen/      → Generador de propuestas básica/premium
  │   └── pdf_gen/           → Generador de PDF con WeasyPrint
  ├── models/      → Modelos SQLAlchemy (ORM)
  └── core/        → Config, auth, logging, dependencias compartidas
docs/              → PRD, diagramas, documentación técnica
tests/             → Pruebas unitarias e integración
```

---

## El motor de optimización — el componente más importante

En `backend/modules/optimizer/`. Núcleo del sistema. Lo que diferencia este proyecto de "solo llamar a una API".

**Qué hace:** dado requerimientos de evento + catálogo de proveedores, selecciona combinación óptima que maximiza índice de calidad compuesto sin exceder presupuesto.

**Interfaz pública — respetar siempre:**
```python
# optimizer/engine.py
def optimize(requirements: OptimizationInput) -> OptimizationResult:
    ...
```

```python
# Tipos en optimizer/schemas.py
class OptimizationInput(BaseModel):
    budget: float
    required_services: list[str]       # IDs de servicios obligatorios
    optional_services: list[str]       # IDs de servicios opcionales
    event_type: str
    event_date: date
    providers: list[ProviderOption]    # catálogo disponible

class OptimizationResult(BaseModel):
    selected_providers: list[SelectedProvider]
    total_cost: float
    quality_score: float
    algorithm_used: str                # "ILP" o "GREEDY"
    feasible: bool
    execution_ms: int
```

**Regla crítica:** optimizer NO importa nada de `api/`, `models/` ni `pdf_gen/`. Solo recibe y devuelve sus propios schemas. Garantiza prueba aislada y reemplazo sin tocar resto del sistema.

**Algoritmos:**
- `IlpOptimizer`: usa PuLP. Garantiza optimalidad. Para catálogos < 500 combinaciones.
- `GreedyOptimizer`: ordena por ratio calidad/costo, selecciona secuencialmente. Rápido, para MVP.
- `OptimizerFactory`: elige cuál usar según tamaño del problema.

---

## Módulo de análisis visual

En `backend/modules/visual_analysis/`. Llama API de Claude (modelo con visión).

**Prompt del sistema** — en `visual_analysis/prompts.py`. Nunca hardcodear prompts en endpoints.

**Salida siempre es `VisualAnalysisResult`:**
```python
class VisualAnalysisResult(BaseModel):
    event_type: str                    # "boda", "corporativo", "cumpleanos", etc.
    style: str                         # "rustico", "moderno", "elegante", etc.
    inferred_services: list[str]       # servicios visualmente detectados
    visual_elements: list[str]         # elementos decorativos identificados
    confidence: float                  # 0.0 - 1.0
    raw_response: str                  # respuesta original del LLM (para debug/log)
```

**Errores:** imagen no procesable o API falla → lanza `VisualAnalysisError`. Endpoint captura, cliente continúa sin análisis visual (flujo alternativo CU-01).

---

## Modelo de datos — entidades clave

Ver PRD sección 9 para detalle completo. Resumen:

| Entidad | Tabla | Nota |
|---|---|---|
| Cliente | `clients` | |
| Evento | `events` | |
| ImagenReferencia | `reference_images` | URL en storage, resultado análisis en JSON |
| Proveedor | `providers` | tiene `quality_index` float, `compatible_event_types` array |
| Servicio | `services` | categoría (catering, deco, foto, etc.) |
| Cotización | `quotations` | tiene `version` int, `level` enum(basico/premium) |
| DetalleCotización | `quotation_details` | fila por proveedor seleccionado |
| Regla | `business_rules` | JSON configurable por admin |
| LogOptimización | `optimization_logs` | auditoria completa: input_json, output_json, ms |

**Regla de oro:** `quotations` nunca se eliminan, solo se versionan. Nueva versión al reprocesar (CU-02).

---

## Convenciones de código

### Python (backend)
- **Tipos siempre:** funciones públicas con type hints.
- **Pydantic para schemas:** nunca pasar dicts crudos entre módulos.
- **SQLAlchemy async:** usar `AsyncSession` en todos los repositorios.
- **Repositorio pattern:** lógica de BD en `models/repositories/`, nunca en endpoints.
- **Excepciones de dominio:** cada módulo define las suyas en `exceptions.py`.

### TypeScript (frontend)
- **Componentes funcionales** con hooks. Sin clases.
- **Zod** para validación de formularios.
- **React Query** para estado del servidor.
- **Sin `any`:** si aparece, es bug.

### General
- **Commits en español:** `feat(optimizer): implementar ILP con PuLP`
- **Un módulo = una responsabilidad.** Archivo > 300 líneas probablemente hace demasiado.
- **Comentar por qué, no qué.** Solo decisiones no obvias.

---

## Testing — obligatorio para el optimizer

Cobertura >= 80%. Componente más crítico, hay que demostrar en TSP.

```bash
# Correr tests del optimizer
pytest tests/unit/optimizer/ -v --cov=backend/modules/optimizer --cov-report=term-missing

# Tests de integración
pytest tests/integration/ -v
```

**Casos mínimos obligatorios:**
1. Selección con presupuesto suficiente para todos los servicios.
2. Presupuesto justo → elegir mejor ratio calidad/costo.
3. Presupuesto insuficiente para obligatorios → `feasible=False`.
4. Proveedor no disponible en fecha → no seleccionar.
5. Proveedor incompatible con tipo de evento → no seleccionar.
6. Catálogo vacío → manejo graceful.

---

## Variables de entorno

Nunca hardcodear credenciales. Usar `.env` local (no commitear) y `config/settings.py`.

```bash
# .env (ejemplo — copiar a .env y completar)
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/eventos_db
ANTHROPIC_API_KEY=sk-ant-...
STORAGE_BUCKET=eventos-referencias
SECRET_KEY=cambiar-en-produccion
```

---

## Flujo de desarrollo recomendado

1. **Lee el PRD** — identifica RF o CU correspondiente.
2. **Empieza por schema/modelo** — define tipos Pydantic antes de lógica.
3. **Implementa lógica de negocio** — en módulo correspondiente, sin dependencias de API.
4. **Escribe pruebas** — especialmente optimizer y reglas de negocio.
5. **Conecta el endpoint** — solo orquesta, sin lógica de negocio.
6. **Implementa UI** — consume endpoint desde React.

---

## Lo que NO hacer

- No poner lógica de negocio en endpoints FastAPI. Endpoints orquestan, no deciden.
- No llamar API de Anthropic directamente desde endpoint. Siempre via `visual_analysis/client.py`.
- No modificar `optimizer/engine.py` sin actualizar tests.
- No eliminar registros de `quotations` ni `optimization_logs`. Solo soft delete o versionado.
- No usar `print()` en producción. Usar logger de `core/logging.py`.
- No hacer consultas SQL raw fuera de repositorios.

---

## Contexto académico

TSP para titulación en Ingeniería de Software — UPC. Demuestra ingeniería de software en problema real.

Componentes con más peso para evaluador:
1. **Motor de optimización** → modelado formal y algoritmia.
2. **Arquitectura modular y desacoplada** → diseño de software.
3. **Pruebas unitarias documentadas** → calidad de software.
4. **Trazabilidad requerimiento → implementación → prueba** → proceso ingenieril.

Al implementar algo no trivial, agregar comentario breve con decisión de diseño. Nutre documentación del TSP.