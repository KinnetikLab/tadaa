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
