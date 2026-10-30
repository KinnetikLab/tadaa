# Comprobación de registro v0.5.1

**Todos los datos de este documento son ficticios.** No uses información personal verdadera.

## Flujo de prueba

1. Abre el HTML independiente o `web/index.html` (preferiblemente bajo un servidor estático privado), elige **Crear cuenta**.
2. Deja los campos vacíos y pulsa Validar convenio: se muestra un aviso rojo dentro del modal y errores rojos debajo de cada campo.
3. Escribe `Laura Isabel` en **Nombre(s)**, `García` en **Apellido paterno**, `López` en **Apellido materno**.
4. Prueba `laura@` en correo y `55123` en teléfono: verás errores rojos, sin cambiar de paso.
5. Corrige a `laura.demo.051@example.com` y `5512345678` (**ficticios; evita usar los de alguien real**). Elige `Empresa Demo Norte`, ID `EMP-1001`.
6. Continúa; en OTP escribe `123456` tanto en correo como en SMS. Los códigos no son enviados, solo simulados.
7. En datos personales escribe CP `06700`, elige `Roma Norte` o `Roma Sur`; usa una fecha de nacimiento mayor de edad (ejemplo `1990-01-01`), género opcional y acepta términos. La casilla de promociones queda opcional.
8. Pulsa Crear mi cuenta; verás la portada de miembro y podrás entrar a Explorar y Mi Wallet.
9. Si intentas registrar el mismo correo, teléfono o matrícula en el **mismo navegador**, el demo mostrará un error rojo. La demo no detecta duplicados de otros dispositivos porque no hay backend.

## Si no se completa el registro

- Abre el sitio en ventana normal, no en modo privado; no uses extensiones que bloqueen almacenamiento local.
- El HTML intenta guardar en `localStorage`, luego `sessionStorage`; como último recurso, permite probar el recorrido en memoria **pero los cambios se pierden al recargar**.
- Usa únicamente los IDs de convenio listados. No hay consulta real al padrón del empleador.
- El CP debe ser `06700`, `03810` o `03100`; la colonia debe seleccionarse del dropdown generado.
- El checkbox obligatorio de términos debe quedar marcado. El consentimiento comercial no es obligatorio.
- El aviso legal abre un modal aparte y al cerrarlo vuelve al formulario sin borrar los datos.
- Si aparece «correo/móvil/ID ya registrado», usa otro correo y teléfono ficticios o reinicia la demo desde Admin → Restablecer (borra la información local de prueba).
- Si el código no avanza, prueba en Edge o Chrome desde un servidor HTTPS privado en xCloud; consulta la consola de desarrollador solo si hace falta.

**Limitaciones:** sin usuario real, sin base de datos compartida, sin OTP real, sin correo ni SMS real, sin Google Maps ni Clip.
