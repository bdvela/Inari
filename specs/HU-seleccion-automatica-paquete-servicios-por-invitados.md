# Especificación: Selección automática de paquete de servicios por número de invitados

## Historia de usuario
Como sistema, quiero seleccionar automáticamente el paquete de
servicios propios de INARI GROUP que corresponde al número de
invitados del evento, para que la cotización siempre incluya la
infraestructura correcta sin intervención manual del ejecutivo.

## Descripción
Al generar una cotización, el sistema consulta el número de
invitados ya capturado y lo compara contra los rangos de los
paquetes de infraestructura propios de INARI GROUP. Selecciona
automáticamente el paquete correspondiente, lo incluye en la
cotización con nombre, contenido y costo, y suma ese costo al
total. El ejecutivo puede anular la selección si lo requiere.

## Actores
- **Sistema** — ejecuta la selección automática.
- **Administrador de INARI GROUP** — configura paquetes y rangos.
- **Ejecutivo de INARI GROUP** — revisa y puede anular la selección.

## Flujo principal
1. Sistema recibe número de invitados del evento como input.
2. Sistema consulta los paquetes configurados y sus rangos.
3. Sistema identifica el paquete cuyo rango contiene el número
   de invitados.
4. Sistema asigna ese paquete a la cotización.
5. Cotización incluye el paquete con nombre, detalle de contenido
   y costo.
6. Costo del paquete se suma automáticamente al total de la
   cotización.

## Flujos alternativos / casos borde

- **Límite exacto entre rangos:** Si el número de invitados
  coincide con el límite superior de un rango e inferior del
  siguiente, el sistema selecciona el paquete del rango superior.

- **Invitados superan el paquete mayor:** Si el número excede el
  rango del paquete más grande disponible, el sistema selecciona
  ese paquete mayor y genera alerta al ejecutivo indicando que el
  número de invitados está fuera del rango máximo configurado.

- **Número de invitados no capturado:** Si el dato aún no existe,
  el sistema no selecciona ningún paquete y alerta al ejecutivo
  para que lo complete antes de continuar.

- **Sin paquetes configurados:** Si no hay paquetes en el sistema,
  la cotización no puede completarse automáticamente. El sistema
  alerta al ejecutivo y bloquea la generación hasta que un
  administrador configure al menos un paquete.

- **Ejecutivo anula la selección:** El ejecutivo puede reemplazar
  el paquete asignado automáticamente por otro disponible. El
  cambio queda registrado junto a la justificación.

## Reglas de negocio
- Solo el número de invitados determina el paquete — el tipo de
  evento no influye en la selección.
- Los rangos de los paquetes no pueden solaparse entre sí.
- Cada rango tiene exactamente un paquete asociado.
- Los paquetes y sus rangos son configurables por el administrador
  sin necesidad de cambiar código.
- El costo del paquete seleccionado siempre se incluye en el
  total de la cotización.
- Toda anulación manual del ejecutivo queda registrada en el log
  de la cotización.

## Criterios de aceptación
- [ ] Al generar cotización, el sistema selecciona el paquete
      correcto según el rango que contiene el número de invitados.
- [ ] Si el número cae en límite exacto entre dos rangos, se
      selecciona el paquete del rango superior.
- [ ] Si el número supera el paquete mayor, se selecciona ese
      paquete y se genera alerta al ejecutivo.
- [ ] Si el número de invitados no fue capturado, el sistema
      alerta y no asigna ningún paquete.
- [ ] Si no hay paquetes configurados, el sistema bloquea la
      generación de cotización y alerta.
- [ ] El paquete aparece en la cotización con nombre, contenido
      y costo detallado.
- [ ] El costo del paquete se suma al total de la cotización.
- [ ] El ejecutivo puede anular la selección automática.
- [ ] Toda anulación manual queda registrada en el log.
- [ ] El administrador puede crear, editar y eliminar paquetes
      y sus rangos sin cambiar código.

## Fuera de alcance
- Selección de paquete según tipo de evento.
- Combinación de múltiples paquetes para un mismo evento.
- Sugerencia de paquetes alternativos al ejecutivo.
- Paquetes de proveedores externos — solo aplica a servicios
  propios de INARI GROUP.
- Validación de que los rangos configurados sean contiguos y sin huecos (ej: 1-50, 51-100, 101-150). El sistema asume que el administrador los configura correctamente.
