# CLAUDE.md — Sistema Inteligente de Propuestas de Eventos

Guía de contexto para Claude Code. Lee este archivo antes de tocar cualquier código.

---

## ¿Qué es este proyecto?

Plataforma web para una empresa peruana de organización de eventos (con RUC 20) que automatiza la generación de cotizaciones a partir de imágenes de referencia enviadas por clientes.

**El problema central que resuelve:** el proceso manual toma 2-4 horas por cotización, es subjetivo y no escala. El sistema lo reduce a < 3 minutos con criterio consistente.

**Documento de referencia principal:** `docs/PRD_v2.docx` — contiene requerimientos, casos de uso, modelo de datos y decisiones de arquitectura. Consúltalo antes de implementar cualquier funcionalidad.

---

## Arquitectura general

```
frontend/          → React + TypeScript + Tailwind CSS (SPA)
backend/           → FastAPI (Python)
  ├── api/         → Endpoints REST
  ├── modules/
  │   ├── visual_analysis/   → Integración con LLM multimodal (Claude API)
  │   ├── rules_engine/      → Motor de reglas de negocio por tipo de evento
  │   ├── optimizer/         → Motor de optimización de proveedores � NÚCLEO
  │   ├── proposal_gen/      → Generador de propuestas básica/premium
  │   └── pdf_gen/           → Generador de PDF con WeasyPrint
  ├── models/      → Modelos SQLAlchemy (ORM)
  └── core/        → Config, auth, logging, dependencias compartidas
docs/              → PRD, diagramas, documentación técnica
tests/             → Pruebas unitarias e integración
```

---

## El motor de optimización — el componente más importante

Está en `backend/modules/optimizer/`. Es el núcleo del sistema y lo que diferencia este proyecto de "solo llamar a una API".

**Qué hace:** dado un conjunto de requerimientos de evento y un catálogo de proveedores, selecciona la combinación óptima de proveedores que maximiza un índice de calidad compuesto sin exceder el presupuesto.

**Interfaz pública — respétala siempre:**
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

**Regla crítica:** el optimizer NO debe importar nada de `api/`, `models/` ni `pdf_gen/`. Solo recibe y devuelve sus propios schemas. Esto garantiza que se pueda probar de forma aislada y reemplazar sin tocar el resto del sistema.

**Algoritmos implementados:**
- `IlpOptimizer`: usa PuLP. Garantiza optimalidad. Para catálogos < 500 combinaciones.
- `GreedyOptimizer`: ordena por ratio calidad/costo, selecciona secuencialmente. Rápido, para MVP.
- `OptimizerFactory`: elige cuál usar según tamaño del problema.

---

## Módulo de análisis visual

Está en `backend/modules/visual_analysis/`. Llama a la API de Claude (modelo con visión).

**Prompt del sistema** — está en `visual_analysis/prompts.py`. Nunca hardcodear prompts en los endpoints.

**La salida siempre es un `VisualAnalysisResult`:**
```python
class VisualAnalysisResult(BaseModel):
    event_type: str                    # "boda", "corporativo", "cumpleanos", etc.
    style: str                         # "rustico", "moderno", "elegante", etc.
    inferred_services: list[str]       # servicios visualmente detectados
    visual_elements: list[str]         # elementos decorativos identificados
    confidence: float                  # 0.0 - 1.0
    raw_response: str                  # respuesta original del LLM (para debug/log)
```

**Manejo de errores:** si la imagen no es procesable o la API falla, el módulo lanza `VisualAnalysisError`. El endpoint lo captura y permite al cliente continuar sin análisis visual (flujo alternativo CU-01).

---

## Modelo de datos — entidades clave

Ver PRD sección 9 para detalle completo. Resumen rápido:

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

**Regla de oro del modelo de datos:** `quotations` nunca se eliminan, solo se versionan. Crear una nueva versión al reprocesar (CU-02).

---

## Convenciones de código

### Python (backend)
- **Tipos siempre:** todas las funciones públicas con type hints.
- **Pydantic para schemas:** nunca pasar dicts crudos entre módulos, siempre modelos Pydantic.
- **SQLAlchemy async:** usar `AsyncSession` en todos los repositorios.
- **Repositorio pattern:** la lógica de acceso a BD va en `models/repositories/`, nunca en los endpoints.
- **Excepciones de dominio:** cada módulo define sus propias excepciones en `exceptions.py`.

### TypeScript (frontend)
- **Componentes funcionales** con hooks. Sin componentes de clase.
- **Zod** para validación de formularios.
- **React Query** para estado del servidor (fetching, caching, mutations).
- **Sin `any`:** si aparece un `any` en el código, es un bug.

### General
- **Commits en español** con formato: `feat(optimizer): implementar ILP con PuLP`
- **Un módulo = una responsabilidad.** Si un archivo crece más de 300 líneas, probablemente hace demasiado.
- **No comentar qué hace el código, comentar por qué** tomamos esa decisión no obvia.

---

## Testing — obligatorio para el optimizer

El motor de optimización debe tener cobertura >= 80%. Es el componente más crítico y el que hay que demostrar en el TSP.

```bash
# Correr tests del optimizer
pytest tests/unit/optimizer/ -v --cov=backend/modules/optimizer --cov-report=term-missing

# Tests de integración
pytest tests/integration/ -v
```

**Casos de prueba mínimos obligatorios para el optimizer:**
1. Selección con presupuesto suficiente para todos los servicios.
2. Selección con presupuesto justo (debe elegir los de mejor ratio calidad/costo).
3. Presupuesto insuficiente para cubrir servicios obligatorios → `feasible=False`.
4. Proveedor no disponible en la fecha → no debe ser seleccionado.
5. Proveedor incompatible con tipo de evento → no debe ser seleccionado.
6. Catálogo vacío → manejo de error graceful.

---

## Variables de entorno

Nunca hardcodear credenciales. Usar `.env` local (no commitear) y `config/settings.py` para cargarlas.

```bash
# .env (ejemplo — copiar a .env y completar)
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/eventos_db
ANTHROPIC_API_KEY=sk-ant-...
STORAGE_BUCKET=eventos-referencias
SECRET_KEY=cambiar-en-produccion
```

---

## Flujo de desarrollo recomendado

Cuando recibas una tarea, sigue este orden:

1. **Lee el PRD** — identifica el RF o CU correspondiente.
2. **Empieza por el schema/modelo** — define los tipos Pydantic antes de la lógica.
3. **Implementa la lógica de negocio** — en el módulo correspondiente, sin dependencias de API.
4. **Escribe las pruebas** — especialmente para el optimizer y las reglas de negocio.
5. **Conecta el endpoint** — el endpoint solo orquesta, no tiene lógica de negocio.
6. **Implementa el UI** — consume el endpoint desde React.

---

## Lo que NO hacer

- � No poner lógica de negocio en los endpoints de FastAPI. Los endpoints orquestan, no deciden.
- � No llamar directamente a la API de Anthropic desde un endpoint. Siempre a través de `visual_analysis/client.py`.
- � No modificar `optimizer/engine.py` sin actualizar sus tests.
- � No eliminar registros de `quotations` ni `optimization_logs`. Solo soft delete o versionado.
- � No usar `print()` para debug en producción. Usar el logger configurado en `core/logging.py`.
- � No hacer consultas SQL raw fuera de los repositorios.

---

## Contexto académico

Este proyecto es el Trabajo de Suficiencia Profesional (TSP) para titulación en Ingeniería de Software — UPC. Debe demostrar aplicación de ingeniería de software en la resolución de un problema real.

Los componentes que más peso tienen para el evaluador:
1. **Motor de optimización** → demuestra modelado formal de problemas y algoritmia.
2. **Arquitectura modular y desacoplada** → demuestra diseño de software.
3. **Pruebas unitarias documentadas** → demuestra calidad de software.
4. **Trazabilidad requerimiento → implementación → prueba** → demuestra proceso ingenieril.

Cuando implementes algo no trivial, agrega un comentario breve explicando la decisión de diseño. Eso va a nutrir la documentación del TSP.
