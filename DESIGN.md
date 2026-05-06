---
version: "1.0"
name: Inari Group
description: >
  Sistema de cotización de eventos premium — Lima, Perú.
  Identidad visual: "Fiesta Seria". Contraste radical, energía de evento real,
  sin clichés de lujo genérico (no dorado, no azul navy, no serif editorial).

colors:
  primary:        "#E8572A"
  background:     "#0A0A0A"
  surface:        "#141414"
  surface-raised: "#1C1C1C"
  border:         "#2A2A2A"
  text-primary:   "#F2F0EB"
  text-secondary: "#8A8680"
  text-muted:     "#4A4845"
  accent:         "#E8572A"
  accent-hover:   "#D44B20"
  accent-light:   "#2A1510"
  success:        "#2ECC71"
  error:          "#E74C3C"
  warning:        "#F39C12"

typography:
  display:
    fontFamily: "Syne"
    weights: [700, 800]
    usage: "Headings principales, números grandes, CTAs"
  body:
    fontFamily: "Inter"
    weights: [400, 500, 600]
    usage: "Todo el texto de interfaz, labels, párrafos"
  mono:
    fontFamily: "JetBrains Mono"
    weights: [400]
    usage: "IDs, códigos, precios en tablas"
  scale:
    xs:   "0.75rem"
    sm:   "0.875rem"
    base: "1rem"
    lg:   "1.125rem"
    xl:   "1.25rem"
    2xl:  "1.5rem"
    3xl:  "1.875rem"
    4xl:  "2.25rem"
    5xl:  "3rem"
    6xl:  "3.75rem"

rounded:
  none: "0px"
  sm:   "4px"
  md:   "8px"
  lg:   "12px"
  xl:   "16px"
  full: "9999px"

spacing:
  1:  "4px"
  2:  "8px"
  3:  "12px"
  4:  "16px"
  5:  "20px"
  6:  "24px"
  8:  "32px"
  10: "40px"
  12: "48px"
  16: "64px"
  20: "80px"

shadows:
  sm:   "0 1px 3px rgba(0,0,0,0.4)"
  md:   "0 4px 12px rgba(0,0,0,0.5)"
  lg:   "0 8px 32px rgba(0,0,0,0.6)"
  glow: "0 0 24px rgba(232,87,42,0.35)"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor:       "{colors.text-primary}"
    rounded:         "{rounded.md}"
    padding:         "10px 20px"
    typography:      "Inter 600 14px"
  button-secondary:
    backgroundColor: "transparent"
    textColor:       "{colors.text-primary}"
    rounded:         "{rounded.md}"
    padding:         "10px 20px"
  card:
    backgroundColor: "{colors.surface}"
    rounded:         "{rounded.lg}"
    padding:         "{spacing.6}"
  input:
    backgroundColor: "{colors.surface-raised}"
    textColor:       "{colors.text-primary}"
    rounded:         "{rounded.md}"
    padding:         "10px 14px"
  badge:
    rounded:    "{rounded.sm}"
    typography: "Inter 600 11px"
    padding:    "2px 8px"
  sidebar:
    backgroundColor: "{colors.background}"
    width:           "240px"
---

## Filosofía de diseño

**"Fiesta Seria"** — El nombre lo dice todo. INARI GROUP organiza bodas,
corporativos y quinceañeras de alto nivel. La interfaz debe sentirse como
entrar a un venue premium la noche del evento: oscuro, enfocado, con energía.

No es un banco. No es una app de finanzas. Es una empresa que hace que
los momentos importantes de la vida de las personas sean memorables.

## Colores

El fondo negro casi puro (#0A0A0A) crea profundidad sin ser agresivo.
Las superficies escalonadas (#141414, #1C1C1C) dan jerarquía sin luz.

El naranja quemado (#E8572A) es el único color de acento. Referencias:
cerámicas limeñas, pisco, atardeceres de la costa. Cálido, peruano,
memorable. Contrasta fuertemente sobre negro (ratio 5.8:1).

**Nunca usar dorado ni azul navy** — son los clichés del "lujo genérico".

## Tipografía

**Syne** para headings: geométrica, bold, moderna. Sin serifs.
Personalidad propia — no se confunde con ningún competidor.

**Inter** para body: el estándar de legibilidad en interfaces.
No hay necesidad de experimentar en texto funcional.

La jerarquía tipográfica es agresiva: los números grandes (precios,
stats) van en Syne 5xl-6xl. Los labels son Inter 11px uppercase.

## Layout y espaciado

Espaciado generoso — no amontonar. Márgenes amplios comunican confianza.
Los elementos de alta densidad (tablas, listas) tienen más padding que lo
estándar para evitar sensación de urgencia o caos.

Grids: sidebar fijo 240px + contenido fluido. En mobile: sidebar colapsa
a drawer, contenido full-width.

## Elevación y profundidad

Sin sombras decorativas — el contraste de color plano hace el trabajo.
La jerarquía se logra con capas de color: `background` → `surface` → `surface-raised`.

Sombras reservadas para modales y tooltips flotantes. Nunca en cards estáticos.
El glow naranja (`0 0 24px rgba(232,87,42,0.35)`) solo en estados activos/hover de CTAs primarios.

## Formas

Sin rounded-full en elementos rectangulares de UI. Bordes cuadrados (rounded-sm, rounded-md)
comunican seriedad editorial frente a lo "playful" de los pill shapes.

Excepción: avatares y chips de estado pueden usar rounded-full. Botones: rounded-md (8px).
Cards: rounded-lg (12px). Inputs: rounded-md (8px). Badges: rounded-sm (4px).

## Componentes

**Cards**: fondo #141414 con borde sutil #2A2A2A. Sin sombras decorativas —
el contraste de color hace el trabajo. Hover: border se aclara a #3A3835.

**Botones primarios**: naranja quemado. Texto en #F2F0EB (no blanco puro —
blanco puro sobre naranja se siente eléctrico, no premium).

**Inputs**: fondo levemente más claro que el surface (#1C1C1C), borde sutil.
Al focus: borde naranja quemado con glow sutil.

**Badges**: sin rounded-full. Bordes cuadrados (border-radius 4px) con
texto uppercase tracking-wider. Más editorial que playful.

## Reglas de aplicación

### Hacer

1. Usar los tokens definidos aquí. Nunca hex arbitrarios fuera del sistema.
2. El acento naranja va SOLO en CTAs, elementos activos, indicadores de éxito.
3. Números de precio: siempre font-mono, tamaño grande, color text-primary.
4. Espaciado mínimo entre elementos de lista: spacing-3 (12px).
5. Animaciones: máximo 200ms ease-out.

### No hacer

1. No usar gradientes — contraste de planos planos es suficiente.
2. No usar dorado (#F5C842 o similares) — cliché de lujo genérico.
3. No usar azul navy — asociación bancaria, no de eventos.
4. No usar rounded-full en botones ni cards.
5. No usar bounce ni spring animations.
6. No poner texto claro sobre surface sin verificar contraste mínimo WCAG AA.
