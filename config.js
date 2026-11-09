// Configuración pública de InSecret (NUNCA pongas aquí claves secretas / service_role).
// La clave "publishable" (anon) de Supabase sí es pública por diseño; la seguridad la da RLS.
window.INSECRET_CONFIG = {
  supabaseUrl: '',   // ej. https://xxxx.supabase.co
  supabaseKey: ''    // clave publishable (sb_publishable_...) del proyecto insecret-poseidon
};
