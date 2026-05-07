# Especificación: Panel del cliente

## Historia de usuario
Como cliente de INARI GROUP, quiero que mi panel solo muestre mis
propias cotizaciones y estadísticas personales, para no ver
información de otros clientes ni acceder a controles que son
exclusivos del equipo de ventas.

## Descripción
El cliente accede a un panel personal aislado donde únicamente
ve sus propios eventos y cotizaciones. El sistema aplica control
de acceso estricto: cualquier intento de acceder a una cotización
ajena retorna error. Los controles internos del equipo de ventas
(ajuste de presupuesto, identidad de proveedores) no están
presentes en ninguna vista del cliente.

## Actores
- **Cliente de INARI GROUP** — usuario final, no técnico.

## Flujo principal

### Dashboard
1. Cliente autenticado accede a `/dashboard`.
2. El sistema carga únicamente las cotizaciones cuyo evento
   pertenece al cliente autenticado.
3. El subtítulo del dashboard muestra **"Mis eventos y propuestas"**.
4. Las cotizaciones se ordenan por fecha de creación descendente
   (más reciente primero).
5. Las estadísticas mostradas (total, completadas, calidad promedio,
   costo promedio) se calculan sobre todas las cotizaciones
   completadas del cliente (básica + premium), contando solo la
   versión más reciente de cada evento.
6. Si el cliente no tiene cotizaciones, se muestra un empty state
   con el botón **"Crear mi primera cotización"** que lleva al wizard.

### Ver detalle de cotización
1. Cliente hace click en una cotización de su lista.
2. Sistema verifica que la cotización pertenece al cliente
   autenticado; si no, retorna 403 y el frontend muestra
   pantalla de acceso denegado.
3. Cliente ve el detalle: datos del evento, costo total,
   quality score, servicios incluidos, PDF descargable.
4. Los nombres e identidad de los proveedores **nunca son visibles**
   para el cliente en ningún estado de la cotización — es
   información interna permanente del equipo de ventas.
5. El botón **"Ajustar presupuesto"** no aparece en ninguna
   sección de la vista.

### Descarga de PDF
1. Cliente puede descargar el PDF de cualquier cotización
   propia con estado "completado".

## Flujos alternativos / casos borde

- **Acceso directo por URL a cotización ajena:** el backend
  retorna 403; el frontend redirige a `/dashboard` con mensaje
  "No tienes acceso a esta cotización."

- **Sin cotizaciones:** el dashboard muestra el empty state con
  CTA "Crear mi primera cotización" en lugar de la tabla y
  estadísticas.

- **Cotización en estado procesando/error:** el cliente puede
  verla en la lista pero el detalle muestra su estado actual
  sin datos de proveedores ni PDF disponible.

## Reglas de negocio
- El cliente solo accede a cotizaciones de eventos donde
  `evento.cliente_id == usuario_autenticado.id`.
- Los nombres de proveedores nunca se exponen al cliente,
  independientemente del estado de la cotización.
- Las estadísticas del dashboard usan solo la versión más
  reciente de cada evento (no acumula reprocesos).
- El cliente no puede eliminar, archivar ni reprocesar
  cotizaciones.
- La navegación lateral del cliente muestra únicamente:
  Dashboard, Nueva cotización, Ajustes. Las secciones de
  Administración (Proveedores, Reglas de negocio, Paquetes)
  no son accesibles ni visibles.

## Criterios de aceptación
- [ ] Dashboard muestra solo cotizaciones del cliente autenticado.
- [ ] Subtítulo del dashboard dice "Mis eventos y propuestas".
- [ ] Estadísticas calculan sobre cotizaciones completadas propias,
      versión más reciente por evento.
- [ ] Empty state con botón "Crear mi primera cotización" cuando
      no hay cotizaciones.
- [ ] Cotizaciones ordenadas por fecha de creación descendente.
- [ ] `QuotationResultPage` no muestra el botón "Ajustar presupuesto".
- [ ] Nombres e identidad de proveedores nunca visibles para el cliente.
- [ ] Acceso a cotización ajena por URL retorna 403 y redirige
      al dashboard con mensaje de error.
- [ ] Cliente puede descargar PDF de sus cotizaciones completadas.
- [ ] Menú lateral no muestra secciones de Administración.

## Fuera de alcance
- Notificaciones al cliente cuando su cotización cambia de estado.
- Posibilidad de que el cliente elimine o archive cotizaciones.
- Desbloqueo de proveedores por acción del ejecutivo.
- Reproceso de cotizaciones desde el panel del cliente.
