# TADAA! BETA 1 — Integración visual v7 (18 noviembre 2026)

## Qué contiene
- `web/experience` con landing, acceso, panel y recursos gráficos del diseño de Claude.
- `curtain.js`: un único preloader en la primera visita; de `login.html` a `app.html` y viceversa solo fade negro (sin telón).
- Enlaces visibles hacia los módulos EXISTENTES de la web original: empresas, productores, administrador, Wallet.
- `web/index.html`, `web/app.js`, `server/`, `mobile/`, `server/migrations/` sin modificaciones en esta entrega.

## Qué NO es una integración funcional de producción
- La sesión del rediseño sigue siendo local y de demostración. No valida contraseñas ni OAuth.
- Catálogo, reservas, QR, pagos, Wallet y alertas del rediseño son datos simulados.
- Los enlaces a módulos anteriores conservan funcionalidad demo preexistente, pero NO comparten usuario ni órdenes con el nuevo diseño.
- No habilita membresía, Clip, padrones, boletaje ni acceso real a eventos.
- No se incorporó al backend ninguno de los flujos comerciales de Beta 1. Requieren APIs, BD, permisos y pruebas específicas.

## Instalación recomendada: solo vista previa
En tu Mac, descomprime el ZIP y copia la carpeta `web/experience` dentro de `~/Documents/GitHub/tadaa/web/experience`.
Hay un `INSTALAR_EN_MAC.command` en la raíz del paquete, que copia solo esa carpeta haciendo un respaldo.
Desde la raíz de tu repositorio ejecuta `python3 -m http.server 8765 --directory web` y visita:
http://localhost:8765/experience/
No hagas Push todavía ni publiques esta vista previa: es una demostración.

## Antes de seguir con BETA 1
1. Rotar secretos expuestos de xCloud, sin perder la clave AES de la bóveda si tuviera datos.
2. Separar staging de producción.
3. Implementar API, modelos y permisos de identidad; membresía; convenio; alta/baja de padrones con confirmación.
4. Sustituir LocalStorage por llamadas autenticadas, con pruebas de backend y E2E.
5. Conservar diseño en componentes reutilizables sin incrustar HTML de la web en la app nativa Expo.
