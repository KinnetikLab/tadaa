# TADAA! v0.5.1 — Guía de instalación para macOS

**Objetivo:** alojar **una demostración privada** en xCloud, guardar web y app en un repositorio privado de GitHub, y probar la app en un simulador de iPhone (o teléfono de prueba) mediante Expo. Esta versión sigue siendo un prototipo local: **no incluye servidor de usuarios, base de datos real, OTP real ni cobros Clip reales**.

## A. Antes de empezar: instala las herramientas en tu Mac

1. **GitHub Desktop:** https://desktop.github.com/ . Inicia sesión con tu cuenta de GitHub.
2. **Node.js 22 LTS**, desde el instalador oficial para macOS: https://nodejs.org/ . Evita cambiar de versión de Node sin comprobar la compatibilidad del proyecto Expo SDK 54.
3. **Xcode:** desde Mac App Store; ábrelo una vez, acepta los acuerdos y ve a **Xcode → Settings → Locations** para elegir las Command Line Tools. Después, desde **Xcode → Settings → Components**, instala al menos un simulador iOS.
4. **Expo:** crea una cuenta en https://expo.dev/ . También puedes instalar Expo Go en un iPhone compatible para pruebas cuando la versión del SDK lo permita.
5. **Homebrew (opcional):** https://brew.sh/ . Si ya lo tienes, `brew install watchman` puede mejorar la detección de cambios en proyectos Expo SDK 54.

Abre **Terminal** (⌘ + espacio → escribe «Terminal») y comprueba:

```bash
node -v
npm -v
git --version
xcodebuild -version
```

Si `git` o las herramientas de Xcode no están disponibles, ejecuta `xcode-select --install` y termina su instalación. Si `xcodebuild` muestra una advertencia de licencia, sigue la instrucción de Xcode.

## B. Extrae correctamente el proyecto

Descarga el archivo **TADAA_v0.5.1_Proyecto_GitHub_xCloud_Expo.zip** (o el paquete Mac actualizado). Descomprímelo desde Finder; debe aparecer una sola carpeta principal similar a **`tadaa-v0.5.1`**. Contiene:

```text
tadaa-v0.5.1/
├── web/           # HTML, CSS, JS, archivos gráficos y admin demo
├── mobile/        # React Native + Expo SDK 54
├── docs/          # Guías de operación, pruebas y seguridad
├── .github/       # Comprobaciones de repositorio
└── .gitignore     # Excluye archivos secretos y temporales
```

**No subas el ZIP sin extraerlo.** Puedes mover la carpeta al directorio `~/Documents/Proyectos` (o donde prefieras).

## C. Publicar en GitHub desde Mac (sin terminal)

1. Abre **GitHub Desktop** → **File → Add Local Repository** y selecciona la carpeta raíz **`tadaa-v0.5.1`**, **no** `web` ni `mobile`.
2. Si indica que no existe un repositorio, pulsa **Create a Repository Here**.
3. Antes de confirmar, revisa el panel de cambios. Nunca incluyas `.env`, bases de clientes, contraseñas, certificados ni claves de Clip, Apple o Google.
4. Confirma con el mensaje `TADAA v0.5.1 · primer prototipo privado`.
5. Pulsa **Publish Repository**. Ponle, por ejemplo, `tadaa-platform` y activa **Keep this code private**.
6. En GitHub web verifica la presencia de `web/`, `mobile/`, `docs/`, `.github/` y `.gitignore`.

Luego, el trabajo habitual será: **editar → Commit → Push origin**. El despliegue web podrá actualizarse automáticamente desde `main`.

Guía oficial: https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-an-existing-project-to-github-using-github-desktop

## D. Ver la web localmente en macOS

Desde Terminal, entra a la carpeta raíz. Un ejemplo si la dejaste en Descargas:

```bash
cd ~/Downloads/tadaa-v0.5.1
cd web
python3 -m http.server 8080
```

Abre `http://localhost:8080` en Safari o Chrome. Para apagar el servidor presiona **Ctrl+C**. Si tu Mac no tiene Python 3, puedes usar desde `web/` el comando `npx --yes serve -l 8080`, que requiere conexión a Internet la primera vez.

**Atención:** este acceso local no pone en marcha usuarios, Clip ni la API. Es una demo de interfaz.

## E. Conectar GitHub con xCloud

1. En xCloud elige el **equipo** y servidor donde se alojará el proyecto. En **Git Providers**, conecta GitHub con acceso exclusivo al repositorio privado `tadaa-platform`.
2. En el servidor selecciona **Add New Site → Deploy via Git**.
3. Selecciona repositorio `tadaa-platform` y rama `main`.
4. Ajusta el modo a **Static** (la web de v0.5.1 **no** es Next.js ni SSR).
5. Configura **Web root / Build output directory: `web`**. xCloud debe servir solo la carpeta `web/`; **no** la raíz del repositorio ni `mobile/`.
6. No se requiere comando de compilación web. Los archivos de salida ya están incluidos: `web/index.html`, `web/app.js`, `web/data.js`, `web/styles.css`, `web/assets/`.
7. Usa un **subdominio temporal** como `demo.tu-dominio.com`. Activa SSL/HTTPS y **Basic Authentication** para proteger **todo** el sitio, incluido el admin demo.
8. Activa **Push to deploy** después de verificar que las rutas públicas son correctas. Haz un commit pequeño en GitHub Desktop para comprobar que el cambio aparece en xCloud.

Si xCloud muestra un error de acceso al repositorio privado, revisa la autorización de la GitHub App y los **Deploy Keys**. Nunca copies una clave privada en GitHub.

Guías oficiales:
- https://xcloud.host/docs/how-to-integrate-a-git-provider-with-xcloud/
- https://xcloud.host/docs/auto-deploy-static-website-github-xcloud/

## F. Ejecutar la app Expo en tu Mac

En Terminal, desde el directorio raíz del proyecto:

```bash
cd mobile
npm install
npx expo-doctor@latest
npx expo start
```

Una vez que arranque Expo:

- Pulsa **`i`** para abrir el simulador iOS configurado en Xcode.
- Para probarla en un iPhone físico compatible, utiliza Expo Go y el QR de la terminal. El Mac y el iPhone normalmente deben estar en la misma Wi‑Fi y, dependiendo de la versión de Expo Go, puede hacer falta iniciar sesión en la misma cuenta de Expo.
- **Expo SDK 54:** si el Expo Go actual es incompatible, no actualices automáticamente dependencias mayores. La alternativa de desarrollo es probar un **Development Build** tras revisar `expo-doctor` y tener Xcode correctamente configurado.

Opcional para proyectos de desarrollo nativo local (requiere las herramientas de Xcode y puede implicar instalar dependencias):

```bash
npx expo install expo-dev-client
npx expo run:ios
```

**No se ha verificado la compilación nativa del código incluido.** Si aparece un error, conserva el texto de Terminal y revisaremos el paquete y sus dependencias antes de modificar el SDK.

Referencia Expo: https://docs.expo.dev/workflow/ios-simulator/

## G. Crear builds de prueba con Expo EAS

Desde la carpeta `mobile/`:

```bash
npm install -g eas-cli
eas login
eas whoami
eas build:configure
```

Después podrás solicitar una compilación interna Android:

```bash
eas build --profile preview --platform android
```

Para una compilación **iOS de dispositivo físico** necesitas configurar el identificador definitivo, firma y certificados de Apple. En general, **EAS necesita acceso a una cuenta Apple Developer de pago** para firmar y distribuir esos builds. Antes de compilar, cambia los valores **de demostración** de `mobile/app.json`:

```json
"bundleIdentifier": "com.ejemplo.tadaa.demo",
"package": "com.ejemplo.tadaa.demo"
```

por identificadores únicos de tu organización, elegidos cuidadosamente porque son la identidad estable de la app.

Una vez configurados:

```bash
eas build --profile preview --platform ios
```

**Diferencia importante:** el simulador de iPhone sirve para probar el prototipo en tu Mac; una app instalada mediante distribución interna o TestFlight requiere el flujo de firma y distribución de Apple. El comando anterior no equivale a subirla a App Store.

Referencias: https://docs.expo.dev/build/setup/ y https://docs.expo.dev/tutorial/eas/ios-development-build-for-devices/

## H. Seguridad y base de datos — antes de lanzar TADAA!

**La versión entregada no tiene API ni PostgreSQL real.** Al subirla a xCloud se publica una **demo**, no una boletera operativa. En particular:

- No registres empleados o estudiantes reales todavía. Los datos actuales se almacenan localmente en el navegador y no se sincronizan con Expo.
- No habilites pagos con Clip ni envíes SMS reales antes de construir la API, confirmar webhooks y aplicar controles contra fraude y abuso.
- Mantén **GitHub privado**, activa MFA, y **nunca** guardes claves de Clip, contraseñas PostgreSQL, datos fiscales ni padrones institucionales en frontend o repositorio.
- El backend posterior tendrá autenticación y permisos del servidor, PostgreSQL privado, copias de seguridad probadas, registros de auditoría, sesiones seguras, OTP reales, catálogo postal y almacenamiento privado para boletos/documentos.
- El administrador de demostración no autentica usuarios; **debe mantenerse tras contraseña global de staging**.

## I. Comprobación final

1. Verifica que GitHub tiene las carpetas correctas en un repo privado.
2. Comprueba `localhost:8080` en el Mac y que se ven imágenes y menús.
3. Abre el staging de xCloud desde una sesión de navegador privada: **debe pedir usuario y contraseña**.
4. Entra a la demo, registra un usuario ficticio y comprueba validaciones rojas en nombre, correo y teléfono.
5. Desde `mobile/`, inicia Expo y abre el simulador con `i`, después de revisar las dependencias.
6. Confirma que **web y app no comparten usuarios todavía**; eso requiere el backend de la siguiente fase técnica.

**Estado al entregar esta guía:** instrucciones adaptadas a macOS y estructura verificada del ZIP, pero **sin despliegue real ni compilación iOS ejecutada en tu equipo**.
