# TADAA! BETA 3 — Integración base consolidada

## Qué contiene esta entrega

Esta entrega parte del repositorio `tadaa-beta2-staging.zip` proporcionado por el usuario. Es una actualización aditiva de Beta 2; no elimina las 15 tablas iniciales ni las tablas de Beta 2.

### Implementado en código

- Migración `003_beta3_ticketing_membership.sql`.
- Selección de boletera por evento: `tadaa` o `external`.
- Checkout de prueba interno, sin cargos bancarios.
- Adaptador de Clip Checkout Redireccionado v2, bloqueado por defecto.
- Creación de links de Clip, registro de payment_request_id y verificación server-to-server del estado antes de marcar un pedido pagado.
- Webhook de Clip en `/api/webhooks/clip/checkout`.
- Inventario general y selección opcional de asientos numerados.
- Reserva de asientos con bloqueo transaccional y liberación al expirar la reserva.
- Emisión de boletos y QR con validación de un solo uso.
- Check-in de productor autorizado para eventos de su organización.
- Beneficio de 30 días de membresía por compra elegible en evento `ticketing_mode=tadaa` y `membership_promo_enabled=true`.
- Extensión de la fecha de inicio del beneficio si ya hay acceso activo, para no superponer periodos.
- Avisos in-app programados a 7, 3 y 1 día del vencimiento.
- Membresía individual y acceso por convenio siguen siendo elegibilidades independientes.
- Preferencia de renovación explícita; no se ejecuta un cargo recurrente automático.
- Solicitudes de devolución y flujo administrativo de revisión.
- Reporte de ventas de productor y borradores de liquidación.
- Cashback con reglas administrables y ledger de recompensas.
- Golden Ticket: campañas, participaciones y sorteo auditable con crypto.randomInt.
- TADAA! Awards: programas, nominaciones y votos únicos por usuario.
- Merchandising: catálogo, reservas de stock, pedido y pago mediante el mismo flujo de pedidos.
- Campañas promocionales.
- UI web para Wallet, Golden Ticket, Awards, tienda, panel de productor y administración.
- Categorías de Explorar como botones.
- Confirmación de contraseña en el registro enviada también al servidor.
- Inicio/cierre de sesión con transición ligera; el telón queda reservado a la entrada al login.
- La web pública cambia “Iniciar sesión” por “Ir a mi TADAA!” si la sesión ya existe.

## Migración

El deploy script de xCloud debe ejecutar `npm run db:migrate`. El migrador aplica `003_beta3_ticketing_membership.sql` después de 001 y 002.

No ejecutar nuevamente `db:seed:cdmx-demo`: las 18 producciones ya están en la base de datos del usuario.

## Pagos Clip

La API de Clip Checkout Redireccionado v2 usa `POST https://api.payclip.com/v2/checkout`, autenticación `Authorization: Basic {API_KEY}`, y devuelve `payment_request_id`, `payment_request_url` y estados como `CHECKOUT_CREATED`, `CHECKOUT_PENDING`, `CHECKOUT_EXPIRED` y `CHECKOUT_COMPLETED`.

El backend no confía en la URL de retorno del navegador. El webhook recibido provoca una consulta server-to-server al endpoint de estado de Clip; solo `CHECKOUT_COMPLETED` con monto coincidente marca el pedido como pagado.

**Seguridad por defecto:** `TADAA_CLIP_CHECKOUT_ENABLED` no se activa en esta entrega. El modo `test` es un simulador interno y no cobra. Para habilitar Clip real:
1. Verificar la identidad y cuenta de comercio con Clip.
2. Guardar la API Key de producción desde TADAA! Studio.
3. Confirmar la URL pública HTTPS en `PUBLIC_ORIGIN`.
4. Configurar el webhook `https://tadaa.1wp.site/api/webhooks/clip/checkout` en el producto de Clip.
5. Probar en una cuenta y producto habilitados con una transacción autorizada de bajo importe, revisar el estado y reembolsar desde Clip si corresponde.
6. Solo entonces configurar `TADAA_CLIP_CHECKOUT_ENABLED=true` en xCloud y cambiar el modo a `live` en TADAA! Studio.

La disponibilidad de Sandbox depende del producto y la cuenta de Clip. La FAQ oficial indica que Checkout Transparente no tiene Sandbox; confirmar con Clip el entorno disponible para Checkout Redireccionado v2 antes de probar credenciales de prueba. No se debe asumir que las credenciales test funcionan en `api.payclip.com`.

### Limitaciones honestas de esta entrega

- No hay cobro real probado: no se proporcionaron credenciales ni autorización de transacción real.
- No hay suscripción recurrente automática de Clip conectada. Se registra la preferencia del usuario, pero el cobro recurrente queda desactivado hasta validar el producto/API de suscripciones y su webhook.
- Las devoluciones se solicitan y revisan en TADAA! Studio; la devolución bancaria todavía se ejecuta en el panel/proveedor y debe registrarse después.
- Las liquidaciones de productores se calculan como borrador; no se transfieren fondos.
- Las integraciones de Boletia, Ticketmaster y Fanki son enlaces/fichas externas, no sincronización API certificada.
- Spotify y Maps usan los enlaces guardados por evento; no se incorpora OAuth de Spotify ni una API de rutas avanzada.
- Las notificaciones de membresía son in-app. Envío de email/SMS/push requiere conectar y probar proveedores.
- Las imágenes de eventos se administran por URL; almacenamiento de archivos/R2 sigue pendiente.
- La app Expo conserva su implementación nativa anterior y todavía no tiene paridad funcional completa con los nuevos módulos web. Esta entrega consolida principalmente backend y web.
- Los sorteos, Awards, cashback y tienda tienen flujos de base/API/UI iniciales, pero requieren pruebas de negocio, términos, antifraude y operación antes de uso comercial.

## Variables de entorno relevantes

- `DATABASE_URL`: conexión PostgreSQL.
- `PUBLIC_ORIGIN=https://tadaa.1wp.site`: URL pública HTTPS.
- `TADAA_PRIVATE_BETA=true`: habilita el simulador interno de pagos en beta privada.
- `TADAA_CLIP_CHECKOUT_ENABLED=true`: solo después de completar el checklist de habilitación real.
- `TADAA_SESSION_SECRET`: secreto de sesión y firma QR.
- `TADAA_ENCRYPTION_KEY`: clave de bóveda de integraciones; no rotar manualmente sin migrar/cifrar de nuevo los secretos.
- `TADAA_PLATFORM_FEE_BPS`: comisión de plataforma en puntos base para borradores de liquidación. Si no se configura, se usa 0; no se debe inventar una comisión.

## Despliegue en el mismo xCloud

1. Commit y Push de la rama `beta2-staging` (el instalador no hace commit).
2. Mantener el mismo sitio `tadaa.1wp.site`, Node.js 22 y PostgreSQL existente.
3. El deploy script ejecuta `npm install` y `npm run db:migrate`.
4. Verificar `/api/public/status` y `/api/v2/payment-mode`.
5. Probar registro, convenio, eventos, pedido de prueba, emisión QR y check-in.
6. No activar Clip real hasta completar su checklist.

## Validaciones realizadas en el entorno de construcción

- `npm test`: 8/8 pruebas.
- `npm run syntax`: correcto.
- `node --check` para scripts inline HTML: correcto.
- No se ejecutó la migración contra la base PostgreSQL del usuario.
- No se probó una transacción real de Clip ni el webhook desde la cuenta del usuario.
