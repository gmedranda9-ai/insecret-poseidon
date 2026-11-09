// Configuración pública de InSecret.
// La clave "publishable" de Supabase es pública por diseño (va en el navegador).
// La seguridad real la dan las tablas cerradas (RLS) y las funciones del servidor.
// NUNCA pongas aquí la clave service_role ni ningún secreto.
window.INSECRET_CONFIG = {
  supabaseUrl: 'https://qhzswvfdnjnftjuyxcnn.supabase.co',
  supabaseKey: 'sb_publishable_h2cqNavKQYNBQW11MULL7A_VfanUNgo'
};
