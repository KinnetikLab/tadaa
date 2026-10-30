# TADAA! v0.6 — instalación completa desde macOS

## 0. Qué contiene esta versión

TADAA! v0.6 **sí** incorpora un servidor Node.js, acceso privado a la configuración de integraciones, almacenamiento cifrado de claves y pruebas de conexión de solo lectura. La web, los perfiles de usuario, pedidos, Wallet, reservas y checkout mantienen su funcionamiento de prototipo local: **no se convierten en productos reales por escribir claves en el administrador**. No utilizar información personal o bancaria de clientes en este entorno.

## 1. Preparar el Mac

- Instala **GitHub Desktop** desde https://desktop.github.com/.
- Instala **Node.js 22 o superior** desde https://nodejs.org (o con tu gestor de versiones preferido).
- Para la app iPhone instala **Xcode** desde la App Store y sus herramientas de línea de comandos, y utiliza **Expo EAS** para las compilaciones en la nube.
- En Terminal:

```bash
node -v
npm -v
```

Descomprime **TADAA_v0.6_Proyecto_Completo.zip**. Debe quedar UNA carpeta `tadaa-v0.6/` con `web`, `server`, `mobile`, `docs` y `package.json` en la raíz.

## 2. Crear secretos de instalación (una sola vez por entorno)

Desde la **carpeta raíz** del proyecto:

```bash
cd /ruta/donde/descomprimiste/tadaa-v0.6
npm run setup:secrets
```

El script pedirá una contraseña larga de administrador (mínimo 14 caracteres; no se mostrará al escribirla). Creará `.secrets-generated.env` con **tres valores**:

- `TADAA_ENCRYPTION_KEY`: clave AES-256 utilizada para cifrar configuraciones.
- `TADAA_SESSION_SECRET`: clave de sesiones HTTP.
- `TADAA_ADMIN_PASSWORD_HASH`: hash scrypt de la contraseña; la contraseña no se guarda.

Guarda esos tres valores en un gestor de contraseñas seguro. No compartas el contenido en el chat, no lo envíes por correo, no lo subas a GitHub. Si pierdes `TADAA_ENCRYPTION_KEY`, **la bóveda cifrada existente no puede recuperarse**.

Para iniciar una prueba local en tu Mac, puedes cargar el archivo en el entorno de Terminal:

```bash
set -a
source ./.secrets-generated.env
set +a
export PORT=3000
export PUBLIC_ORIGIN=http://localhost:3000
export DATA_DIR="$(pwd)/server/private-data"
npm start
```

Abre http://localhost:3000. Pulsa **Admin demo** y escribe la contraseña que elegiste. En **Integraciones y API** podrás guardar claves en el backend. En pruebas locales, `DATA_DIR` está ignorado por Git. En xCloud debe quedar en almacenamiento privado persistente.

Para verificar el código sin arrancar el servidor:

```bash
npm run syntax
npm test
```

## 3. Subir a GitHub privado

1. Abre GitHub Desktop y ve a **File → Add Local Repository**.
2. Selecciona la carpeta `tadaa-v0.6`. Si GitHub Desktop propone crear el repositorio local, acéptalo.
3. Haz el primer commit, por ejemplo **TADAA v0.6 — Integraciones**.
4. Pulsa **Publish repository** y marca **Keep this code private**.
5. En GitHub, verifica que **NO aparecen** `.secrets-generated.env`, `.env` ni `server/private-data/`.
6. En adelante, haces cambios en tu Mac, commit y push; GitHub conserva el historial.

## 4. Conectar GitHub con xCloud (web + API)

**Importante: ya no es un sitio estático.** En xCloud debes desplegar la raíz del repo **como aplicación Node.js con proceso SSR**, no como `web/` estático. xCloud documenta Git Deploy de Node.js con `npm run start`, puerto y variables de entorno.

1. xCloud → servidor → **Add New Site → Deploy via Git**.
2. Conecta el proveedor GitHub y elige el repositorio privado de TADAA! y la rama `main`.
3. Selecciona/valida tipo **Node.js** y modo **SSR (Node process)**.
4. Project root: raíz del repositorio (donde está `package.json`).
5. **Build/deploy:** `npm install` (no hace falta build para esta versión).
6. **Start:** `npm start`.
7. **Puerto:** `3000` (coincide con `PORT`).
8. Primer destino: subdominio de **staging** y HTTPS configurado por xCloud.
9. En Environment coloca las variables generadas con `npm run setup:secrets` y estas adicionales:

```dotenv
NODE_ENV=production
PORT=3000
PUBLIC_ORIGIN=https://TU-DOMINIO-DE-STAGING.example
DATA_DIR=/RUTA-ABSOLUTA-PRIVADA-Y-PERSISTENTE/tadaa
TADAA_ENCRYPTION_KEY=PEGAR_VALOR_GENERADO
TADAA_SESSION_SECRET=PEGAR_VALOR_GENERADO
TADAA_ADMIN_PASSWORD_HASH=PEGAR_HASH_GENERADO
```

**No utilices literalmente los valores de ejemplo.** `PUBLIC_ORIGIN` debe ser exactamente el origen HTTPS de la página (sin barra final). Asegúrate de que el usuario Linux del sitio pueda escribir en `DATA_DIR`, que debe quedar **fuera de la carpeta publicada y del repositorio que xCloud reemplaza en cada despliegue**. Permisos recomendados: carpeta `0700`, archivos `0600`.

10. Activa HTTPS y, mientras sea prototipo, **Basic Auth en xCloud para todo staging** además de la contraseña de admin.
11. Abre `https://TU-DOMINIO/api/public/status`. Debe indicar `server:true` y `version:"0.6"`, sin mostrar credenciales.
12. Entra en **Admin → Integraciones y API**. Para cada proveedor, guarda las claves, selecciona ambiente de pruebas y pulsa **Probar conexión**.

GitHub → xCloud **Push to deploy** se puede habilitar una vez verificado el primer arranque. Si modificas variables de entorno, xCloud reinicia el proceso Node. Si el repositorio cambia, tus secretos deben permanecer en Environment y los datos en la carpeta persistente.

Fuente: https://xcloud.host/docs/how-to-deploy-a-node-js-application/

## 5. Integraciones que podrás configurar desde el panel

| Servicio | Datos del panel | ¿Qué prueba v0.6? |
|---|---|---|
| Clip Checkout Transparente | API Key, pruebas/producción | GET de transacciones sin cobro |
| Twilio Verify | API Key SID, API Key Secret, Verify Service SID | Consulta del servicio; sin SMS |
| Resend | API Key, remitente y nombre | Lista de dominios; sin envío |
| Google Geocoding | API Key de servidor | Geocodifica un CP mexicano |
| Catálogo de colonias | Origen, versión | Se guarda metadata; falta cargar catálogo SEPOMEX |
| Facturama | Usuario y contraseña, sandbox/producción | Consulta catálogo del SAT; sin timbrado |
| Envia.com | API token, CP origen, pruebas/producción | Lista de transportistas; sin crear guías |
| Almacenamiento S3/R2 | Bucket, región, credenciales | Guarda configuración; aún falta el adaptador de documentos |
| Expo Push | Project ID y token opcional | Guarda configuración; aún no envía notificaciones |

**ATENCIÓN:** ciertos GET a APIs (como Google Maps) generan consumo que puede ser facturable por su proveedor. Las pruebas NO realizan pagos con Clip, envían correos, generan facturas ni crean envíos.

## 6. PostgreSQL: no pegar DATABASE_URL en el navegador

La conexión de PostgreSQL forma parte del **arranque del backend**, no del formulario público. Puedes provisionar PostgreSQL en xCloud y configurar `DATABASE_URL` en sus variables de entorno **cuando exista el esquema y la API operacional de usuarios/pedidos**. La v0.6 muestra si la variable existe pero **aún NO abre ni utiliza la base de datos**. Esto evita vender la impresión de que guardar credenciales habilitó las cuentas de clientes.

Cuando incorporemos PostgreSQL deberán añadirse migraciones, índices únicos para email/teléfono/matrícula, hashing seguro, verificaciones OTP reales, permisos y respaldos programados externos. Nunca colocar credenciales de PostgreSQL en Expo ni en JS del navegador.

## 7. Expo en macOS

```bash
cd mobile
npm install
npx expo-doctor@latest
npx expo start
```

Si has instalado Xcode y el SDK es compatible, presiona `i` para abrir el simulador iOS. Para configurar EAS:

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform ios --profile preview
npx eas-cli@latest build --platform android --profile preview
```

En `mobile/.env.example` hay una URL pública `EXPO_PUBLIC_TADAA_API_URL`. Puedes copiarla a `.env` de desarrollo cuando tengas un dominio HTTPS real. **No introduzcas secretos de Clip, Google, Twilio, Facturama ni S3 en variables `EXPO_PUBLIC_`**: esas variables son visibles dentro de la app compilada. Las credenciales de firma iOS/Android se configuran mediante **Expo EAS** y Apple/Google, no en el administrador web.

La app aún es un prototipo local y no sincroniza cuentas ni Wallet con el servidor. El archivo `mobile/api-client.js` contiene el punto inicial de conexión, sin usarse todavía para registros reales.

## 8. Si algo falla

- **Servidor no inicia:** verifica Node >=22, `PUBLIC_ORIGIN`, `TADAA_*` y que `DATA_DIR` sea escribible.
- **Admin pide contraseña:** es la que elegiste con `npm run setup:secrets`, no la de GitHub, xCloud o Clip.
- **Integraciones aparecen deshabilitadas en el HTML independiente:** normal; una vista previa estática no puede guardar secretos.
- **Clave guardada pero no validada:** revisa ambiente, permisos API, verificación de identidad y servicio habilitado.
- **No aparecen pedidos entre web y app:** todavía es un prototipo; requiere backend de usuarios y reservas.
- **Bóveda da error tras cambiar la clave de cifrado:** restablece la clave anterior desde el respaldo; cambiarla sin migración vuelve ilegibles los datos guardados.
- **No llega SMS o correo:** los formularios de contacto todavía están simulados; guardar una clave no conecta automáticamente los flujos.

Consulta `docs/SEGURIDAD_V06.md` y `docs/MODULOS_Y_PENDIENTES_V06.md` antes de habilitar clientes reales.
