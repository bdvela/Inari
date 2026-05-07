# Especificación: Inferencia automática de servicios desde imágenes de referencia

## Historia de usuario
Como sistema, quiero analizar las imágenes de referencia de estilo
subidas por el cliente para inferir automáticamente los servicios
necesarios para el evento, y añadirlos como servicios opcionales en
la cotización, de modo que el cliente no tenga que conocer la
terminología técnica de los servicios para recibirlos en su propuesta.

## Descripción
Cuando el cliente sube imágenes de referencia en el wizard de
cotización, el sistema las analiza con IA visual y extrae los
servicios que se infieren de ellas (ej: foto con arco floral →
`flores`). Estos servicios se añaden como opcionales al optimizer.
Si el presupuesto alcanza, aparecen cotizados en la propuesta. El
cliente ve un mensaje indicando qué se detectó; el ejecutivo ve
una sección detallada con el origen de cada servicio.

## Actores
- **Sistema** — ejecuta el análisis y la inferencia automáticamente.
- **Cliente** — sube las imágenes y recibe retroalimentación de lo
  detectado.
- **Ejecutivo de INARI GROUP** — ve el detalle completo de servicios
  inferidos vs declarados.

## Flujo principal
1. Cliente sube 1-3 imágenes de referencia en el Paso 2 del wizard.
2. Sistema analiza las imágenes con Gemini Vision y extrae
   `suggested_services` (lista de servicios inferidos).
3. Sistema filtra los servicios inferidos:
   - Descarta los que no pertenecen al catálogo, intentando primero
     mapearlos al servicio más cercano (ej: "show de baile" →
     `animacion`).
   - Descarta los que el cliente ya declaró en la descripción de
     texto (evita duplicados).
   - Descarta los inferidos con confianza del análisis visual < 0.6.
4. Los servicios inferidos válidos se añaden como **opcionales** al
   optimizer junto a los servicios declarados en texto.
5. Optimizer selecciona proveedores según presupuesto — los opcionales
   inferidos se incluyen si el presupuesto alcanza; se descartan si
   no, sin afectar los obligatorios.
6. Al generar la cotización, el cliente ve el mensaje:
   *"Detectamos que podrías necesitar: [lista de servicios inferidos
   que entraron al optimizer]."*
7. El ejecutivo ve en `QuotationResultPage` una sección separada
   **"Servicios detectados visualmente"** con la lista completa de
   servicios inferidos y su estado (incluido / descartado por
   presupuesto / sin proveedor disponible).

## Flujos alternativos / casos borde

- **Sin imágenes:** El cliente no sube imágenes → no hay inferencia,
  la cotización continúa normalmente sin cambios.

- **Confianza baja:** La confianza del análisis visual es < 0.6 →
  los `suggested_services` se descartan completamente y no se añaden
  al optimizer.

- **Sin proveedor disponible:** Un servicio inferido no tiene
  proveedores en el catálogo para el tipo de evento y fecha → se omite
  sin error; el ejecutivo lo ve como "sin proveedor disponible" en
  la sección de servicios detectados.

- **Servicio fuera de catálogo:** Gemini infiere un servicio sin
  equivalente exacto en el catálogo → sistema intenta mapear al más
  cercano; si no hay mapeo posible, lo descarta silenciosamente.

- **Presupuesto insuficiente:** El optimizer no puede incluir los
  servicios opcionales inferidos → se descarta solo ese servicio;
  los obligatorios no se afectan.

- **Reproceso manual por ejecutivo:** El ejecutivo ajusta el
  presupuesto y reprocesa → los servicios inferidos de imágenes
  NO se re-aplican en el reproceso; la nueva versión usa solo los
  servicios del formulario original.

## Reglas de negocio
- Servicios inferidos de imágenes = siempre opcionales, nunca
  obligatorios.
- Umbral de confianza fijo: 0.6. No configurable por el administrador
  en esta versión.
- No se duplican servicios: si un servicio fue declarado en texto
  y también inferido de imágenes, cuenta solo una vez como
  obligatorio (el declarado en texto tiene precedencia).
- Mapeo de servicios no reconocidos al más cercano del catálogo
  antes de descartar.
- Catálogo de servicios inferibles: catering, decoracion,
  fotografia, videografia, musica, iluminacion, flores, torta,
  transporte, animacion.
- El cliente ve los servicios inferidos que efectivamente entraron
  al optimizer.
- El ejecutivo ve el detalle completo incluyendo los descartados
  y su motivo.
- La inferencia solo aplica en la generación inicial, no en
  reprocesos manuales.

## Criterios de aceptación
- [ ] Cuando el cliente sube imágenes, el sistema extrae
      `suggested_services` y los añade como opcionales al optimizer.
- [ ] Servicios con confianza < 0.6 no se añaden al optimizer.
- [ ] Servicios ya declarados en texto no se duplican en el optimizer.
- [ ] Servicios fuera de catálogo se mapean al más cercano o se
      descartan.
- [ ] El cliente ve el mensaje "Detectamos que podrías necesitar:
      [lista]" en la cotización generada.
- [ ] `QuotationResultPage` muestra sección "Servicios detectados
      visualmente" con estado de cada servicio inferido.
- [ ] Sin imágenes: flujo de cotización no cambia.
- [ ] Servicios opcionales inferidos no bloquean obligatorios si
      el presupuesto es insuficiente.
- [ ] El reproceso manual no re-aplica servicios inferidos de
      imágenes de la generación original.

## Fuera de alcance
- Configuración del umbral de confianza por el administrador.
- Inferencia de servicios desde la descripción de texto
  (eso ya lo hace `mandatory_services` del parser de texto).
- Re-aplicación de inferencia visual en reprocesos manuales.
- Servicios obligatorios inferidos de imágenes.

---

## Mockups ASCII

### Vista cliente — mensaje post-cotización (QuotationResultPage)

```
┌─────────────────────────────────────────────────────────────┐
│  INARI GROUP — Tu propuesta está lista                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✨ Personalizamos tu propuesta según tus imágenes          │
│  ─────────────────────────────────────────────────         │
│  Detectamos que podrías necesitar:                          │
│                                                             │
│  ┌──────────┐  ┌────────────┐  ┌─────────────┐            │
│  │  flores  │  │ decoracion │  │ iluminacion │            │
│  └──────────┘  └────────────┘  └─────────────┘            │
│                                                             │
│  Estos servicios fueron incluidos en tu cotización          │
│  según disponibilidad y presupuesto.                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Vista ejecutivo — sección "Servicios detectados visualmente"

```
┌─────────────────────────────────────────────────────────────┐
│  📷 Servicios detectados visualmente                        │
│  Inferidos del análisis de las imágenes de referencia       │
├────────────────────┬──────────────┬────────────────────────┤
│  Servicio          │  Estado      │  Origen                │
├────────────────────┼──────────────┼────────────────────────┤
│  flores            │  ✅ Incluido │  📷 Imagen #1          │
│  decoracion        │  ✅ Incluido │  📷 Imagen #1 #2       │
│  iluminacion       │  ✅ Incluido │  📷 Imagen #2          │
│  videografia       │  ⚠️ Sin      │  📷 Imagen #3          │
│                    │  proveedor  │                        │
│  musica            │  ❌ Descart. │  Presupuesto insuf.    │
├────────────────────┴──────────────┴────────────────────────┤
│  Confianza del análisis visual: 87%                        │
│  Umbral mínimo aplicado: 60%                               │
└─────────────────────────────────────────────────────────────┘
```

### Vista ejecutivo — caso sin imágenes subidas

```
┌─────────────────────────────────────────────────────────────┐
│  📷 Servicios detectados visualmente                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  El cliente no subió imágenes de referencia.                │
│  Los servicios de la cotización provienen únicamente        │
│  de la descripción de texto y las reglas de negocio.        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
