# TADAA! Beta 2 — Release de integración web + PostgreSQL (2026-11-18)

> **Estado de esta entrega:** integración técnica de un núcleo funcional para una **beta cerrada**. **No es una boletera comercial completa ni está desplegada automáticamente.** Es código listo para desplegar en un **sitio nuevo de staging xCloud**, ejecutar migraciones y probar los flujos con cuentas ficticias.

## Arquitectura elegida

- Única experiencia pública: `/experience/index.html` con estética Claude (fondos negros, verde lima, animaciones y telón). `/` redirige a esa experiencia.
- Login: `/experience/login.html`; cuenta: `/experience/app.html`; administración: `/experience/admin.html`; presentaciones: `/experience/partner.html?slug=...`.
- El proyecto anterior sigue intacto en `/legacy.html` (incluido su panel de integraciones). No está enlazado desde la web pública.
- Node.js y `pg`; migración aditiva `server/migrations/002_beta2_core.sql` (no borra las 15 tablas iniciales).
- Sesiones de usuario en PostgreSQL con tokens aleatorios, cookies HttpOnly, CSRF y contraseñas `scrypt`. Administrador anterior conserva su inicio de sesión.
- `TADAA_PRIVATE_BETA=true` obliga a que los cobros simulados y las validaciones QR solo se ejecuten en beta privada.
- Bóveda de integraciones cifrada, por defecto fuera de la carpeta de despliegue en `$HOME/tadaa-private`. Configurar `DATA_DIR` persistente explícito si es posible.

## Qué funciona en esta entrega (con PostgreSQL + módulos instalados)

| Función | Implementación |
|---|---|
| Registro e inicio de sesión con email/contraseña | API y UI; contraseñas `scrypt`, sesiones persistentes, control CSRF |
| Registro por membresía | Solicitud + orden de $100 MXN; activación **solo tras pago de prueba interno** |
| Registro por empresa | Padrón previo, ID+nombre, solicitud; **requiere aprobación de gerente** |
| Portal empresas | Importación separada ALTAS y BAJAS CSV/XLSX, revisión, doble confirmación, historial y aprobación de colaboradores |
| Portal productores | Propuesta de eventos en estado borrador, revisión/activación desde administración |
| Cartelera y detalles | Eventos publicados desde PostgreSQL, cupos/precios de tipos de entrada, imágenes, créditos/instrucciones opcionales, Spotify/Maps como enlaces |
| TADAA! Picks + Me interesa | Filtros y favoritos asociados a usuario |
| Reservas y pedidos | Inserción transaccional, cupos bloqueados, expiración (15 min) y liberación |
| Pago de prueba | **Simulador interno sin cargos**, idempotente por pedido; no usa Clip todavía |
| Boletera propia inicial | Tipos de entrada, emisión de boletos de prueba tras pago simulado, QR firmado de 45 s, validación única y registro de acceso |
| Administración | Organizaciones/convenios, eventos, publicar, inventario, check-in, presentaciones, propuestas, credenciales cifradas |
| Presentaciones partners | Páginas tipo slides con menú hover izquierdo, solicitud de incorporación y solicitud de cita almacenadas |
| Preferencias | Gustos seleccionados, guardados en perfil |
| Captación de alertas | Registro de email e intereses en base de datos, sin envío automático todavía |

## Funciones que NO están completas y **no deben anunciarse como reales**

- Checkout real Clip, webhooks, conciliación, reembolsos, recurrencia real y switch activo a producción. Admin guarda por separado credenciales de prueba y producción, pero **modo LIVE está bloqueado**.
- Google/Apple OAuth, verificación real de correo y SMS, recuperación automatizada y control de fraude avanzado.
- Integración comercial con Ticketmaster, Boletia y Fanki: requiere acceso contratado y disponibilidad de API.
- Mapas interactivos/navegación GPS integrados: por ahora enlace a Google Maps provisto por evento; Spotify: enlace externo.
- Apple Wallet, pases para entradas externas, transferencia segura de tickets, selección visual de butacas, precios dinámicos, controles antifraude completos y liquidación a productores.
- Golden Ticket, TADAA! Awards, cashback, puntos, mini juegos, tienda merch y campañas: **parte del esquema preparada** pero no UX/API completa. Sorteos solo después de revisar legalidad de sus mecánicas.
- Agenda de citas con disponibilidad verificada de Calendar/Calendly: por ahora solicita y guarda fecha/horario, **sin confirmación automática**.
- App React Native: sigue siendo el prototipo SDK 58 anterior. **No está sincronizada aún con estas API**; esta release integra la web. No convertir a WebView.
- Falta crear y publicar términos/privacidad vigentes, correos de doble opt-in, controles anti abuso completos, pruebas de restauración y copias periódicas.

## Deploy seguro a xCloud (sin sobrescribir la instancia existente)

1. Antes de tocar datos: respaldo PostgreSQL reciente y verificar un proceso de restauración. También respaldar la bóveda y su clave por separado.
2. Desde GitHub Desktop subir la rama `beta2-staging` (el instalador la crea; no modifica `main`).
3. En xCloud **crear un sitio NUEVO** Node.js 22, Nginx, GitHub rama `beta2-staging`, modo SSR, puerto 3000 y PostgreSQL **nuevo**. No conectar la misma base de datos del sitio antiguo.
4. Crear secretos nuevos para staging con `npm run setup:secrets`; las claves antiguas se expusieron en una captura y necesitan rotarse con cuidado en el entorno existente. Nunca publicar el archivo de secretos.
5. En Environment del sitio nuevo configurar `NODE_ENV=production`, `PORT=3000`, `PUBLIC_ORIGIN=https://SUBDOMINIO_STAGING`, `TADAA_PRIVATE_BETA=true`, las tres variables de secretos y la conexión PostgreSQL propia del sitio (xCloud las puede crear). **Activar Basic Auth antes de invitar usuarios**.
6. En Git → Deploy Script usar:

```bash
set -a
. ./.env
set +a
$XCLOUD_NPM install --no-audit --no-fund
$XCLOUD_NPM run db:migrate
```

Si xCloud ya exporta variables al script, el `source .env` puede omitirse; no usarlo si el archivo tiene formato no compatible con shell. `npm install` descargará `pg`, `qrcode` y `exceljs`.
7. Comprobar `https://SUBDOMINIO_STAGING/api/v2/health` (respuesta `ok:true`) y luego crear una empresa + evento desde `/experience/admin.html`. Los eventos de productores comienzan como **draft**.
8. Registrar usuario ficticio, aprobar colaborador desde portal si usa convenio, hacer pago de **prueba** y comprobar que se emite un QR verificable una vez.
9. Probar con dos dispositivos/navegadores y restaurar backup en servidor independiente antes de abrir al público.

## Credenciales, privacidad y seguridad

- **Rotar** la contraseña del administrador, clave de sesión y credenciales de BD ya expuestas; NO regenerar la clave AES en un entorno con datos en bóveda sin migración segura (en este proyecto el usuario confirmó que la bóveda no contiene credenciales reales, pero igualmente respáldala antes).
- No guardar claves en GitHub ni enviarlas por chat.
- Solo emplear **datos ficticios** en staging y no subir padrones reales de empleados hasta tener privacidad, autorización, validación de identidad y controles de producción probados.
- `TADAA_PRIVATE_BETA=true` habilita simulación de pagos internos y check-in de entradas de prueba; no habilita Clip LIVE.
- Evitar apuntar frontend de staging a backend de producción.
- Las tablas de 002 son aditivas; **no ejecutar la migración sobre la base de producción actual sin backup y revisión**.

## Medidas de arte oficiales propuestas

- Catálogo: 900 × 1290 px (3:4.3).
- Imagen del evento: 1600 × 1200 px (4:3).
- Banner panorámico: 1920 × 1080 px.
- Imagen superior de boleto: 1200 × 520 px.
- Pantalla móvil: 1080 × 1350 px.
- Miniatura: 480 × 600 px.
- OpenGraph: 1200 × 630 px.

## Rutas API principales

- Públicas: `GET /api/v2/health`, `GET /api/v2/catalog`, `GET /api/v2/events/:id`, `GET /api/v2/organizations`, `GET /api/v2/partners/:slug`, `POST /api/v2/alerts`.
- Identidad: `POST /api/v2/auth/register`, `POST /api/v2/auth/login`, `GET /api/v2/auth/me`, `POST /api/v2/auth/logout`, `PATCH /api/v2/profile`.
- Usuario: `GET|POST /api/v2/favorites`, `POST /api/v2/membership/checkout`, `POST /api/v2/membership/cancel`, `GET|POST /api/v2/orders`, `POST /api/v2/checkout/test-pay`, `GET /api/v2/tickets`, `GET /api/v2/tickets/:id/qr`.
- Organización gerente: `GET /api/v2/orgs/:id/employees`, `GET|POST /api/v2/orgs/:id/imports`, `POST /api/v2/orgs/:id/imports/:batch/confirm`, `POST /api/v2/orgs/:id/employees/:id/approve`, `GET|POST /api/v2/orgs/:id/events`.
- Admin: `GET /api/v2/admin/dashboard`, `POST /api/v2/admin/partners`, `POST /api/v2/admin/events`, `PATCH /api/v2/admin/events/:id`, `POST /api/v2/admin/tickets`, `POST /api/v2/admin/checkin`, `GET|PUT /api/v2/admin/payment-config`, `POST /api/v2/admin/presentations`.
- Partners: `POST /api/v2/partners/:slug/apply`, `POST /api/v2/partners/:slug/meeting`.

## Tests ejecutados en la entrega

- `node --check` de scripts de servidor y experiencia web.
- 4 pruebas existentes en `config.test.mjs` — todas aprobadas.
- **No** se pudo instalar paquetes npm en el contenedor de creación; por tanto no se validaron consultas reales contra PostgreSQL, migración ejecutada ni renderización en navegador. **Solo staging y pruebas funcionales determinan el go/no-go.**
