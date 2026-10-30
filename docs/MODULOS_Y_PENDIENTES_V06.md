# Funciones TADAA! v0.6 — estado real

| Componente | Estado en v0.6 | Para ponerlo en producción |
|---|---|---|
| Catálogo, banners, eventos, descuentos y mapa | Demo local, edición visual | API + base de datos + archivos en storage |
| Registro, institución, emails/teléfonos únicos | Demo local | PostgreSQL + validación en servidor |
| OTP SMS y email | Demo `123456` | Twilio/Resend + endpoints y límites de intentos |
| Dirección CP/colonia | Demo local | Geocoding + padrón postal México |
| Carrito/favoritos/Wallet | Demo local | Usuarios/sesiones + API persistente compartida |
| Solicitud y ventana de 8 horas | Demo local | Reservas en BD + tareas programadas y lógica de negocio |
| Clip Checkout Transparente | Simulación visual | Integrar SDK seguro, API payments, webhook, conciliación, reembolsos |
| Facturación CFDI | Solicitud demo | Facturama + validación fiscal + emisión y entregas |
| Envíos | Opciones demo | Envia.com + direcciones y logística reales |
| Panel Integraciones | **Operativo en Node** | Completar credenciales de cada proveedor |
| Acceso de administrador a panel | **Operativo en Node** | Endurecer seguridad, 2FA y permisos antes de producción |
| Bóveda cifrada y registros de configuración | **Operativo en Node** | Ruta persistente y backups seguros |
| Comprobar credenciales GET | **Operativo en seis proveedores** | Permisos de cuenta y cuotas API; no activa flujos |
| App Expo | Prototipo local | Backend compartido + builds/TestFlight + QA |
| PostgreSQL | No conectado | Crear esquema y migraciones, entorno/backup |
| PassKit, boletera propia, promotores, Spotify | Fuera fase 1 | Desarrollo futuro y acuerdos externos |

**Interpretación correcta de “lista para usar”:** el módulo de integraciones está listo para guardar credenciales y probarlas sin editar archivos. **La plataforma de venta NO está lista para usar con dinero ni personas reales únicamente por introducir esas credenciales.**
