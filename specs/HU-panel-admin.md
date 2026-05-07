# Especificación: Panel del administrador

## Historia de usuario
Como administrador de INARI GROUP, quiero un panel de
configuración donde pueda gestionar el catálogo de proveedores,
definir las reglas de negocio por tipo de evento y configurar
los paquetes de servicios por rango de invitados, para mantener
el sistema calibrado sin intervención técnica.

## Descripción
El administrador opera exclusivamente en el plano de configuración
del sistema. Su panel no tiene acceso a cotizaciones ni estadísticas
— su responsabilidad es mantener los tres catálogos que alimentan
el motor: proveedores, reglas de negocio y paquetes. Los cambios
aplican solo a cotizaciones futuras. Las acciones destructivas
(eliminar reglas y paquetes) requieren confirmación por modal.

## Actores
- **Administrador de INARI GROUP** — configura y mantiene
  los catálogos del sistema sin intervención técnica.

## Flujo principal

### Navegación
1. Admin autenticado accede al sistema.
2. El menú lateral muestra únicamente: **Proveedores,
   Reglas de negocio, Paquetes**.
3. No aparece Dashboard, Nueva cotización ni acceso
   a cotizaciones existentes.

### Gestión de proveedores
1. Admin accede a la sección **Proveedores**.
2. Ve la lista completa de proveedores con su estado
   (activo / inactivo).
3. Puede **crear** un proveedor con los campos obligatorios:
   nombre, tipo de servicio, costo base, índice de calidad,
   tipos de evento compatibles.
4. Puede **editar** cualquier campo de un proveedor existente.
   La edición es inmediata sin confirmación.
5. Puede **desactivar** un proveedor (soft delete). El registro
   permanece en la BD pero no aparece en el optimizer ni en
   el dropdown de swap del ejecutivo.

### Gestión de reglas de negocio
1. Admin accede a la sección **Reglas de negocio**.
2. Ve las reglas agrupadas por tipo de evento.
3. Puede **crear** reglas (obligatorio, opcional, excluido)
   por tipo de evento.
4. Puede **editar** una regla existente. La edición es
   inmediata sin confirmación.
5. Puede **eliminar** una regla. El sistema muestra un
   **modal de confirmación** antes de ejecutar la eliminación.

### Gestión de paquetes
1. Admin accede a la sección **Paquetes**.
2. Ve los paquetes configurados con nombre, rango de
   invitados y servicios incluidos.
3. Puede **crear** un paquete con: nombre, rango mínimo
   de invitados, rango máximo, lista de servicios incluidos.
4. Puede **editar** un paquete existente. La edición es
   inmediata sin confirmación.
5. Puede **eliminar** un paquete. El sistema muestra un
   **modal de confirmación** antes de ejecutar la eliminación.

## Flujos alternativos / casos borde

- **Proveedor desactivado:** no aparece en el optimizer
  ni en el dropdown de swap; las cotizaciones existentes
  que ya lo incluyen no se modifican retroactivamente.

- **Eliminación cancelada en modal:** el admin cierra el
  modal o presiona "Cancelar" — la regla o paquete no
  se elimina y el estado del listado no cambia.

- **Catálogo de proveedores vacío para un tipo de servicio:**
  el sistema continúa funcionando; el optimizer simplemente
  no puede cubrir ese servicio (resultado `feasible=False`
  si era obligatorio).

## Reglas de negocio
- El admin no puede generar ni ver cotizaciones.
- Los cambios en proveedores, reglas y paquetes aplican
  solo a cotizaciones futuras — no son retroactivos.
- La desactivación de proveedores es soft delete: el
  registro permanece en la BD.
- La eliminación de reglas y paquetes requiere confirmación
  por modal; la edición no requiere confirmación.
- El admin no tiene acceso al historial de cambios de
  cotizaciones ni a estadísticas del sistema.
- No hay validación de solapamiento de rangos de invitados
  entre paquetes — el admin es responsable de configurarlos
  correctamente.
- Campos obligatorios de proveedor: nombre, tipo de servicio,
  costo base, índice de calidad, tipos de evento compatibles.

## Criterios de aceptación
- [ ] Menú lateral muestra solo: Proveedores, Reglas de negocio,
      Paquetes. Sin Dashboard ni acceso a cotizaciones.
- [ ] Admin puede crear, editar y desactivar proveedores.
- [ ] Proveedor desactivado no aparece en optimizer ni en
      swap del ejecutivo.
- [ ] Admin puede crear, editar y eliminar reglas de negocio
      por tipo de evento.
- [ ] Admin puede crear, editar y eliminar paquetes con
      rango de invitados y servicios.
- [ ] Eliminación de reglas y paquetes requiere confirmación
      por modal antes de ejecutarse.
- [ ] Edición de proveedores, reglas y paquetes es inmediata
      sin confirmación.
- [ ] Admin no puede generar cotizaciones — botón
      "Nueva cotización" no existe en su interfaz.
- [ ] Admin no ve cotizaciones existentes ni estadísticas.

## Fuera de alcance
- Validación automática de solapamiento de rangos de invitados
  entre paquetes.
- Retroactividad de cambios sobre cotizaciones existentes.
- Auditoría de cambios realizados por el admin.
- Gestión de usuarios del sistema (crear/editar ejecutivos
  o clientes).
