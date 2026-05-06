# Handoff — Inari Group UI System

## Overview

Este paquete contiene el sistema de UI completo para **Inari Group**, una empresa peruana premium de eventos (bodas, corporativos, quinceañeras) basada en Lima. Tagline: _"Eventos que trascienden"_.

La dirección de diseño es **"Liquid Glass, Lima Edition"** — estética Apple Liquid Glass (iOS 26 / macOS 26) pero cálida, con paleta peruana (cream parchment + naranja quemado), no fría tipo Silicon Valley.

El sistema cubre **5 pantallas**:
1. Landing pública (marketing)
2. Login interno
3. Dashboard de cotizaciones
4. Wizard de nueva cotización (3 pasos)
5. Resultado de cotización (Básica vs Premium)

## About the Design Files

Los archivos en este bundle son **referencias de diseño creadas en HTML** — prototipos que muestran la apariencia y comportamiento deseado, **no código de producción para copiar directamente**.

La tarea es **recrear estos diseños HTML en el entorno del codebase destino** (en este caso: **React + TypeScript + Tailwind CSS**, según se especificó), usando los patrones, librerías y tokens ya establecidos en el proyecto. Los HTML usan estilos inline y CSS custom porque la API de `backdrop-filter` es complicada con `@apply`; el dev debe traducir a Tailwind config + clases utility donde sea idiomático.

## Fidelity

**Alta fidelidad (hifi)** — Mockups pixel-perfect con colores finales, tipografía, espaciado, sombras, animaciones y micro-interacciones. El dev debe recrearlo lo más cercano posible usando el design system de Tailwind del proyecto.

## Tech Stack Target

- **React 18+ con TypeScript**
- **Tailwind CSS** (con tokens custom — ver sección _Design Tokens_)
- **lucide-react** para iconos (los HTML usan SVGs hechos a mano que imitan el set de Lucide; usar Lucide directamente)
- **Sin librerías UI externas** (no shadcn, no MUI, no Chakra)
- Animaciones con CSS / Tailwind transitions; max 200ms ease-out para interacciones, 8–12s ease-in-out para los blobs del mesh background.

---

## Design Tokens

### Colores

```js
// tailwind.config.js — extender theme.colors
{
  bg:          '#F2EFE9',           // warm parchment — fondo base
  'bg-deep':   '#1A1714',           // charcoal cálido — fondo inverso (login left)
  surface:     'rgba(255,255,255,0.65)',     // glass card normal
  'surface-raised': 'rgba(255,255,255,0.85)',// glass card más opaco (forms, modales)
  'surface-frost':  'rgba(242,239,233,0.80)',// navbar / sidebar frosted

  border:        'rgba(26,23,20,0.08)',
  'border-hover':'rgba(26,23,20,0.14)',

  'text-primary':   '#1D1D1F',
  'text-secondary': '#6E6E73',
  'text-muted':     '#AEAEB2',
  'text-cream':     '#F2EFE9',

  accent:         '#E8572A',  // burnt orange — Peruvian, NOT tech-startup orange
  'accent-hover': '#C94A1F',
  'accent-light': '#FEF0EB',
  amber:          '#FF9500',
  ok:             '#34C759',
  danger:         '#FF3B30',
  warn:           '#FF9500',
}
```

### Tipografía

```js
fontFamily: {
  display: ['Syne', 'sans-serif'],          // headings, números grandes — 700/800
  body:    ['Inter', 'sans-serif'],         // texto de UI — 400/500/600/700
  mono:    ['JetBrains Mono', 'monospace'], // IDs, precios, montos — 400/500/600
}
```

**Escala agresiva** (no tímida):
- Hero h1: **80px** (font-display 800, line-height 0.98, letter-spacing -0.035em)
- Section h2: **52–60px** (font-display 800)
- Card h3: **22–28px** (font-display 700)
- Stats grandes: **44–48px** (font-display 800)
- Body: 14–18px (Inter 400/500)
- Labels uppercase: 11–12px, letter-spacing 0.04–0.14em

### Border radii

```js
borderRadius: {
  card:  '16px',
  btn:   '12px',
  input: '10px',
  badge: '6px',
}
```

### Shadows

```css
--shadow-glass:       0 8px 32px rgba(26,23,20,0.06), 0 2px 8px rgba(26,23,20,0.04);
--shadow-glass-hover: 0 16px 48px rgba(26,23,20,0.10), 0 4px 12px rgba(26,23,20,0.06);
--shadow-accent:      0 8px 24px rgba(232,87,42,0.28), 0 2px 6px rgba(232,87,42,0.18);
--inner-spec:         inset 0 0 0 0.5px rgba(255,255,255,0.85);  /* specular highlight */
```

### Espaciado

Generoso. Cards padding 24–40px. Section padding 80–120px vertical, 48–64px horizontal. White space es premium — no empacar.

---

## Glass primitives — el sistema central

Todas las superficies elevadas usan una de estas tres clases. El dev debe crear componentes `<GlassCard variant="default|raised|frost">` o utility classes en Tailwind plugin (porque `backdrop-filter` no entra en `@apply` cómodo).

### `.glass` (cards normales)
```css
background: rgba(255,255,255,0.65);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(26,23,20,0.08);
box-shadow: inset 0 0 0 0.5px rgba(255,255,255,0.85),
            0 8px 32px rgba(26,23,20,0.06),
            0 2px 8px rgba(26,23,20,0.04);
border-radius: 16px;
```

### `.glass-raised` (forms, modales, propuestas premium)
Igual que `.glass` pero `background: rgba(255,255,255,0.85)` y `blur(24px)`. Más opaco, más "presencia".

### `.glass-frost` (navbar, sidebar)
```css
background: rgba(242,239,233,0.80);  /* tinted con parchment, no blanco */
backdrop-filter: blur(24px) saturate(180%);
border: 1px solid rgba(26,23,20,0.08);
```

### Hover state (`.card-hover`)
```css
transition: transform 200ms ease-out, box-shadow 200ms, border-color 200ms;
&:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glass-hover);  /* sombra más profunda */
  border-color: rgba(26,23,20,0.14);
}
```

---

## Background mesh — atmósfera del sistema

El fondo NO es liso. Cada pantalla con clase `.mesh` tiene 3 blobs gradient radiales que driftean lentamente. Esto hace que las cards glass "recojan" el color del fondo y se sientan vivas.

### Mesh claro (todas las pantallas excepto login left)

```css
.mesh { position: relative; isolation: isolate; background: #F2EFE9; overflow: hidden; }

.mesh::before {  /* blob 1 — burnt orange, top-left */
  content: ''; position: absolute;
  width: 720px; height: 720px; top: -180px; left: -120px;
  background: radial-gradient(circle, rgba(232,87,42,0.10), rgba(232,87,42,0) 70%);
  filter: blur(80px);
  animation: drift1 14s ease-in-out infinite;
}
.mesh::after {  /* blob 2 — amber, bottom-right */
  content: ''; position: absolute;
  width: 640px; height: 640px; bottom: -160px; right: -120px;
  background: radial-gradient(circle, rgba(255,149,0,0.07), rgba(255,149,0,0) 70%);
  filter: blur(80px);
  animation: drift2 16s ease-in-out infinite;
}
.mesh > .mesh-blob {  /* blob 3 — center, sutil */
  position: absolute; width: 540px; height: 540px;
  top: 38%; left: 48%;
  background: radial-gradient(circle, rgba(232,87,42,0.06), rgba(232,87,42,0) 70%);
  filter: blur(80px);
  animation: drift3 18s ease-in-out infinite;
}

@keyframes drift1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(80px,60px) scale(1.08); } }
@keyframes drift2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-60px,-40px) scale(1.05); } }
@keyframes drift3 { 0%,100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-44%,-58%) scale(1.10); } }
```

### Mesh oscuro (panel izquierdo del login)

Igual estructura pero `background: #1A1714` y blobs con opacity más alta (0.32 burnt orange, 0.18 amber) para que se vean sobre el dark.

---

## Componentes

### Button

```tsx
// btn-primary
className="bg-gradient-to-br from-[#E8572A] to-[#C94A1F] text-white font-semibold
           rounded-[12px] px-5 py-3 text-sm
           shadow-[0_8px_24px_rgba(232,87,42,0.28),_inset_0_1px_0_rgba(255,255,255,0.25)]
           hover:-translate-y-px transition-transform"
```

Sizes: `btn-sm` (px-3.5 py-2 text-xs), default (px-5 py-3 text-sm), `btn-lg` (px-7 py-4 text-base).

Variantes:
- `btn-secondary` — `bg-surface-raised border border-border` con backdrop-blur
- `btn-ghost` — transparent, hover `bg-black/5`

### Input

```tsx
className="w-full px-3.5 py-3 rounded-[10px] border border-border
           bg-white/70 text-sm
           focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10
           outline-none transition-all"
```

Label asociado:
```tsx
<label className="block text-xs font-medium text-text-secondary
                  uppercase tracking-[0.04em] mb-2">
```

### Badge

Default `.badge`:
```tsx
className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md
           text-[11px] font-semibold uppercase tracking-[0.04em]
           bg-black/5 text-text-secondary border border-border"
```

Variantes:
- `badge-accent` — bg `#FEF0EB`, text `#C94A1F`, border `rgba(232,87,42,0.18)`
- `badge-success` — bg `rgba(52,199,89,0.10)`, text `#1f7a3a`
- `badge-warning` — bg `rgba(255,149,0,0.10)`, text `#a85d00`
- `badge-error` — bg `rgba(255,59,48,0.10)`, text `#b3271e`

### Logomark

Cuadrado naranja con "I" + lockup vertical "INARI / GROUP":

```tsx
<div className="flex items-center gap-3">
  <span className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#E8572A] to-[#C94A1F]
                   text-white font-display font-extrabold text-lg
                   flex items-center justify-center
                   shadow-[0_4px_12px_rgba(232,87,42,0.32),_inset_0_1px_0_rgba(255,255,255,0.3)]">
    I
  </span>
  <span className="font-display font-extrabold text-[13px] tracking-[0.18em] leading-tight">
    INARI<br/>
    <span className="text-text-secondary font-semibold">GROUP</span>
  </span>
</div>
```

### Gradient text (para palabra acento)

```tsx
<span className="bg-gradient-to-r from-[#E8572A] via-[#FF9500] to-[#E8572A]
                 bg-clip-text text-transparent">inolvidables</span>
```

Usado en: hero headline ("inolvidables"), final CTA ("una frase"), why-us ("no"), login headline ("trascienden").

---

## Pantallas

Las descripciones detalladas de cada pantalla están en los archivos HTML referenciados. Resumen ejecutivo:

### 1. Landing (`screens/landing.jsx`)
**Layout vertical**, 1280px de ancho de diseño.
- **Navbar** (sticky top 16px, glass-frost, 18px radius) — logo / 4 links centrados / `Ingresar` ghost + `Cotizar` primary
- **Hero** (grid 1.15fr / 1fr): h1 80px con "inolvidables" en gradient, subtext, 2 CTAs, +500 eventos social proof. **Lado derecho**: card glass principal rotada 2.5° mostrando una cotización en proceso (con barras de progreso por proveedor) + 2 cards satélite rotadas en ángulos contrarios.
- **Stats bar** — 1 glass card con 4 columnas (números 48px Syne)
- **Services grid** (3 columnas) — 6 cards con icon-circle naranja, título Syne 24px, descripción, link "Ver detalles →" naranja
- **Why us** (sticky-left + 2x2 grid offset) — cards alternas tienen `translateY(32px)` para ritmo asimétrico. Numerales `01–04` en orange 16% opacity
- **Process** — 3 cards horizontales con números gigantes (140px, opacidad 8%) en esquina superior derecha
- **Tech callout** — wide card con `border-left: 3px var(--accent)`, lado izquierdo copy + checks, lado derecho un panel "terminal" mono mostrando NL parsing
- **Final CTA** — h2 88px centrado, "una frase" en gradient
- **Footer** — glass-frost strip horizontal

### 2. Login (`screens/login.jsx`)
**Split 55% / 45%, viewport completo.**
- **Izquierda (mesh-dark)**: logo top, headline 78px "Eventos que trascienden" en cream con "trascienden" en gradient orange, 3 micro-stats glass-on-dark al fondo
- **Derecha (mesh claro, centrado)**: glass-raised card 420px con email + password (con icons inline), checkbox "Recordarme", primary button full-width, divider "O", botón Google secondary, link "Crear cuenta"

### 3. Dashboard (`screens/dashboard.jsx`)
**Sidebar fijo 240px + main flex.**
- **Sidebar (glass-frost, 100vh sticky)**: logo top, nav items con icon+label. Item activo: `border-left: 2px accent`, `bg-accent/8`, icono naranja, badge contador "3" en accent. Bottom: user card con avatar charcoal gradient
- **Main**: header "Hola, Valeria." (Syne 44px) + 2 botones top-right, 4 stat cards (cada una con icon top-right en círculo tinted, número 44px Syne), filter bar glass (search input con icon, pills de categoría, botón "Filtros"), tabla glass con 8 columnas, filas alternas, hover muestra arrow naranja deslizando, paginación

### 4. Wizard (`screens/wizard.jsx`)
**Centered, max-width 760px, header slim arriba.**
- **Step indicator**: 3 círculos numerados conectados por línea. Activo en gradient + shadow accent. Completado en accent sólido con check.
- **Step 1 — Describe**: textarea grande (180px alto), 4 chips de sugerencias debajo, contador caracteres bottom-right
- **Step 2 — Confirma**: grid 2 cols con 6 inputs. Campos extraídos por IA: bg `rgba(232,87,42,0.04)`, border accent 20%, texto en `accent-hover`. Tags "Solicitudes especiales" como badges accent
- **Step 3 — Generando**: círculo Zap de 88px con aura pulsante, h2 "Diseñando tu cotización…", lista de 5 fases con progress bars (algunas 100% con check verde, otras animando)

### 5. Resultado (`screens/result.jsx`)
**Layout vertical, 1280px.**
- **Top bar**: botón Volver + ID mono + badge success + acciones (Compartir, Editar, Descargar PDF)
- **Header row** (grid 1.4fr/1fr): card grande con título "Sofía & Mateo" (Syne 44px) y 4 stats. Card lateral con **quality ring SVG** (140px, gradient orange→amber, score 9.2 al centro) + 3 mini-bars de subscores
- **Two proposals** (grid 1fr/1fr): Básica (glass normal) vs Premium. **Premium**: border `rgba(232,87,42,0.30)` 1px, shadow con tinte naranja, **badge "PREMIUM" con corona** flotante en `top: -12px left: 24px`, fondo `rgba(255,255,255,0.78)`. Precio Syne 52px con "S/" mono pequeño antes
- **Provider list** (grid 3 cols): cards con categoría uppercase, score con icono star naranja, descripción, subtotal mono. Header indica "Identidad protegida" con badge lock
- **CTA final**: botón "Descargar propuesta en PDF" centrado, btn-lg padding extra

---

## Interactions & Animations

| Evento | Duración | Easing | Propiedades |
|---|---|---|---|
| Card hover | 200ms | ease-out | translateY(-2px), shadow, border-color |
| Button hover | 180ms | ease-out | translateY(-1px), shadow |
| Input focus | 180ms | default | border-color, bg, box-shadow ring |
| Mesh blobs drift | 14–18s | ease-in-out infinite | translate + scale |
| Wizard step transition | 220ms | default | bg, color del step indicator |
| Table row hover | 180ms | default | bg, arrow opacity + translateX |
| Progress bars (wizard step 3) | 600ms | ease-out | width |
| Zap icon pulse aura | 1.6s | ease-in-out infinite | scale + opacity |

**Regla**: max 200ms para interacciones de UI. Solo el mesh y la pulse animation son largas.

---

## State Management

### Wizard (`screens/wizard.jsx`)
- `step: 1 | 2 | 3` — paso actual
- `step1.description: string` — textarea libre
- `step2.fields: { type, guests, date, venue, budget, style, specialRequests[] }` — datos parseados editables
- `step3.phases[]` — 5 fases con `{ label, pct: 0–100 }`, animadas en orden

Al pasar de Step 1 → Step 2: trigger LLM call que parsea description y popula fields. En Step 3: progress simulado (en producción, polling al backend).

### Dashboard
- `filter: 'todas' | 'boda' | 'corporativo' | …`
- `search: string`
- `quotations: Quotation[]` — fetched
- Pagination state

### Login
- `email`, `password`
- Submit handler → auth API → redirect a dashboard

### Result
- `quotationId` (de la URL)
- `quotation: Quotation` con providers, basic/premium pricing, quality scores
- `selectedTier: 'basica' | 'premium' | null`

---

## Reglas no-negociables

- ❌ No dark mode — solo warm light glass
- ❌ No genérico SaaS — no purple/blue, no gradientes everywhere
- ❌ No emoji a menos que sea parte del contenido del cliente
- ❌ Naranja accent **nunca** como background grande, solo en CTAs primarios, bordes, badges, hover states
- ✅ Spanish: copy en español Lima/Perú (S/ para soles, "cotización", "aforo", etc.)
- ✅ White space generoso
- ✅ Iconos: lucide-react exclusivamente
- ✅ Numerales y precios siempre en JetBrains Mono
- ✅ Headlines siempre Syne con letter-spacing negativo agresivo

---

## Files in this bundle

- `Inari Group UI.html` — entry point que monta las 5 pantallas en un design canvas pannable
- `styles.css` — tokens, glass primitives, mesh background, button/input/badge classes
- `icons.jsx` — set de 30+ iconos SVG estilo Lucide (en producción, usar `lucide-react` directamente)
- `screens/landing.jsx`
- `screens/login.jsx`
- `screens/dashboard.jsx`
- `screens/wizard.jsx`
- `screens/result.jsx`

Para abrir: `open "Inari Group UI.html"` en un navegador. El canvas permite zoom/pan; cada artboard se puede expandir a fullscreen con el botón hover en la esquina superior derecha del label.

## Assets

No hay imágenes reales — el diseño usa **placeholders con stripes diagonales** (clase `.img-ph` en `styles.css`) cuando se necesita mostrar dónde irían fotografías. En producción, el equipo Inari debe proveer:
- Fotografía editorial de eventos pasados (para hero secundario y galería en landing)
- Avatares reales del equipo (actualmente iniciales sobre charcoal)
- Logos de proveedores (cuando se levanten del modo "identidad protegida")

Las fuentes se cargan desde Google Fonts (Syne, Inter, JetBrains Mono).
