# Rediseño "Ticket vibrante"

Maquetas de referencia: canvas de diseño "Tadaa! · Rediseño Ticket vibrante" (móvil, escritorio, backoffice).

## Qué incluye esta rama

- `web/experience/tv.css`: sistema visual compartido (azul eléctrico texturizado con degradado desde abajo, lima para acción, tinta navy, Outfit + Plus Jakarta Sans, tarjetas tipo app, boleto con muescas, iconos de evento, botones píldora).
- `web/experience/img/tv/`: texturas (azul, grano, dorado).
- Portada (`index.html`, `site-live.js`): nueva piel, hero "¿Qué plan hay hoy?", iconos sobre el nombre en las tarjetas.
- Ficha de evento (`event.html`, `event-live.js`): reescrita. Hero con degradado desde abajo, logo del evento en lugar del nombre (si existe), iconos, precios por zona seleccionables, pestañas Sinopsis / Reparto y producción / Info / Reseñas, tarjeta de compra con aviso Golden y "Antes de comprar" debajo, eventos similares. Botón hacia la app con enlace directo `app.html#/evento/<id>`.
- App de usuario (`app.html`, `app-live.js`): nueva piel, iconos en tarjetas, enlace directo a evento, QR del boleto se refresca cada 60 s.
- App Expo (`mobile/App.js`): paleta y radios nuevos (azul, tinta navy, botones píldora, tarjetas redondeadas).
- Corrección de API: `GET /api/v2/events/:id` devolvía la fila del evento como `ticketTypes`; ahora devuelve los tipos de boleto consultados.

## Campos de `events.metadata` que lee la nueva interfaz

Todos son opcionales; si faltan, la interfaz muestra un texto de respaldo.

| Campo | Uso |
|---|---|
| `logo_url` | Logo del evento (PNG transparente) en lugar del título |
| `now_enabled` | Icono Now! (antes Rush) |
| `golden_enabled`, `golden_benefit` | Icono y aviso de Golden Ticket |
| `tadaa_original` | Sello TADAA! Original |
| `cast` `[{name, role, photo_url}]`, `crew` `[{name, role}]` | Pestaña Reparto y producción |
| `duration`, `rating`, `tags` | Pestaña Info (rating = clasificación, p. ej. "Familiar") |
| `reviews` `[{source, quote, stars}]`, `tadaa_rating` | Pestaña Reseñas |
| `category`, `schedule_label`, `source_url` | Igual que antes |

## Pendiente de backend (no incluido aquí)

- **Now!**: inscripción por función, apertura X horas antes solo para inscritos, cupo y precio propios.
- **Golden Ticket aleatorio**: 1 de cada 100 boletos finales al emitirse, beneficio por evento (upgrade, meet & greet, boleto a otro evento). Hoy existe la campaña de sorteo de Beta 3.
- **Portal de productores**: compras por comprador, activar/desactivar Now! y Golden, definir beneficio.
- **Portal de empresas**: estadística agregada, altas/bajas que solo inactivan beneficios, promo de 50 % por 3 meses al dar de baja.
- **RFC** como identificador único en membresías para no duplicar cuentas.
- **App Staff** separada: escanear QR dinámico y verificar compras / pases provisionales y entrega de add-ons.
- Add-ons (merch y combos) por evento.

## Fase 2 — funciones completas (backend + frontend)

**Migración:** `server/migrations/004_now_golden_addons_rfc.sql` (aditiva). Correr `npm run db:migrate` antes de desplegar.
**Módulo:** `server/src/features.mjs`, montado desde `platformRequest` antes del 404. Hooks en `createOrder`, `sandboxPay`, `clipWebhook`, `membershipOrder`, importación de padrón y `register`.

| Función | Cómo funciona | Endpoints |
|---|---|---|
| **Now!** | Campaña por tipo de boleto (función). Abre X horas antes; registro solo antes de abrir; al abrir solo registrados compran; cupo y máx. por persona se cuentan sobre pedidos vivos → los primeros en pagar se lo llevan. Precio Now! opcional. | `GET /api/v2/now`, `POST/DELETE /api/v2/now/:id/signup` |
| **Golden aleatorio** | Configuración por evento (1 de cada N, máx. ganadores, beneficio: upgrade, meet & greet, boleto a otro evento u otro). Se tira el dado al emitir cada boleto (sandbox y webhook Clip). Notificación + revelado animado. | `POST /api/v2/tickets/:id/reveal` |
| **Add-ons** | Por evento (merch, combo, alimentos, experiencia, estacionamiento). Stock = stock − pedidos vivos. Se suman al pedido del boleto; Staff marca la entrega. | en `GET /api/v2/events/:id` y `POST /api/v2/orders` (`addons:[{id,quantity}]`) |
| **Estados del boleto** | `delivery_status`: provisional → delivering → final. QR dinámico solo para boleto final de boletera TADAA!; token válido 75 s, se renueva cada 60 s. | `PATCH /orgs/:org/producer/tickets/:id/delivery` |
| **Portal productores** | Compras (quién compró, add-ons, Now!/Golden), encender/apagar Now!, configurar Golden y beneficio, alta de add-ons. | `/api/v2/orgs/:org/producer/{purchases,events/:id/features,events/:id/golden,events/:id/now,now/:id,events/:id/addons,addons/:id}` |
| **Portal empresas** | Estadísticas agregadas, alta individual con RFC, baja/reactivación. Baja = solo pausa beneficios + oferta “Un pajarito nos contó…” (3 meses al 50%). | `/api/v2/orgs/:org/company/{stats,employees,employees/:id/deactivate,employees/:id/reactivate}` |
| **RFC** | Único por cuenta. En registro, perfil (`PUT /api/v2/me/rfc`) e importación (`rfc` opcional). La reafiliación con el mismo RFC liga y reactiva la misma cuenta. | |
| **Membresía** | $100/mes; con oferta abierta se cobra con descuento y se consume un mes al activarse. | `/api/v2/membership/checkout` |
| **Cuenta** | Nivel, XP, insignias, RFC y ofertas. | `GET /api/v2/me/account` |
| **Staff** | App aparte `staff.html`: escaneo de QR con cámara (BarcodeDetector) o pegado manual; modo verificar para boletera externa/pase provisional por folio TD-…, nombre, correo o folio de boletera; dar acceso por personas y entregar add-ons. Rol `staff`/`scanner` o administradores de la organización. | `/api/v2/staff/{me,:org/events/:id/scan,:org/events/:id/lookup,:org/events/:id/orders/:id/access,:org/order-addons/:id/deliver}` |
| **TADAA! Original / metadata** | Admin fija `tadaa_original`, `logo_url`, reparto, reseñas, etc. | `PATCH /api/v2/admin/events/:id/flags` |

**Pruebas:** `npm test` (14 unitarias) y una prueba end-to-end contra Postgres 16 local con 51 verificaciones (Now!, Golden, add-ons, RFC, staff, portales, oferta de baja).
**Otros cambios:** `Permissions-Policy` permite `camera=(self)` para Staff; `/staff.html` redirige a `/experience/staff.html`; login acepta `?next=staff.html`.
**Pendiente:** la app Expo sigue siendo prototipo local (sin Now!/Golden reales); emisión de pases provisionales para eventos de boletera externa sigue el flujo actual de solicitud.

## Fase 3 — sitio fiel a los mockups

- `design/mockups/*.dc.html` son las pantallas aprobadas (escritorio D*, móvil M*), con huecos `{{…}}` para datos reales.
- `node tools/build-vibrante.mjs` las convierte en `web/experience/tv-screens.js` (CI verifica que esté al día).
- `index.html` es la nueva app: `tv-app.js` (motor de plantillas, rutas `#inicio`, `#explorar`, `#evento/<slug>`, `#addons`, `#asientos`, `#now`, `#wallet`, `#pase/<id>`, `#golden/<id>`, `#cuenta`, `#baja`) y `tv-adapters.js` (datos de la API, compra con Clip o simulador, Now!, QR dinámico real, Golden, RFC).
- Escritorio ≥ 900 px usa las pantallas D*; celular usa las M* escaladas al ancho del teléfono.
- Si no hay eventos publicados se muestran los eventos de muestra del diseño, sin venta.
- Páginas anteriores: `inicio-clasico.html`, `evento-clasico.html`; portales de productor/empresa y admin siguen en `app.html` y `admin.html`.
