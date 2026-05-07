# Especificación: Cotización sin registro previo

## Historia de usuario
Como visitante de INARI GROUP, quiero poder generar una cotización
de mi evento sin necesidad de registrarme, ver el resultado completo
de la propuesta, y si me interesa enviarla a INARI GROUP registrando
mis datos de contacto, para que el equipo me contacte sin fricciones
innecesarias.

## Descripción
El visitante puede acceder al wizard de cotización desde la landing
sin autenticación. Genera y ve el resultado completo de su propuesta.
Si le interesa, hace click en "Enviar a INARI" que abre un modal de
registro: al completarlo se crea su cuenta, la cotización queda
guardada y ligada a ella, y el equipo de INARI recibe el nuevo lead.
El visitante queda logueado automáticamente al finalizar.

## Actores
- **Visitante** — usuario no autenticado que genera una cotización.
- **Ejecutivo de INARI GROUP** — recibe y gestiona los leads entrantes.

## Flujo principal

### Generación de cotización (sin auth)
1. Visitante accede a la landing y hace click en "Crear cotización"
   sin necesidad de iniciar sesión.
2. Completa el wizard igual que un usuario registrado:
   - Paso 1: descripción libre del evento.
   - Paso 2: confirmar datos (tipo, fecha, invitados, presupuesto,
     estilo) e imágenes de referencia opcionales.
   - Paso 3: pantalla de carga con las 3 fases animadas.
3. El sistema genera la propuesta (básica + premium) y muestra el
   resultado completo: servicios, costos, calidad, narrativa.
4. El visitante puede navegar todo el resultado sin restricciones.

### Captura de lead y registro
5. Al final de la página de resultado, aparece un CTA destacado:
   **"Enviar propuesta a INARI GROUP"**.
6. El visitante hace click → se abre un **modal de registro** con:
   - Nombre completo *(obligatorio)*
   - Email *(obligatorio, validado formato)*
   - Teléfono WhatsApp *(obligatorio, 9 dígitos, empieza en 9)*
   - Contraseña *(obligatorio, mínimo 8 caracteres)*
   - Mensaje para INARI *(opcional, máx. 500 caracteres)*
7. Al enviar el formulario:
   - Se crea la cuenta del cliente.
   - La cotización se guarda y queda ligada a la nueva cuenta.
   - El ejecutivo ve el lead en su panel con el mensaje adjunto.
   - El visitante queda **logueado automáticamente** como cliente.
   - Se muestra confirmación: *"¡Tu propuesta fue enviada! El equipo
     de INARI GROUP te contactará por WhatsApp."*
8. El usuario es redirigido a `QuotationResultPage` ahora con su
   cuenta activa, donde puede ver y descargar su propuesta.

## Flujos alternativos / casos borde

- **Visitante ya tiene cuenta con ese email:** el sistema detecta el
  email duplicado y muestra error: "Ya existe una cuenta con este
  email. Inicia sesión para recuperar tu cotización."

- **Visitante cierra el modal sin registrarse:** la cotización
  generada no se guarda. Si recarga la página, el resultado se pierde.

- **Visitante cierra el navegador sin registrarse:** la cotización
  no persiste. El visitante debe generar una nueva al volver.

- **Usuario ya logueado accede al wizard:** el flujo normal continúa
  sin el CTA de registro. Su cotización se guarda automáticamente.

- **Fallo en el registro (error de red):** el modal muestra el error,
  los campos se conservan y el visitante puede reintentar.

## Reglas de negocio
- El wizard de cotización es accesible sin autenticación.
- La cotización solo se persiste en base de datos cuando el visitante
  completa el registro exitosamente.
- El teléfono WhatsApp es el canal principal de contacto —
  formato peruano: 9 dígitos, primer dígito 9.
- El email actúa como credencial de login para la cuenta creada.
- El mensaje opcional queda asociado a la cotización como nota
  del cliente, visible para el ejecutivo.
- Un visitante puede generar múltiples cotizaciones sin registrarse,
  pero solo la del flujo de registro activo se guarda al completarlo.
- La cuenta creada tiene rol `CLIENTE` por defecto.
- El visitante queda logueado automáticamente tras el registro exitoso.

## Criterios de aceptación
- [ ] El wizard es accesible desde la landing sin login.
- [ ] El resultado de la cotización se muestra completo al visitante
      sin requerir autenticación.
- [ ] El CTA "Enviar propuesta a INARI GROUP" aparece en la página
      de resultado para visitantes no autenticados.
- [ ] El modal de registro contiene: nombre, email, teléfono, contraseña
      y mensaje opcional.
- [ ] El teléfono valida formato peruano (9 dígitos, empieza en 9).
- [ ] El email valida formato y detecta duplicados.
- [ ] Al registrarse: cuenta creada, cotización guardada y ligada,
      usuario logueado automáticamente.
- [ ] El ejecutivo ve el lead (incluyendo mensaje) en su panel.
- [ ] Confirmación en pantalla: "¡Tu propuesta fue enviada! Te
      contactaremos por WhatsApp."
- [ ] Usuario ya logueado no ve el CTA de registro — flujo normal.
- [ ] Si cierra sin registrarse, la cotización no se guarda.

## Fuera de alcance
- Envío automático de email de confirmación al nuevo cliente.
- Notificación por WhatsApp automática al ejecutivo.
- Posibilidad de recuperar una cotización generada sin registro.
- Login social (Google, Facebook).
- Registro sin contraseña (magic link).
