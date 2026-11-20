/* =========================================================
   supabase.js — Configuración del cliente Supabase

   RELLENA las dos constantes de abajo con los datos de tu
   proyecto. Los encuentras en:
     Supabase Dashboard → Settings → API
   ========================================================= */

const SUPABASE_URL     = 'https://kaptwrbvpnjffcphaiks.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthcHR3cmJ2cG5qZmZjcGhhaWtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDUyODgsImV4cCI6MjA5NzI4MTI4OH0.hHHge3YwvccdRlT5alnhzMPFk937w20G0OQdYBrrtgM';

// El bundle UMD ya declara `var supabase`; lo sobreescribimos con el cliente.
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
