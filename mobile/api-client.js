/** Punto de conexión futuro de la app con el backend.
 * Solo consulta el estado público de disponibilidad de API.
 * La app sigue en modo demo hasta implementar login/OTP real + backend de pedidos.
 */
export const API_BASE=(process.env.EXPO_PUBLIC_TADAA_API_URL||'').replace(/\/$/,'');
export async function getServerStatus(){
 if(!/^https:\/\//.test(API_BASE))return {server:false,reason:'Configura EXPO_PUBLIC_TADAA_API_URL con un dominio HTTPS'};
 const response=await fetch(`${API_BASE}/api/public/status`);
 if(!response.ok)throw new Error('API no disponible');
 return response.json();
}
