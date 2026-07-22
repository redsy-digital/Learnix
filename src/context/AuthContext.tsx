/**
 * Learnix — AuthContext
 *
 * Contexto dedicado exclusivamente à autenticação via Supabase Auth.
 * Completamente isolado do AppContext (que gere dados académicos/mock).
 *
 * Responsabilidades:
 *  - Sessão real via Supabase Auth (não localStorage manual)
 *  - Login com email/password
 *  - Cadastro com email/password
 *  - Logout
 *  - Recuperação de senha
 *  - Perfil do utilizador (tabela profiles)
 *  - Estado de loading inicial (evita flash de rota errada)
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  school: string | null;
  school_year: string | null;
  target_uni: string | null;
  streak: number;
  theme_mode: 'light' | 'dark';
  notify_daily: boolean;
  notify_weekly: boolean;
  notify_ai: boolean;
}

interface AuthContextType {
  // Estado
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;  // true até a sessão ser confirmada ou negada
  authError: string | null;

  // Acções
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateProfileEmail: (newEmail: string) => Promise<void>;
  clearAuthError: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession]     = useState<Session | null>(null);
  const [user, setUser]           = useState<User | null>(null);
  const [profile, setProfile]     = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);  // começa true até a sessão ser resolvida
  const [authError, setAuthError] = useState<string | null>(null);

  const isLoggedIn = !!session;

  // ── Carregar perfil da tabela profiles ────────────────────────────────────
  const loadProfile = useCallback(async (userId: string, userEmail: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[AuthContext] Erro ao carregar perfil:', error.message);
      // Fallback mínimo para não quebrar a UI se o perfil ainda não foi criado pelo trigger
      setProfile({
        id: userId,
        name: userEmail.split('@')[0],
        email: userEmail,
        avatar_url: null,
        school: null,
        school_year: null,
        target_uni: null,
        streak: 0,
        theme_mode: 'light',
        notify_daily: true,
        notify_weekly: true,
        notify_ai: true,
      });
      return;
    }

    setProfile({
      id: data.id,
      name: data.name || userEmail.split('@')[0],
      email: userEmail,
      avatar_url: data.avatar_url,
      school: data.school,
      school_year: data.school_year,
      target_uni: data.target_uni,
      streak: data.streak ?? 0,
      theme_mode: data.theme_mode ?? 'light',
      notify_daily: data.notify_daily ?? true,
      notify_weekly: data.notify_weekly ?? true,
      notify_ai: data.notify_ai ?? true,
    });
  }, []);

  // ── Inicialização: escutar sessão do Supabase Auth ────────────────────────
  useEffect(() => {
    // 1. Obter sessão existente (se houver) ao montar
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        loadProfile(currentSession.user.id, currentSession.user.email ?? '').finally(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // 2. Escutar mudanças de estado (login, logout, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await loadProfile(currentSession.user.id, currentSession.user.email ?? '');
        } else {
          setProfile(null);
        }

        // Garantir que o loading é removido após qualquer evento
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // ── Aplicar tema ao <html> quando o perfil carrega ────────────────────────
  useEffect(() => {
    const theme = profile?.theme_mode ?? 'light';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [profile?.theme_mode]);

  // ─── Acções de autenticação ───────────────────────────────────────────────

  const signInWithEmail = async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(translateAuthError(error));
      throw error;
    }
    // onAuthStateChange cuida do resto
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });
    if (error) {
      setAuthError(translateAuthError(error));
      throw error;
    }
    // O trigger handle_new_user cria automaticamente o registo em profiles
    // com o full_name vindo de raw_user_meta_data
  };

  const signOut = async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[AuthContext] Erro ao fazer logout:', error.message);
    }
    // onAuthStateChange limpa session, user e profile automaticamente
  };

  const resetPassword = async (email: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      setAuthError(translateAuthError(error));
      throw error;
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    setAuthError(null);

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);

    if (error) {
      setAuthError('Erro ao guardar perfil. Tenta novamente.');
      throw error;
    }

    // Actualizar estado local imediatamente (sem re-fetch)
    setProfile((prev) => prev ? { ...prev, ...data } : prev);
  };

  /**
   * Alterar o email do utilizador segue o fluxo próprio do Supabase Auth —
   * nunca um UPDATE directo na tabela profiles. supabase.auth.updateUser
   * envia automaticamente um email de confirmação para o novo endereço;
   * o email em auth.users (e, por consequência, o que loadProfile lê)
   * só muda depois de o utilizador clicar nesse link. Isto está de acordo
   * com as boas práticas do Supabase Auth: evita que alguém tome posse
   * de uma conta alterando o email para um endereço que não controla.
   */
  const updateProfileEmail = async (newEmail: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      const message = translateAuthError(error);
      setAuthError(message);
      throw new Error(message);
    }
  };

  const clearAuthError = () => setAuthError(null);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoggedIn,
        isLoading,
        authError,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        resetPassword,
        updateProfile,
        updateProfileEmail,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  }
  return context;
};

// ─── Traduções de erros Supabase → Português ─────────────────────────────────

function translateAuthError(error: AuthError): string {
  const msg = error.message.toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Email ou palavra-passe incorrectos. Verifica os teus dados e tenta novamente.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Email ainda não confirmado. Verifica a tua caixa de entrada.';
  }
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'Este email já tem uma conta. Inicia sessão ou recupera a palavra-passe.';
  }
  if (msg.includes('password should be at least')) {
    return 'A palavra-passe deve ter pelo menos 6 caracteres.';
  }
  if (msg.includes('rate limit')) {
    return 'Demasiadas tentativas. Aguarda alguns minutos e tenta novamente.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Erro de ligação. Verifica a tua internet e tenta novamente.';
  }

  return 'Ocorreu um erro inesperado. Tenta novamente.';
}
