# Especificación: Extracción automática de datos de evento para cotización

## Historia de usuario
Como cliente de INARI GROUP, quiero describir mi evento en lenguaje
natural para que el sistema extraiga automáticamente los datos
necesarios y pre-llene el formulario de cotización, sin tener que
completar campos técnicos que no entiendo.

## Descripción
El cliente accede al flujo de cotización y, antes de ver el
formulario, encuentra un cuadro de texto libre donde describe su
evento con sus propias palabras. Al presionar "Analizar mi evento",
el sistema procesa la descripción, extrae los datos relevantes y
pre-llena el formulario automáticamente. El cliente revisa los
campos, corrige lo necesario y envía la solicitud.

## Actores
- **Cliente de INARI GROUP** — usuario final, no técnico.
- **Agente de INARI GROUP** — revisa la solicitud recibida.

## Flujo principal
1. Cliente ingresa al flujo de cotización.
2. Sistema muestra cuadro de texto libre con texto de guía/ejemplo
   que indica qué información incluir.
3. Cliente escribe descripción de su evento en español.
4. Cliente presiona botón **"Analizar mi evento"**.
5. Sistema extrae los siguientes campos de la descripción:
   - Tipo de evento
   - Fecha aproximada
   - Número de invitados
   - Presupuesto máximo en soles
   - Preferencias de estilo / temática
6. Sistema pre-llena el formulario de cotización con los datos
   extraídos. Los campos auto-completados se resaltan visualmente.
7. Cliente revisa el formulario pre-llenado.
8. Cliente edita cualquier campo si lo considera necesario.
9. Cliente envía la solicitud de cotización.

## Flujos alternativos / casos borde

- **Información incompleta:** Si faltan uno o más campos clave,
  el sistema muestra alerta indicando qué campos no pudieron
  extraerse. El formulario igual se muestra con lo que sí se extrajo;
  el cliente completa manualmente los faltantes.

- **Sin datos útiles:** Si la descripción no permite extraer ningún
  dato, el sistema muestra mensaje de error y sugiere al cliente
  añadir más detalles (tipo de evento, fecha, número de personas,
  presupuesto).

- **Cliente reescribe la descripción:** El cliente puede modificar
  el texto y presionar "Analizar mi evento" nuevamente. El sistema
  reprocesa y actualiza todos los campos del formulario.

## Reglas de negocio
- El sistema solo acepta descripciones en español.
- El presupuesto se extrae e interpreta siempre en soles (PEN).
- El sistema no guarda ni sugiere descripciones anteriores del
  cliente.
- El agente de INARI GROUP visualiza tanto la descripción original
  como el formulario pre-llenado al revisar la solicitud.
- El campo tipo_de_evento extraído debe mapearse a uno de los valores válidos del enum del sistema: BODA, CORPORATIVO, QUINCEAÑERO, BABY_SHOWER, OTRO. Si Gemini extrae algo que no corresponde a ninguno (ej: "graduación"), el sistema debe mapear al más cercano o usar OTRO.

## Criterios de aceptación
- [ ] El cuadro de texto incluye placeholder o guía con ejemplo
      de descripción.
- [ ] Al presionar "Analizar mi evento", el sistema extrae los 5
      campos definidos cuando están presentes en la descripción.
- [ ] Los campos extraídos se resaltan visualmente de forma
      diferenciada en el formulario.
- [ ] El cliente puede editar cualquier campo pre-llenado antes
      de enviar.
- [ ] Si falta información, el sistema indica qué campos no pudo
      extraer sin bloquear el flujo.
- [ ] Si no extrae ningún dato, el sistema muestra mensaje con
      sugerencias para mejorar la descripción.
- [ ] Re-analizar la descripción actualiza todos los campos del
      formulario.
- [ ] El agente ve descripción original + formulario pre-llenado
      en la solicitud recibida.

## Fuera de alcance
- Extracción de lugar/dirección del evento.
- Extracción de hora específica del evento.
- Soporte para descripciones en idiomas distintos al español.
- Guardado o sugerencia de descripciones previas del cliente.
- Presupuesto en monedas distintas a soles (PEN).

## Mockups ASCII

### Pantalla 1 — Descripción libre

```
┌─────────────────────────────────────────────────────────────┐
│  INARI GROUP — Solicitar Cotización                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cuéntanos sobre tu evento                                  │
│  ─────────────────────────                                  │
│  Descríbelo con tus propias palabras. No te preocupes por   │
│  los detalles técnicos, nosotros los identificamos.         │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Ej: "Quiero organizar el cumpleaños de mi hija de    │  │
│  │ 15 años para unas 80 personas. Me gustaría una       │  │
│  │ temática de flores y colores pastel. El evento       │  │
│  │ sería en julio y tengo un presupuesto de S/ 5,000."  │  │
│  │                                                       │  │
│  │                                                       │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│                        [ Analizar mi evento → ]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pantalla 2 — Formulario pre-llenado (éxito)

```
┌─────────────────────────────────────────────────────────────┐
│  INARI GROUP — Solicitar Cotización                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Encontramos estos datos en tu descripción.              │
│     Revisa y ajusta si es necesario.                        │
│                                                             │
│  ┌── ★ Auto-completado  ────────────────────────────────┐   │
│  │                                                       │   │
│  │  Tipo de evento                                       │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │ ★ Cumpleaños                                    │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  │  Fecha aproximada                                     │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │ ★ Julio 2026                                    │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  │  Número de invitados                                  │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │ ★ 80                                            │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  │  Presupuesto máximo (S/)                              │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │ ★ 5,000                                         │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  │  Preferencias de estilo / temática                    │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │ ★ Flores y colores pastel                       │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                             │
│  ← Reescribir descripción      [ Enviar solicitud → ]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pantalla 3 — Campos incompletos (alerta)

```
┌─────────────────────────────────────────────────────────────┐
│  INARI GROUP — Solicitar Cotización                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️  Completamos lo que pudimos. Faltan algunos datos.      │
│                                                             │
│  ┌── ★ Auto-completado  ────────────────────────────────┐   │
│  │                                                       │   │
│  │  Tipo de evento                                       │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │ ★ Matrimonio                                    │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  │  Fecha aproximada                          ⚠️ Falta   │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │                                                 │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  │  Número de invitados                                  │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │ ★ 120                                           │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  │  Presupuesto máximo (S/)                   ⚠️ Falta   │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │                                                 │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  │  Preferencias de estilo / temática                    │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │ ★ Elegante, blanco y dorado                     │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                             │
│  ← Reescribir descripción      [ Enviar solicitud → ]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pantalla 4 — Sin datos útiles (error)

```
┌─────────────────────────────────────────────────────────────┐
│  INARI GROUP — Solicitar Cotización                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ❌ No pudimos identificar los datos de tu evento.          │
│                                                             │
│  Intenta incluir en tu descripción:                         │
│                                                             │
│    • ¿Qué tipo de evento es? (cumpleaños, boda, etc.)       │
│    • ¿Para cuándo lo tienes planeado?                       │
│    • ¿Cuántas personas asistirán?                           │
│    • ¿Cuál es tu presupuesto aproximado en soles?           │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │                                                       │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│                        [ Analizar mi evento → ]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
