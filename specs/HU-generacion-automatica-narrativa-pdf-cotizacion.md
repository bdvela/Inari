# Especificación: Generación automática de narrativa personalizada en PDF de cotización

## Historia de usuario
Como ejecutivo de ventas de INARI GROUP, quiero que el PDF de
cotización incluya una descripción narrativa personalizada del
evento generada automáticamente, para no tener que redactarla
manualmente en cada propuesta y garantizar un tono profesional
y consistente.

## Descripción
Al generar el PDF de cotización, el sistema produce
automáticamente un párrafo narrativo que describe el evento
del cliente y lo conecta con los servicios seleccionados por
INARI GROUP. El tono es cálido, cercano y profesional —
acorde al sector de eventos sociales. El ejecutivo puede
revisar y editar la narrativa antes de enviar el PDF.

## Actores
- **Sistema** — genera la narrativa automáticamente.
- **Ejecutivo de ventas de INARI GROUP** — revisa, edita
  (si necesario) y envía el PDF al cliente.
- **Cliente de INARI GROUP** — receptor del PDF.

## Flujo principal
1. Ejecutivo solicita generar el PDF de cotización.
2. Sistema recopila los datos del evento: nombre del cliente,
   tipo de evento, fecha aproximada, número de invitados y
   preferencias de estilo/temática.
3. Sistema recopila los servicios seleccionados en la
   cotización.
4. Sistema genera narrativa que describe el evento del cliente
   conectándolo con los servicios de INARI GROUP, en tono
   cálido, cercano y profesional.
5. Narrativa aparece en la primera sección del PDF, antes del
   detalle de servicios y costos.
6. Ejecutivo revisa la narrativa en la vista previa del PDF.
7. Si el ejecutivo edita la narrativa, la versión editada
   reemplaza la generada y se guarda en la cotización.
8. Ejecutivo envía el PDF al cliente.

## Flujos alternativos / casos borde

- **Datos incompletos del evento:** Si faltan datos, el sistema
  genera la narrativa con los disponibles, omitiendo con
  elegancia los faltantes. No aparecen campos vacíos ni
  placeholders en el texto generado.

- **Nueva versión de cotización:** Al generar una nueva versión,
  el sistema regenera la narrativa automáticamente con los datos
  actualizados, descartando la versión anterior (incluyendo
  ediciones manuales previas del ejecutivo).

- **Ejecutivo edita la narrativa:** La versión editada reemplaza
  la generada y queda guardada en la cotización. El sistema no
  sobreescribe ediciones manuales salvo al generar nueva versión.

- **Fallo o timeout de Gemini:** Si el servicio de generación
  no responde o devuelve error, el sistema genera el PDF sin la
  sección narrativa. El ejecutivo recibe alerta indicando que la
  narrativa no pudo generarse y puede escribirla manualmente
  antes de enviar. El PDF no se bloquea bajo ninguna
  circunstancia por fallo del LLM.

## Reglas de negocio
- La narrativa se genera en español.
- Extensión máxima: 3 a 5 oraciones.
- El tono es cálido, cercano y profesional — nunca formal
  corporativo. Acorde al sector de eventos sociales.
- La narrativa describe el evento del cliente y lo conecta
  con los servicios seleccionados por INARI GROUP.
- La narrativa no menciona precios ni montos.
- La narrativa aparece siempre en la primera sección del PDF,
  antes del detalle de servicios y costos.
- El tono y estilo son consistentes sin importar qué ejecutivo
  genera la propuesta.

## Criterios de aceptación
- [ ] Al generar el PDF, el sistema produce automáticamente
      la narrativa sin acción adicional del ejecutivo.
- [ ] La narrativa usa nombre del cliente, tipo de evento,
      fecha aproximada, número de invitados, estilo/temática
      y servicios seleccionados.
- [ ] El tono es cálido, cercano y profesional — sin
      formalidad corporativa tipo carta.
- [ ] La narrativa conecta el evento del cliente con los
      servicios ofrecidos por INARI GROUP.
- [ ] La narrativa tiene entre 3 y 5 oraciones.
- [ ] No aparecen precios ni montos en la narrativa.
- [ ] Si faltan datos, la narrativa se genera igualmente
      sin mostrar campos vacíos ni placeholders.
- [ ] La narrativa aparece en la primera sección del PDF.
- [ ] El ejecutivo puede editar la narrativa antes de
      enviar el PDF.
- [ ] La versión editada se guarda en la cotización.
- [ ] Al generar nueva versión de cotización, la narrativa
      se regenera con los datos actualizados.
- [ ] Si Gemini falla o tiene timeout, el PDF se genera
      igualmente sin la sección narrativa y el ejecutivo
      recibe alerta.

## Fuera de alcance
- Generación de narrativa en idiomas distintos al español.
- Múltiples estilos de tono configurables por el ejecutivo.
- Narrativa separada por sección de servicios.
- Preservación de ediciones manuales al generar nueva
  versión de cotización.

## Mockups ASCII

### Vista del ejecutivo — edición de narrativa antes de enviar

```
┌─────────────────────────────────────────────────────────────┐
│  INARI GROUP — Vista previa de cotización                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Narrativa de propuesta          ✏️ Editar                  │
│  ──────────────────────────────────────────────            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Para Andrea y su familia, preparar una quinceañera    │  │
│  │ es mucho más que organizar un evento — es dar vida    │  │
│  │ a un momento único. En INARI GROUP hemos diseñado     │  │
│  │ esta propuesta pensando en cada detalle: desde la     │  │
│  │ decoración en tonos rosas y dorados hasta el          │  │
│  │ servicio de catering para 120 invitados, todo         │  │
│  │ cuidado con el estilo y calidez que merecen.          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Detalle de servicios                                       │
│  ──────────────────────────────────────────────            │
│  Paquete Oro (hasta 150 invitados) ........... S/ 8,500    │
│  Catering buffet premium ..................... S/ 4,200    │
│  Decoración temática rosas y dorado .......... S/ 1,800    │
│  Fotografía y video .......................... S/ 2,500    │
│  ─────────────────────────────────────────────────────     │
│  TOTAL ........................................ S/ 17,000   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [ ← Volver ]              [ Enviar PDF al cliente → ]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Vista del ejecutivo — modo edición de narrativa

```
┌─────────────────────────────────────────────────────────────┐
│  INARI GROUP — Editar narrativa                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Edita el texto de la propuesta:                            │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Para Andrea y su familia, preparar una quinceañera   │  │
│  │ es mucho más que organizar un evento — es dar vida   │  │
│  │ a un momento único. En INARI GROUP hemos diseñado    │  │
│  │ esta propuesta pensando en cada detalle: desde la    │  │
│  │ decoración en tonos rosas y dorados hasta el         │  │
│  │ servicio de catering para 120 invitados, todo        │  │
│  │ cuidado con el estilo y calidez que merecen.         │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  [ Cancelar ]                        [ Guardar cambios ]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
