# TADAA! Experience — actualización v3 (solo vista previa)

Corrige los 404 de `evento-N-catalogo.jpg` (N=1…11) incluyendo las imágenes demo correspondientes; usa las mismas imágenes de evento de la vista previa como relleno temporal, no como arte definitivo.

Mejora transiciones entre `index.html`, `login.html`, `app.html`: fade a negro → cierre del telón → cambio de página → fade/revelación de telón → apertura a contenido. Las rutas internas con hash en `app.html` usan transición breve, sin volver a cargar telón.

La experiencia sigue siendo un prototipo (usuarios/pagos/QR/localStorage falsos), no usar con datos reales ni desplegar en producción.

Instalar únicamente `web/experience/` sobre la carpeta del proyecto, guardando copia previa. No ejecutar npm start si exige claves. Vista previa con `python3 -m http.server 8765 --directory web`.
