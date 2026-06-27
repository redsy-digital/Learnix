/**
 * Learnix — Cliente Supabase (singleton)
 *
 * Utilizar SEMPRE este ficheiro para aceder ao Supabase.
 * Nunca criar instâncias separadas de createClient em outros ficheiros.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://suxrvjkffmthnniyzbeh.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1eHJ2amtmZm10aG5uaXl6YmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MTY3ODksImV4cCI6MjA5Nzk5Mjc4OX0.tgEi9qrRdmtHGEp9or_fF764RlpntrmLps1ha0sLjM8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    // Persistência automática de sessão via localStorage (padrão do Supabase Auth)
    persistSession: true,
    // Renovação automática do token JWT antes de expirar
    autoRefreshToken: true,
    // Detectar sessão da URL após redirecionamento OAuth / email confirmation
    detectSessionInUrl: true,
  },
});
