# TADAA! · v0.6 — Administrador de integraciones seguras

**Esta entrega añade una base inicial de infraestructura para despliegue y PostgreSQL, además del backend real para guardar y probar credenciales.** Conserva el prototipo visual v0.5.1 para catálogo, registros, solicitudes, Wallet y checkout, **que siguen en modo demostración**. Introducir claves no habilita automáticamente cobros, facturas, OTP, envíos ni cuentas reales: faltan los módulos transaccionales y la base de datos operacional.

## Estructura

- `web/` — landing, ficha de evento, teaser, registro de demo, administración visual e integraciones (interfaz).
- `server/` — Node.js 22: API administrativa, inicio de sesión, bóveda cifrada AES-256-GCM, pruebas de solo lectura, auditoría y base PostgreSQL inicial con migraciones.
- `mobile/` — app Expo de demostración preparada con perfiles EAS preview/production y punto de conexión público (`api-client.js`). Claves secretas nunca en Expo.
- `docs/` — instalación para macOS + xCloud + GitHub + Expo, seguridad y estado real de los módulos.
- `.github/` — CI para revisar sintaxis y pruebas.

## Primer arranque en Mac (desarrollo, no producción)

1. Instala Node.js 22 o superior.
2. En Terminal, desde la raíz del proyecto: `npm run setup:secrets`. El comando solicita contraseña administrativa y genera `.secrets-generated.env`. **Nunca subas ese archivo.**
3. Carga esas variables en tu terminal de pruebas o en el panel Environment de xCloud; consulta `docs/INSTALACION_MAC_XCLOUD_V06.md`.
4. `npm start`; abre `http://localhost:3000` y entra en **Admin demo → Integraciones y API**.
5. En producción requiere HTTPS y `PUBLIC_ORIGIN` exacto.

## Estado de seguridad

- Credenciales guardadas cifradas **en el servidor**, jamás en `localStorage`, en el bundle Expo ni en el JSON de la demo.
- Acceso admin mediante contraseña con hash scrypt, sesión HttpOnly/SameSite y CSRF para mutaciones.
- Formularios de proveedor enmascarados; para cambiar una clave, introducir la nueva. El botón **Probar** hace únicamente consultas GET contra hosts oficiales prefijados.
- La bóveda por defecto se guarda en un directorio privado del servidor. Para xCloud, **configura `DATA_DIR` a un volumen/ruta persistente fuera del repositorio** y respalda esos datos y la clave de cifrado por separado.
- El resto de las funciones todavía utiliza información local ficticia; **no introducir datos verdaderos de clientes hasta que exista backend operacional y revisión de seguridad**.

## Base de datos PostgreSQL

En xCloud selecciona PostgreSQL como motor de base de datos al crear el sitio Node.js. xCloud genera `DATABASE_URL`. Ejecuta `npm run db:migrate` para crear el esquema inicial. La API comprueba la conexión en `/api/public/status`. El esquema no implica que los módulos de negocio ya estén implementados.

## Documentación

- **`docs/INSTALACION_MAC_XCLOUD_EXPO_GITHUB_v061.md`** — pasos simplificados de publicación en Mac, GitHub, xCloud, PostgreSQL y Expo.
- **`docs/INSTALACION_MAC_XCLOUD_V06.md`** — guía de la versión anterior.
- **`docs/SEGURIDAD_V06.md`** — qué datos son secretos, backups y limitaciones.
- **`docs/MODULOS_Y_PENDIENTES_V06.md`** — matriz honesta de lo que funciona y de lo que falta.
