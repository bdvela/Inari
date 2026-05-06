# VISUAL_STATUS.md — Auditoría visual de páginas
Última actualización: 2026-05-06 (post-rediseño) | Sistema de diseño: "Fiesta Seria"

## Estado post-rediseño

| Página | Estado |
|--------|--------|
| NewQuotationPage | ✅ Rediseñada — EventTypeSelect custom, DateInput DD/MM/AAAA, dropzone grid 2×2, 0 inline styles en componentes nuevos |
| QuotationResultPage | ✅ Rediseñada — grid 2 cols, badge Premium inline, panel paquete base, alerta exceeds_max_range, "Proveedor seleccionado" |
| DashboardPage | ✅ Botón Exportar eliminado, calidad con QualityBar semántica |
| AdminProvidersPage | ✅ Select de servicios por nombre, tabla muestra nombre no ID |
| LandingPage | ✅ Demo credentials rediseñada como card de acceso, KeyRound icon |
| LoginPage | ✅ Google eliminado, copy corregido, "¿Olvidaste?" como texto muted |

## Componentes shared nuevos
- `QualityBar.tsx` — barra de calidad con color semántico (ok/accent/amber), reutilizable
- `EventTypeSelect.tsx` — dropdown custom con cierre por click externo, check en opción activa
- `DateInput.tsx` — input DD/MM/AAAA con auto-slashes, devuelve YYYY-MM-DD al form

---


---

## Sistema de diseño de referencia

| Token | Valor |
|-------|-------|
| `primary / accent` | `#E8572A` naranja INARI |
| `background` | `#0A0A0A` negro profundo |
| `surface` | `#141414` |
| `surface-raised` | `#1C1C1C` |
| `border` | `#2A2A2A` |
| `text-primary` | `#F2F0EB` |
| `text-secondary` | `#8A8680` |
| `text-muted` | `#4A4845` |
| **Display** | Syne 700/800 |
| **Body** | Inter 400/500/600 |
| **Mono** | JetBrains Mono 400 |

Clases base: `mesh`, `mesh-dark`, `glass`, `glass-raised`, `glass-dark`, `card`, `card-hover`, `btn-primary`, `btn-secondary`, `badge-accent`, `input-field`, `label`, `section-subtitle`

---

## 1. LandingPage

### Layout actual
Página completa scrollable sobre fondo `mesh` (textura punteada beige `#F2EFE9`). Nav fija superior con logo INARI | GROUP y links de sección. Estructura de secciones:
1. **Hero** — grid 2 columnas: izquierda copy + CTAs, derecha cards flotantes animadas con rotación
2. **Stats bar** — 4 métricas horizontales (500 eventos, 8 años, 43 proveedores, 6 tipos)
3. **Servicios** — grid 3×2 de tarjetas con ícono, nombre y descripción
4. **Por qué nosotros** — 4 ventajas en grid
5. **Proceso** — 3 pasos numerados
6. **Tech callout** — card oscura con terminal de código simulado
7. **Demo credentials** — card con email/password de prueba
8. **Footer** mínimo

### Componentes principales
Cards flotantes en hero con estilo `.glass` (fondo blanco translúcido, sombra suave), nav con `backdrop-filter`, botones inline con `background: #E8572A` hardcoded, stats con `font-family: JetBrains Mono`.

### Colores y tipografía
- Fondo: `#F2EFE9` (beige claro) — contrasta con el resto de la app que es dark
- Texto: `#1D1D1F` dark sobre fondo claro
- Acento: `#E8572A` en CTAs, íconos destacados, dot de estado
- Headlines: Syne 700 con clase `.text-gradient` (degradado naranja)
- Body: Inter, textos secundarios en `#6E6E73`
- Precios/IDs: JetBrains Mono

### ✅ Se ve bien — no tocar
- Cards flotantes del hero con rotaciones y opacidades — el efecto "propuesta en vuelo" es único y reconocible
- Degradado de texto en headline (`.text-gradient`)
- Stats bar con avatares apilados (overlap de 8px, borde `#F2EFE9`)
- Terminal de código en tech callout
- La dualidad beige-claro en landing vs dark en app genera contraste visual intencional entre "propuesta" y "plataforma"

### ❌ Se ve genérico o incompleto
- **Sección "Servicios"**: íconos y texto muy planos, podrían tener imágenes reales de eventos o fondos con foto
- **Demo credentials**: card con fondo blanco básico, parece un bloque de documentación técnica, no una invitación a explorar
- **Nav links**: sin peso visual, se pierden en el header
- **Mobile**: toda la landing usa `style={{}}` inline con grid fijo — no hay breakpoints para móvil
- **Sección "Proceso"**: 3 steps con numeración, sin ilustración ni diferenciación visual fuerte
- **141 instancias de `style={{}}`** inline vs 30 `className` — la página entera está hardcodeada en inline styles, haciéndola difícil de mantener y desconectada del design system

---

## 2. LoginPage

### Layout actual
Split-screen horizontal 50/50 (solo visible en desktop `lg:`):
- **Izquierda**: fondo `mesh-dark` (dark, textura punteada), logo INARI grande en Syne, tagline, 3 micro-stats en tarjetas `.glass-dark` alineadas en fila
- **Derecha**: fondo `mesh` (beige claro), card `.glass-raised` centrada (420px ancho, padding 40px) con formulario de login

### Componentes principales
Card `.glass-raised` con sombra, campos `input-field` con íconos Lucide prefijados, botón primario `background: #E8572A`, divider con texto "O", botón Google con logo inline, links de sign-up y forgot password.

### Colores y tipografía
- Izquierda: dark `#0A0A0A` con orbes de color naranja difuso en fondo
- Derecha: beige claro `#F2EFE9`, card blanca translúcida
- Error: fondo `rgba(255,59,48,0.08)` con borde `rgba(255,59,48,0.18)` — correcto pero personalizado inline
- Formulario: Inter, labels `text-text-secondary`, values en text-primary

### ✅ Se ve bien — no tocar
- Contraste visual fuerte izquierda oscura / derecha clara — establece el tono "Fiesta Seria"
- Micro-stats en izquierda (total eventos, proveedores, NPS) anclan la marca con datos reales
- Animación `.animate-fade-in` en la card del formulario
- Card centrada con `maxWidth: 420px` — proporción correcta para un form de login

### ❌ Se ve genérico o incompleto
- **Botón Google**: sin estilo propio, parece un botón placeholder — Google OAuth no está implementado en backend
- **"¿Olvidaste tu contraseña?"**: link sin destino funcional
- **"Regístrate como parte del equipo"**: copy confuso — implica que es un sistema interno, pero hay registro público también
- **Mobile**: izquierda oculta con `hidden lg:flex` — en móvil solo aparece el form sin branding
- **44 `style={{}}`** inline — mezclado con className, inconsistente

---

## 3. DashboardPage

### Layout actual
Dentro del Layout (sidebar izquierdo fijo 240px + content area `#F2EFE9` beige):
- **Header de página**: saludo personalizado con nombre, fecha, botones "Exportar" y "Nueva cotización"
- **4 stat cards**: grid 4 columnas, cada una con ícono Lucide, label uppercase pequeño, valor grande Syne, suffix secundario. Tienen estado skeleton mientras cargan
- **Barra de búsqueda y filtros**: input de búsqueda + 7 botones de tipo de evento + dropdown de estado
- **Tabla de cotizaciones**: columnas Evento | Cliente (solo staff) | Tipo | Nivel | Estado | Costo | Calidad | Fecha — fila clickeable con flecha derecha en hover

### Componentes principales
`StatCard` con `.glass` y posición relativa para ícono decorativo, badges de estado (`badge-success`, `badge-warning`, `badge-error`) y nivel (`badge-accent` premium, `badge-neutral` básica), tabla con `card p-0 overflow-hidden`, skeletons manuales con div rectangulares grisáceos.

### Colores y tipografía
- Stat cards: fondo `.glass` (blanco translúcido), valor en Syne 700 grande
- Stat "calidad": tiene prop `accent` → valor en `text-accent` naranja
- Badges estado: verde/amarillo/rojo sobre fondo claro con ícono pequeño
- Calidad en tabla: texto `%` con color naranja si acento activo
- `#F2EFE9` beige como fondo general — coherente con landing y login-right

### ✅ Se ve bien — no tocar
- Los 4 stat cards con skeleton loading son limpios y proporcionales
- Badges de estado con ícono + texto — legibles y con semántica visual clara
- Tabla con hover + flecha derecha — patrón de navegación intuitivo
- Filtros de tipo de evento como botones pill — rápido de usar
- Empty state coherente con el resto de la app

### ❌ Se ve genérico o incompleto
- **Botón "Exportar"**: visible pero sin funcionalidad (UI only) — confunde al usuario que lo intente usar
- **Calidad en tabla**: muestra `%` texto plano, sin barra visual ni color semántico según rango — difícil leer de un vistazo
- **Columna "Cliente"**: solo aparece para staff — el salto de columnas puede desorientar si la tabla cambia de ancho
- **Paginación**: solo texto informativo `"Mostrando X de Y"`, sin controles de página si hay muchas cotizaciones
- **Grid 4 columnas de stats**: en pantallas medianas (1200px) puede verse apretado
- **59 `style={{}}`** inline para spacing/layout menor

---

## 4. NewQuotationPage

### Layout actual
Wizard de 3 pasos con indicador de progreso superior (pills numeradas 1-2-3):

**Paso 1 — Descripción libre**
- Textarea grande (mínimo 160px) con placeholder guía, contador de caracteres `x/1200`, botones de sugerencia rápida para tipos de evento
- Botón "Analizar mi evento" primario + link "completar formulario directamente"

**Paso 2 — Confirmar datos**
- Badges de confianza AI (tipo evento, invitados, presupuesto, style hints) en fila cuando hay datos extraídos
- Formulario: select tipo evento, date input, number invitados, number presupuesto, text estilo
- Campos con borde/fondo naranja tenue cuando fueron auto-completados por Gemini (highlight visual)
- Dropzone para imágenes de estilo (1-3 fotos, drag & drop)

**Paso 3 — Generando**
- Card centrada con spinner Loader2, 3 barras de progreso animadas por fase, mensajes dinámicos

### Componentes principales
Stepper con pills, textarea con `input-field`, `badge-accent` para highlights AI, `btn-primary` / `btn-secondary`, `input-field` con border inline naranja para campos pre-llenados, dropzone con `border-dashed`.

### Colores y tipografía
- Campos auto-completados: `background: rgba(232,87,42,0.04)`, `borderColor: rgba(232,87,42,0.20)`, `color: #C94A1F`
- Badges de confianza AI: `.badge-accent` naranja
- Stepper activo: círculo sólido naranja, completado: check verde, pendiente: gris
- Progreso loading: barras naranjas sobre fondo beige

### ✅ Se ve bien — no tocar
- Highlight naranja tenue en campos pre-llenados por Gemini — comunica claramente qué datos son IA vs manuales
- Badges de confianza antes del formulario — resume lo detectado en un vistazo
- Paso 3 con fases animadas — hace la espera tolerable y transmite que el sistema trabaja
- Botones de sugerencia rápida en paso 1 para acelerar la descripción
- Flujo escape "completar directamente" — buena alternativa para usuarios que no quieren usar IA

### ❌ Se ve genérico o incompleto
- **Dropzone de imágenes**: estilo muy básico (solo borde dashed gris), sin preview visual de las imágenes subidas
- **Stepper**: pills numéricas simples, sin línea conectora entre pasos — looks desconectados
- **Selector de tipo de evento (paso 2)**: `<select>` HTML nativo — rompe estilo visual del resto del form
- **Fecha**: `<input type="date">` nativo del browser — apariencia varía por OS/browser
- **Error de validación**: alerts de error solo en rojo genérico, sin indicador por campo
- **78 `style={{}}`** inline, especialmente para el resaltado de campos — dificulta reutilización

---

## 5. QuotationResultPage

### Layout actual
Página dentro del Layout, ancho máx `1100px`:
- **Top bar**: botón volver, ID cotización (#INR-XXXX), versión, badge de estado — todo en una fila
- **Panel reprocessar** (colapsable): inputs budget + fecha + submit — oculto por defecto, toggle visible
- **Evento header**: nombre tipo evento + fecha + invitados + estilo + badge nivel
- **3 stat pills**: número de proveedores, calidad promedio, nivel
- **Quality ring card**: SVG circular `140×140px` con arco progreso naranja, score central grande en Syne, label debajo
- **Comparativa básica/premium**: 2 cards lado a lado — básica borde normal, premium borde naranja + badge flotante "Premium"
  - Cada card: total cost grande, lista de servicios con puntos, badge de ahorro/diferencia
- **Grid de proveedores** 3 columnas: cada celda con nombre servicio, barra de calidad, costo, nombre proveedor (oculto para clientes), botón "Alternativas" (staff)
- **Panel alternativas** (expandible): tabla de opciones con delta cost y delta quality
- **Historial de versiones** (expandible): lista cronológica de versiones anteriores
- **Botón PDF** fijo abajo derecha (flotante)

### Componentes principales
`QualityRing` SVG custom, `DeltaBadge` de costo/calidad con colores semánticos (rojo +, verde -), cards con `.card` y `.card-hover`, barra calidad con color semántico (emerald ≥80%, accent ≥50%, orange <50%), `AlternativeRow` expandible.

### Colores y tipografía
- Ring SVG: arco naranja `#E8572A` sobre gris `#E5E7EB`, score en Syne 700 grande
- Premium card: borde `#E8572A` con `boxShadow: 0 0 0 1px rgba(232,87,42,0.2)`, badge flotante position absolute
- Delta badges: rojo `#FF3B30` para mayor costo, verde `#34C759` para menor
- Calidad barras: emerald / naranja / orange según rango — semántica clara
- JetBrains Mono en costos y IDs

### ✅ Se ve bien — no tocar
- Quality ring SVG — visualmente única, transmite score de un vistazo
- Comparativa básica/premium lado a lado — permite decidir rápido
- Delta badges con semántica color rojo/verde — comunica impacto sin texto
- Barras de calidad con color semántico por rango
- PDF button flotante — siempre accesible sin scroll
- Panel alternativas expandible — no satura la vista inicial

### ❌ Se ve genérico o incompleto
- **Grid de proveedores**: 3 columnas muy densas, cada celda tiene mucha info comprimida — difícil escanear
- **Nombre proveedor oculto para clientes**: celda queda con espacio vacío visible — se nota que algo falta
- **Panel reprocessar**: oculto por defecto pero su toggle es un link texto pequeño — poco descubrible
- **Historial de versiones**: solo lista plana de fechas/costos sin diferencia visual entre versiones
- **Mobile**: `115 style={{}}` inline + grid fijo de 3 columnas — se rompe en pantallas pequeñas
- **Badge "Premium" flotante**: `position: absolute` hardcoded — puede solaparse con contenido en algunos tamaños

---

## 6. AdminProvidersPage

### Layout actual
Página administración dentro del Layout:
- **Header**: label "Administración" + título "Proveedores" en Syne 3xl + subtítulo con conteo activos + botón "Nuevo proveedor"
- **Form inline** (cuando activo, arriba de la tabla): grid 2 columnas — nombre, ID servicio, costo base, calidad (0-1), botones de tipo evento como pills toggle
- **Tabla** con `.card p-0 overflow-hidden`: columnas Proveedor | Servicio | Costo base | Calidad (barra) | Eventos (pills) | Estado | Acciones
- Acciones Editar/Eliminar aparecen en hover con `opacity-0 group-hover:opacity-100`
- Empty state: icono Package + texto
- Loading: spinner centered

### Componentes principales
`QualityBar` con colores semánticos emerald/accent/orange, form con `input-field`, pills de tipo evento con toggle visual (naranja si activo, gris si no), tabla `className` based (sin inline styles — consistente), `card` con `p-0` para tabla borderless.

### Colores y tipografía
- Table headers: `text-[10px] uppercase tracking-widest text-text-secondary` — patrón correcto
- Pills de evento: active `bg-accent text-white`, inactive `bg-surface-raised text-text-secondary border border-border`
- Calidad bar: emerald ≥80%, accent 50-79%, orange <50%
- Solo **1 `style={{}}`** inline (el width dinámico de la barra) — la página más limpia del codebase

### ✅ Se ve bien — no tocar
- AdminProvidersPage es la página más consistente con el design system: casi 0 inline styles
- Pills de tipo evento como multi-select — UX claro y visualmente limpio
- QualityBar con color semántico — reutilizable y coherente con QuotationResultPage
- Hover actions con opacity transition — no satura la tabla
- Table header style `text-[10px] uppercase` — patrón correcto para admin tables

### ❌ Se ve genérico o incompleto
- **Campo "ID Servicio"**: input numérico raw — el usuario tiene que saber el ID de memoria; debería ser un select con nombres de servicios
- **Columna "Servicio" en tabla**: muestra `#4` (solo el ID) — no el nombre del servicio
- **"Historial de precios"**: no existe — sin trazabilidad de cambios de costo
- **Paginación**: ausente — si hay muchos proveedores la tabla crece sin límite
- **Columna "Estado"**: solo activo/inactivo, sin forma de desactivar desde la tabla (solo delete)

---

## Resumen por página

| Página | Inline styles | Estado general | Prioridad fix |
|--------|--------------|----------------|---------------|
| LandingPage | 141 | Rico visualmente, difícil de mantener | Media — no bloquea |
| LoginPage | 44 | Sólido, split-screen efectivo | Baja |
| DashboardPage | 59 | Funcional, tabla clara | Media — exportar/paginación |
| NewQuotationPage | 78 | Mejor flujo de la app, select nativos rompen estilo | Alta — select/date custom |
| QuotationResultPage | 115 | Más compleja y más densa, ring SVG destacado | Alta — grid proveedores |
| AdminProvidersPage | 1 | La más limpia, campo ID servicio es el mayor issue | Alta — ID→nombre servicio |

### Deuda técnica transversal
- **LandingPage** tiene 141 inline styles — si el design token de acento cambia, hay que actualizar manualmente
- **NewQuotationPage** y **QuotationResultPage** usan `<select>` y `<input type="date">` nativos que rompen la estética en Windows/Linux
- **AdminProvidersPage** muestra ID numérico de servicio en lugar del nombre — el admin no puede operar sin conocer los IDs de memoria
