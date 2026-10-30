# Seguridad y bases de datos — TADAA! Fase 1

> **Diseño propuesto; NO existe todavía un backend real.** Publicar el prototipo en xCloud no activa las protecciones de abajo ni convierte la demo en un servicio de producción.

## La arquitectura segura objetivo

```text
GitHub privado: web/ + mobile/ + futuro api/
             │                │
          xCloud             Expo EAS
       web + admin           apps iOS/Android
             └──── API HTTPS autenticada ─────┘
                         │
            Autorización y roles (servidor)
                         │
       PostgreSQL privado + repositorio de archivos privado
                         │
           OTP / Clip / email / SMS / CFDI
```

### Por qué no guardar el padrón en el frontend

La demo incluye cuentas de ejemplo, credenciales OTP fijas y un administrador sin restricciones. Cualquier visitante que vea la web obtiene su JavaScript y puede inspeccionar el contenido. No permite almacenar ni comprobar afiliaciones reales de forma segura.

## Modelo de datos propuesto

| Entidad | Información esencial | Controles |
|---|---|---|
| `institutions` | nombre, tipo, vigencia, estado de convenio | solo admin, historia de cambios |
| `institution_memberships` | institución, identificador protegido, vigencia, estado | no exponer padrón en API pública; coincidencia controlada |
| `users` | id, nombre(s), apellidos, email normalizado, teléfono en formato +52, fecha de nacimiento, género opcional | email/phone únicos, verificados y protegidos |
| `contact_verifications` | OTP **hasheado**, canal, expiración, intentos, estado | expiración corta, rate-limit, reenvío limitado, no OTP fijo |
| `user_addresses` | CP, estado, municipio, colonia, domicilio de envío opcional | mínimas finalidades y acceso solo del titular |
| `consents` | versión de términos, aceptación, permiso promocional separado, fecha, IP de registro si procede | revocación de marketing y evidencia auditable |
| `events`, `event_sessions`, `price_tiers` | contenido, fechas recurrentes, precio público y convenio | edición autorizada y revisión |
| `availability_requests` | cliente, función, tarifa, cantidad, estado, autorización/vencimiento | servidor impone ocho horas, historial de estados |
| `orders`, `payments`, `refunds` | monto, referencia Clip, estado, moneda | idempotencia, webhooks firmados y conciliación |
| `wallet_documents`, `deliveries` | comprobantes, PDF oficial autorizado, dirección y estado | archivos privados, URLs firmadas que caducan |
| `invoices` | solicitud CFDI, datos fiscales, estado, UUID y archivos entregables | cifrado / mínimo acceso y retención fiscal |
| `audit_log` | quién cambió qué, cuándo y desde dónde | solo lectura y controles de integridad |

### Validaciones (cliente y servidor)

- `givenNames`, `paternalSurname`, `maternalSurname` guardados en columnas independientes. Normalizar Unicode y espacios.
- Correo: verificar forma y **confirmar propiedad mediante OTP real**; validación sintáctica no garantiza que exista.
- Número mexicano: para teléfono móvil nacional se capturan **10 dígitos**, normalizar para mensajería como `+52XXXXXXXXXX` según reglas del proveedor. Verificar con OTP SMS y limitar abuso.
- `UNIQUE` para correo y teléfono normalizados; índice único por `institución + ID` para evitar reutilización. No enviar respuestas que permitan adivinar matrículas válidas a escala; rate limits y mensajes neutrales de servidor.
- CP/colonias: catálogos postales confiables, con Google Maps para ayuda geográfica. No deducir un listado completo de colonias solo desde geocoding.
- Fecha de nacimiento: control de edad y flujo de representante/tutor si se abre a menores. Género no indispensable para vender; mantener opcional si no existe una justificación operacional explícita.
- Consentimiento comercial independiente: desmarcado por defecto, revocable y registrado con versión de política.
- Probar códigos incorrectos, expirados, duplicados, saltos de pasos y reintentos; **nunca confiar solo en validación del navegador**.

## xCloud / PostgreSQL

La documentación de xCloud del **28/10/2026** informa soporte para PostgreSQL administrado bajo servidores **Nginx** con **Docker Engine 28+**. Una nueva aplicación Git Node.js puede elegir PostgreSQL si el servicio está Ready; se crea base y rol. **Aún no se incluyen sus bases PostgreSQL en el backup habitual del sitio**, así que configurar exportaciones respaldadas, cifradas, con verificación periódica de restauración es imprescindible. También puedes elegir un proveedor PostgreSQL administrado externo que incluya backups automáticos.

Docs: https://xcloud.host/docs/install-managed-postgresql-and-pgadmin-in-xcloud/

Para producción:
- PostgreSQL no expuesto a Internet; solo el backend puede conectarse, cuenta mínima para la aplicación; migraciones con rol separado.
- Copia diaria, restauración probada, métricas de disco, alertas y cifrado en tránsito/reposo según infraestructura.
- Staging y producción con **bases separadas**, datos de pruebas ficticios y secretos diferentes.
- Si optas por Supabase/Postgres con acceso directo del cliente, aplica RLS correctamente; para una API tradicional, aplica autorización del servidor por objeto y rol, además de reglas de base.

## Checkout Clip + privacidad

- SDK web seguro en checkout, sin guardar PAN, CVV ni capturas de tarjetas.
- Token/pago se confirma desde el servidor consultando Clip; no confiar en redirección ni payload sin firma. Manejar autorización de ocho horas a nivel servidor.
- Validar antifraude, reembolsos, CFDI y condiciones de disponibilidad externas con contrato.
- Solo órdenes del comprador en su Wallet; archivos PDF de proveedores en almacenamiento privado con accesos de corta duración.
- Panel de administración real con roles (superadmin, operaciones, contenido, soporte, finanzas), MFA y auditoría.

## Checklist de seguridad antes de activar usuarios reales

- [ ] API y PostgreSQL instalados con backups probados.
- [ ] Registro/OTP real con control de intentos, sesión y caducidad.
- [ ] Confirmación institucional en servidor sin padrón público.
- [ ] Cookies seguras o sesiones/token móvil seguros; autorización por recurso.
- [ ] Control de cambios del administrador, MFA y logs.
- [ ] Fotos y documentos en almacenamiento privado con análisis de archivos subidos.
- [ ] Términos y aviso de privacidad mexicanos revisados.
- [ ] Clip autorizado y probado con tarjetas de prueba, webhooks y reembolsos.
- [ ] Facturación y entrega de boletos probadas de punta a punta.
- [ ] Pruebas de penetración y restauración de backups antes de producción.
