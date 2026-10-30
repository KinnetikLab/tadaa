# TADAA! v0.6 — seguridad, datos y límites

## Qué sí está protegido

Las credenciales del panel de **Integraciones** son enviadas al servidor por HTTPS en producción y se guardan en un archivo cifrado con AES-256-GCM. Una sesión de administrador (cookie HttpOnly, SameSite=Strict, Secure bajo NODE_ENV=production) es obligatoria para consultarlas, guardarlas, probarlas y eliminarlas. Las mutaciones tienen token CSRF; hay bloqueo básico de intentos de contraseña y eventos de auditoría que no contienen secretos. El servidor no devuelve claves guardadas, solo un indicador de existencia. Las pruebas remotas usan hosts de proveedor predeterminados, no URLs arbitrarias enviadas desde el navegador.

La contraseña del administrador se verifica mediante hash scrypt. El script de inicio genera su hash sin almacenar la contraseña original. Los secretos de arranque (`TADAA_ENCRYPTION_KEY`, `TADAA_SESSION_SECRET`, `TADAA_ADMIN_PASSWORD_HASH`) permanecen en el entorno del proceso xCloud, nunca en GitHub ni en Expo.

## Qué sigue pendiente antes de recibir clientes reales

La web v0.6 conserva módulos **demo** que hoy están gestionados en localStorage/sessionStorage: registros, padrón de colaboradores, Wallet, solicitudes, estados, facturación y pagos. Aunque el administrador de integraciones sí tiene inicio de sesión y bóveda real, **las demás pantallas no tienen backend de producción**. No introducir datos personales de trabajadores, alumnos ni números reales de empleados en la demo.

Faltan antes del lanzamiento: autenticación y registros en PostgreSQL, validación institucional del lado servidor, verificación OTP real, permisos por rol, migraciones y respaldos, integración de Clip y webhooks con conciliación e idempotencia, API para emisión y entrega de documentos, pruebas antifraude, actualización de términos y privacidad, monitoreo de seguridad, revisión de accesibilidad y pruebas de penetración. El soporte de PassKit y boletos propios está reservado a fase posterior.

## Entornos y servicios externos

Probar Google Geocoding, Clip, Twilio, Envia o Facturama envía una petición GET a su API. Puede incurrir en costes de consulta según el proveedor; no envía SMS ni emite facturas, no crea guías ni cobra tarjetas. `testStatus:passed` significa solo que la consulta de credenciales funcionó, **no** que los flujos de usuario están integrados o listos para operar.

Google Geocoding no devuelve necesariamente **todas** las colonias para un CP. Se requiere un catálogo postal mexicano licenciado/actualizado. Credenciales nativas Apple, Google Play y firma de aplicaciones se gestionan en Apple Developer / Expo EAS y no deben introducirse en el admin web.

## Copias de seguridad

Respaldar por separado:
1. La carpeta `DATA_DIR` con `integration-vault.enc.json` y `integrations-audit.ndjson` (ambos con permisos de acceso mínimos).
2. La `TADAA_ENCRYPTION_KEY`, custodiada en un gestor seguro y nunca junto a una copia accesible públicamente.
3. Cuando exista PostgreSQL: backups cifrados verificados y pruebas de restauración. No depender de copias de la web estática.

No regenerar la clave AES sin un proceso de migración cifrada; los datos existentes quedarían ilegibles. Rotar las claves de proveedores comprometidas desde los portales respectivos y reemplazarlas en el admin. Rotar `TADAA_SESSION_SECRET` invalida sesiones al reiniciar el proceso.

## Recomendaciones para lanzamiento

Proteger el staging completo con Basic Auth en xCloud y HTTPS. Idealmente mover el administrador a un subdominio independiente, habilitar 2FA y roles, y adoptar secretos administrados (vault externo) para un entorno de producción más complejo. Mantener servidor, Node, dependencias y sistema actualizados. Revisar CSP y evitar scripts de terceros no confiables antes de usar datos reales. Una bóveda cifrada no equivale por sí sola a certificación PCI ni cumplimiento integral de protección de datos.
