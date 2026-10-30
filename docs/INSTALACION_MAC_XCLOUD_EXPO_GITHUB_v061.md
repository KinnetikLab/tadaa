# TADAA! v0.6.1 — Guía de publicación sencilla (Mac + GitHub + xCloud + PostgreSQL + Expo)

## Qué deja preparado esta entrega

- Servidor Node.js compatible con el despliegue Git de xCloud.
- Dependencia `pg` y comprobación real de conexión PostgreSQL.
- Migración inicial repetible para crear tablas base de usuarios, organizaciones, eventos, inventario de boletos, reservas, pedidos, pagos, Wallet, tickets y auditoría.
- `npm run db:migrate` para aplicar las migraciones sin abrir pgAdmin ni escribir SQL.
- Identificadores iniciales Expo `com.tadaa.app`, perfiles EAS preview/production.
- CI de GitHub para validar sintaxis y pruebas.

**Límite importante:** esto prepara la infraestructura y el esquema inicial; no convierte por sí solo el prototipo en un sistema comercial terminado. Los flujos de registro/login real, checkout, pagos, emisión de boletos, Wallet y sincronización móvil todavía requieren implementación y pruebas. La app móvil aún consulta solamente el estado público de la API.

## A. Subir a GitHub (una sola vez)

1. Descomprime el ZIP y abre la carpeta `tadaa-v0.6`.
2. En GitHub Desktop, inicia sesión.
3. Selecciona **File → Add Local Repository** y elige esa carpeta.
4. Si GitHub Desktop pregunta si deseas crear el repositorio, acepta.
5. Nombre sugerido: `tadaa-platform`; visibilidad: **Private**.
6. Pulsa **Publish repository**.
7. En la pestaña Changes, confirma que `.env`, `.secrets-generated.env`, `node_modules` y `server/private-data` no aparezcan para subir.

El workflow `.github/workflows/validate.yml` ejecutará las comprobaciones en cada push y pull request.

## B. Preparar PostgreSQL administrado en xCloud

Tu servidor ya utiliza Nginx, que es el stack compatible. xCloud documenta estos requisitos para PostgreSQL administrado: Docker Engine 28 o posterior, permisos para administrar servicios y que no exista ya la app PostgreSQL de catálogo en el mismo servidor.

1. Entra a xCloud y abre tu servidor Nginx.
2. Abre **Services** (o el apartado de servicios del servidor) y busca **Managed PostgreSQL**.
3. Si aparece como disponible, instálalo/actívalo y espera a que el estado indique **Ready**.
4. Si no aparece o falla por Docker, solicita/ejecuta la actualización a Docker Engine 28+ desde la administración de xCloud. No cambies a OpenLiteSpeed.
5. No crees tablas manualmente en pgAdmin: el despliegue del sitio las creará con la migración.

Nota: xCloud indica que sus backups de sitio no incluyen las bases PostgreSQL administradas. Programa exportaciones periódicas desde pgAdmin y conserva una copia fuera del servidor.

## C. Desplegar el repositorio desde xCloud

1. En el servidor, selecciona **Add New Site → Deploy via Git**.
2. Conecta GitHub si todavía no está conectado y autoriza el repositorio privado `tadaa-platform`.
3. Selecciona la rama `main`.
4. App Type: **Node.js**.
5. Database engine: **PostgreSQL**. xCloud debe crear la base y el usuario automáticamente y añadir `DATABASE_URL` a las variables del sitio.
6. Serving mode: **SSR (Node process)**.
7. Node version: **22** (o una versión compatible superior).
8. Start command: `npm start`.
9. Port: `3000` (o el puerto asignado por xCloud; la app lee `PORT`).
10. Build/deploy command: `npm install && npm run db:migrate`.
11. Revisa el resumen y pulsa **Deploy**.

Si la interfaz de xCloud no ofrece la opción PostgreSQL, no continúes con un sitio que no tenga `DATABASE_URL`: primero hay que dejar Managed PostgreSQL en estado Ready.

## D. Variables de entorno del sitio

En xCloud → sitio → **Environment**, establece:

```dotenv
NODE_ENV=production
PORT=3000
PUBLIC_ORIGIN=https://TU-DOMINIO-DE-PRUEBAS
DATA_DIR=/RUTA/PRIVADA/PERSISTENTE/tadaa-data
TADAA_ENCRYPTION_KEY=PEGA_LA_CLAVE_GENERADA
TADAA_SESSION_SECRET=PEGA_EL_SECRETO_GENERADO
TADAA_ADMIN_PASSWORD_HASH=PEGA_EL_HASH_GENERADO
```

`DATABASE_URL` debe ser la que xCloud generó al seleccionar PostgreSQL. No la inventes ni la sustituyas por una URL local.

Para generar las tres variables de seguridad en tu Mac, abre Terminal en la carpeta del proyecto y ejecuta:

```bash
npm run setup:secrets
```

Se genera `.secrets-generated.env`. Abre el archivo localmente, copia cada valor al panel Environment de xCloud y guarda. No subas ese archivo a GitHub ni lo envíes por correo/chat. Después guárdalo en un gestor seguro o bórralo solo cuando tengas una copia segura de las claves.

**DATA_DIR:** pide a xCloud la ruta persistente privada del sitio o usa la ruta privada que el panel documente. No uses una ruta temporal ni una carpeta pública dentro de `web/`.

## E. Comprobar que la base se creó

Después del deploy, abre:

`https://TU-DOMINIO-DE-PRUEBAS/api/public/status`

Debe mostrar `server: true` y `database.configured: true`, `database.connected: true`. `ordersMode` y `checkoutMode` seguirán en `demo` hasta que terminemos los flujos transaccionales.

Si la migración falló, abre los logs del despliegue. No ejecutes SQL manualmente. Corrige primero la causa y vuelve a desplegar; las migraciones son idempotentes y la tabla `schema_migrations` evita repetir una migración aplicada.

## F. Expo en Mac

1. Abre Terminal y entra en `tadaa-v0.6/mobile`.
2. Ejecuta:

```bash
npm install
npx eas-cli login
npx eas-cli build:configure
```

3. Si EAS solicita vincular un proyecto, confirma con tu cuenta Expo. EAS añadirá el `projectId` real al proyecto; no inventes ese ID.
4. En Expo → proyecto → Environment variables, crea para `preview` y `production`:
   - Nombre: `EXPO_PUBLIC_TADAA_API_URL`
   - Valor: URL HTTPS de tu backend, sin `/` al final.
   - Visibilidad: Plain text (es una URL pública, no una contraseña).
5. Para una primera prueba interna:

```bash
npx eas-cli build --platform all --profile preview
```

6. Para tiendas, solo después de completar pruebas y tener Apple Developer Program y Google Play Console:

```bash
npx eas-cli build --platform all --profile production
```

Los identificadores iniciales son `com.tadaa.app` en ambas plataformas. Hay que verificar disponibilidad antes de publicar; si ya están ocupados, cambia ambos identificadores antes de la primera publicación. No cambies el identificador después de publicar una app en tiendas.

## G. Qué debes hacer tú y qué queda de desarrollo

**Acciones tuyas:** publicar el repositorio privado, activar Managed PostgreSQL si está disponible, conectar el repositorio en xCloud, pegar las variables secretas, vincular EAS y ejecutar los builds.

**Trabajo técnico pendiente antes de operar con clientes reales:** autenticación y recuperación de cuenta, endpoints de usuarios/eventos/reservas/pedidos, reglas de inventario y concurrencia, checkout y webhooks de Clip, emisión/validación QR, Wallet, notificaciones, conexión móvil completa, paneles conectados a PostgreSQL, backups/restauración y pruebas de seguridad.

No cargues datos personales reales ni habilites cobros reales hasta completar esas fases.

## Documentación oficial

- xCloud Node.js Git deployment: https://xcloud.host/docs/how-to-deploy-a-node-js-application/
- xCloud Managed PostgreSQL: https://xcloud.host/docs/install-managed-postgresql-and-pgadmin-in-xcloud/
- Expo EAS first build: https://docs.expo.dev/build/setup/
- Expo environment variables: https://docs.expo.dev/eas/environment-variables/
