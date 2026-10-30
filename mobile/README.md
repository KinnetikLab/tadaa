# TADAA! Mobile · Expo

La aplicación sigue siendo un prototipo de interfaz. `api-client.js` solo consulta el endpoint público de estado; no implementa aún inicio de sesión, pedidos, reservas, Wallet ni pagos reales.

## Configuración sencilla

1. Instala Node.js 22 LTS o superior en macOS.
2. Desde esta carpeta ejecuta `npm install`.
3. Copia `.env.example` a `.env` y coloca la URL HTTPS pública del backend en `EXPO_PUBLIC_TADAA_API_URL`.
4. Ejecuta `npx expo start` para abrir la app en Expo Go.

## Preparar EAS

```bash
npm install
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform all --profile preview
```

Para producción, cuando los módulos de negocio estén implementados y probados:

```bash
npx eas-cli build --platform all --profile production
```

Los identificadores configurados son `com.tadaa.app` para iOS y Android. Deben comprobarse como disponibles en las cuentas de las tiendas antes de publicar. No pongas claves privadas ni secretos en variables `EXPO_PUBLIC_`.
