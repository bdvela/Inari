# Especificación: Panel del ejecutivo de ventas

## Historia de usuario
Como ejecutivo de ventas de INARI GROUP, quiero un panel
centralizado donde pueda ver todas las cotizaciones de todos
los clientes, crear cotizaciones en nombre de un cliente, hacer
ajustes manuales y consultar el historial de cambios de cada
propuesta, para dar seguimiento completo sin salir del sistema.

## Descripción
El ejecutivo opera con visión global del sistema. Su dashboard
muestra todas las cotizaciones de todos los clientes con columna
"Cliente" visible. Puede crear cotizaciones completando manualmente
los datos del cliente (sin sistema de cuentas de clientes
registrados). En `QuotationResultPage` tiene acceso completo a
controles de ajuste: presupuesto, swap de proveedor, reproceso y
edición de narrativa. Cada acción queda registrada automáticamente
en un historial de cambios auditable visible solo para el ejecutivo.

## Actores
- **Ejecutivo de ventas de INARI GROUP** — opera el sistema,
  crea y ajusta cotizaciones, da seguimiento a clientes.

## Flujo principal

### Dashboard
1. Ejecutivo autenticado accede a `/dashboard`.
2. Sistema carga todas las cotizaciones del sistema, de todos
   los clientes, ordenadas por fecha de creación descendente.
3. El subtítulo muestra **"Todas las cotizaciones del sistema"**.
4. La tabla incluye columna **"Cliente"** con nombre del cliente.
5. El ejecutivo puede filtrar por estado (completada, procesando,
   error) y buscar por nombre de cliente.
6. Las estadísticas (total, completadas, calidad promedio, costo
   promedio) calculan sobre las versiones más recientes de todos
   los eventos del sistema.

### Crear cotización en nombre de un cliente
1. Ejecutivo accede al wizard de cotización desde "Nueva cotización".
2. En el **Paso 2**, aparece un bloque **"Datos del cliente"** con:
   - **Nombre completo** (obligatorio)
   - **DNI** (opcional)
3. El ejecutivo completa los campos manualmente.
4. La cotización generada queda asociada al nombre ingresado,
   no a la cuenta del ejecutivo.
5. El bloque "Datos del cliente" es visible **únicamente cuando
   `role === 'ejecutivo'`**. El cliente que cotiza para sí mismo
   no ve ese bloque — la cotización queda asociada a su propia
   cuenta automáticamente.

### Ver y ajustar cotización
1. Ejecutivo accede al detalle de cualquier cotización del sistema.
2. Los **nombres e identidad de los proveedores son visibles**.
3. El botón **"Ajustar presupuesto"** está visible y permite
   modificar el presupuesto máximo y re-lanzar el optimizer.
4. "Ajustar presupuesto" genera una **nueva versión** de la
   cotización; la versión anterior queda en el historial de versiones.
5. El ejecutivo puede hacer **swap de proveedor**: el dropdown
   muestra todos los proveedores del mismo tipo de servicio en
   el catálogo, sin filtro por fecha ni tipo de evento en esta versión.
6. El ejecutivo puede **reprocesar** la cotización.
7. El ejecutivo puede **editar la narrativa** del PDF.

### Historial de cambios
1. `QuotationResultPage` muestra un panel colapsable
   **"Historial de cambios"**, visible solo para el ejecutivo.
2. Cada entrada registra automáticamente:
   - **Quién**: nombre + rol de quien ejecutó la acción.
   - **Qué**: acción realizada (creó cotización, ajustó presupuesto,
     cambió proveedor X por Y, editó narrativa, reprocesó).
   - **Cuándo**: timestamp de la acción.
   - **Valores anterior y nuevo** cuando aplica (swap de proveedor,
     ajuste de presupuesto).
3. Las entradas son generadas automáticamente por el sistema;
   el ejecutivo no escribe comentarios manuales.

## Flujos alternativos / casos borde

- **Sin cotizaciones en el sistema:** el dashboard muestra
  empty state genérico con CTA para crear la primera cotización.

- **Nombre completo vacío al crear cotización:** el sistema
  bloquea el avance del wizard y muestra error de validación
  en el campo.

- **Swap con catálogo vacío para ese tipo de servicio:**
  el dropdown muestra mensaje "Sin proveedores disponibles"
  y no permite ejecutar el swap.

## Reglas de negocio
- El ejecutivo ve todas las cotizaciones del sistema sin
  restricción por cliente.
- Las cotizaciones creadas por el ejecutivo quedan asociadas
  al nombre del cliente ingresado manualmente, no al ejecutivo.
- "Ajustar presupuesto" siempre genera nueva versión; nunca
  sobreescribe la versión anterior.
- El historial de cambios es visible solo para ejecutivo y admin;
  el cliente no lo ve.
- El swap muestra todos los proveedores del mismo tipo de servicio
  sin filtro de compatibilidad en esta versión.
- El ejecutivo no puede eliminar cotizaciones.
- Las estadísticas globales usan solo la versión más reciente
  de cada evento.
- El menú lateral muestra: Dashboard, Nueva cotización, Ajustes.
  No incluye secciones de Administración (Proveedores, Reglas
  de negocio, Paquetes).

## Criterios de aceptación
- [ ] Dashboard muestra cotizaciones de todos los clientes con
      columna "Cliente" visible.
- [ ] Subtítulo del dashboard dice "Todas las cotizaciones del sistema".
- [ ] Estadísticas calculan sobre versiones más recientes de todos
      los eventos del sistema.
- [ ] Filtro por estado y búsqueda por nombre de cliente funcionan.
- [ ] Wizard muestra bloque "Datos del cliente" (Nombre + DNI) en
      Paso 2 solo cuando `role === 'ejecutivo'`.
- [ ] Campo "Nombre completo" es obligatorio; DNI es opcional.
- [ ] Cotización creada por ejecutivo queda asociada al cliente
      ingresado, no al ejecutivo.
- [ ] `QuotationResultPage` muestra nombres de proveedores al ejecutivo.
- [ ] Botón "Ajustar presupuesto" visible y funcional para el ejecutivo.
- [ ] Ajuste de presupuesto genera nueva versión; versión anterior
      queda en historial.
- [ ] Swap de proveedor muestra todos los del mismo tipo sin filtro.
- [ ] Panel "Historial de cambios" colapsable visible solo para ejecutivo.
- [ ] Historial registra: quién, qué acción, cuándo, valores
      anterior/nuevo donde aplica.
- [ ] Menú lateral no muestra secciones de Administración.

## Fuera de alcance
- Reasignación de cotizaciones entre ejecutivos.
- Vista de auditoría global separada.
- Notificaciones al cliente cuando el ejecutivo modifica su cotización.
- Filtro de swap por compatibilidad de fecha o tipo de evento.
- Creación de cuentas de clientes desde el wizard.
