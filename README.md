# TADAA! · Plataforma web y servicios · Beta 2 (núcleo integrado)

**TADAA!** es una plataforma de experiencias, beneficios empresariales y boletaje, construida con Node.js 22, PostgreSQL, web propia y Expo SDK 58. El código de esta entrega prioriza la **web** y su conexión con PostgreSQL. **No implica que esté publicada ni que ya permita cobros reales.**

## Accesos de la nueva web

- `/` — landing de entretenimiento basada en la propuesta visual de Claude.
- `/experience/login.html` — acceso y registro, membresía o convenio.
- `/experience/app.html` — área de usuario, eventos, reservas, entradas, portal empresarial/productor.
- `/experience/admin.html` — administración segura; conserva contraseña del sistema existente.
- `/experience/partner.html?slug=...` — presentación tipo diapositivas y captación de aliados.
- `/legacy.html` — interfaz v0.6 anterior preservada como referencia y acceso al panel de integraciones.

## APIs y migraciones

- `server/src/platform.mjs` agrega `/api/v2/*` sin borrar las APIs originales de integraciones.
- `server/migrations/002_beta2_core.sql` amplía las tablas con nuevas entidades sin eliminar las originales.
- **Respalda antes de migrar** y despliega primero en un sitio privado de staging con base de datos independiente.

## Funcionamiento de pagos

**No hay cobro real integrado.** La Beta privada permite confirmar pagos ficticios en PostgreSQL cuando se configura `TADAA_PRIVATE_BETA=true`. Los QR emitidos desde esta confirmación son **de prueba** y no son válidos en recintos comerciales. El administrador puede guardar credenciales separadas de Clip test/live cifradas, pero no activar LIVE hasta implementar los flujos autorizados.

## Guía completa

Consulta [`docs/BETA2_INTEGRACION.md`](docs/BETA2_INTEGRACION.md) para instalar, revisar las funciones implementadas, conocer los pendientes y desplegar sin afectar producción.

**Pendientes de lanzamiento:** Clip real, OAuth Google/Apple, emails/OTP, pasarelas externas, antifraude, prueba de restauración, gestión legal y de privacidad, App móvil nativa sincronizada y módulos avanzados (Golden Ticket, cashback, Awards, merch, campañas y juegos). Ninguno de esos módulos se debe presentar como activo sin desarrollarlo y probarlo.
