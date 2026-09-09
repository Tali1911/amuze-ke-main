import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { auditLogService } from '@/services/auditLogService';

interface AuthContextType {
  user: any | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Fetch user role and profile from Supabase
  const fetchUserProfile = async (userId: string) => {
    try {
      // Get user roles
      const roleResult = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleResult.error) {
        console.error('Error fetching user role:', roleResult.error);
        return null;
      }

      // Get user profile if exists
      const profileResult = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Normalize role to uppercase to match frontend constants
      const role = roleResult.data?.role ? roleResult.data.role.toUpperCase() : null;
      
      return {
        role,
        profile: profileResult.data || null
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        
        if (session?.user) {
          // Defer fetching additional data
          setTimeout(() => {
            fetchUserProfile(session.user.id).then((userData) => {
              if (userData && userData.role) {
                const userObject = {
                  id: session.user.id,
                  email: session.user.email,
                  username: session.user.email?.split('@')[0],
                  role: userData.role,
                  department: userData.profile?.department || 'Not Set',
                  isSuperAdmin: userData.role === 'CEO' || userData.role === 'ADMIN',
                  ...(userData.profile || {})
                };
                setUser(userObject);
                setIsSuperAdmin(userObject.isSuperAdmin);
              }
            });
          }, 0);
        } else {
          setUser(null);
          setIsSuperAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        fetchUserProfile(session.user.id).then((userData) => {
          if (userData && userData.role) {
            const userObject = {
              id: session.user.id,
              email: session.user.email,
              username: session.user.email?.split('@')[0],
              role: userData.role,
              department: userData.profile?.department || 'Not Set',
              isSuperAdmin: userData.role === 'CEO' || userData.role === 'ADMIN',
              ...(userData.profile || {})
            };
            setUser(userObject);
            setIsSuperAdmin(userObject.isSuperAdmin);
          }
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Login attempt for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        const msg = error.message?.toLowerCase() || '';
        if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
          return { success: false, error: 'Please confirm your email first. Check your inbox (and spam folder) for the confirmation link.' };
        }
        if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
          return { success: false, error: 'Invalid email or password. If you previously had an account that was removed, ask an administrator to pre-authorize your email so you can sign in with Google.' };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Check approval status
        const { data: profileData } = await (supabase as any)
          .from('profiles')
          .select('approval_status')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileData && profileData.approval_status === 'pending') {
          console.log('User account pending approval');
          await supabase.auth.signOut();
          throw new Error('Your account is pending admin approval. Please wait for confirmation.');
        }

        if (profileData && profileData.approval_status === 'rejected') {
          console.log('User account rejected');
          await supabase.auth.signOut();
          throw new Error('Your account registration was rejected. Please contact support.');
        }

        const userData = await fetchUserProfile(data.user.id);
        
        if (!userData?.role) {
          console.error('No role assigned to user');
          await supabase.auth.signOut();
          throw new Error('No role assigned. Please contact an administrator.');
        }

        const userObject = {
          id: data.user.id,
          email: data.user.email,
          username: data.user.email?.split('@')[0],
          role: userData.role,
          department: userData.profile?.department || 'Marketing',
          isSuperAdmin: userData.role === 'CEO' || userData.role === 'ADMIN',
          ...(userData.profile || {})
        };
        
        setUser(userObject);
        setSession(data.session);
        setIsSuperAdmin(userObject.isSuperAdmin);
        
        // Log the login event
        await auditLogService.logLogin(userObject.username || email);
        
        console.log('Login successful:', userObject);
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      console.error('Login failed:', error);
      return { success: false, error: error?.message || 'An unexpected error occurred' };
    }
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin`,
        },
      });
      if (error) {
        console.error('Google sign-in error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error: any) {
      console.error('Google sign-in failed:', error);
      return { success: false, error: error?.message || 'Google sign-in failed' };
    }
  };

  const signup = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Signup attempt for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`
        }
      });

      if (error) {
        console.error('Signup error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('Signup successful:', data.user.email);
        return { success: true };
      }

      return { success: false, error: 'Unknown error occurred' };
    } catch (error) {
      console.error('Signup failed:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    const username = user?.username || user?.email || 'unknown';
    
    await supabase.auth.signOut();
    
    // Log the logout event before clearing user state
    await auditLogService.logLogout(username);
    
    setUser(null);
    setSession(null);
    setIsSuperAdmin(false);
  };

  const contextValue: AuthContextType = {
    user,
    session,
    isLoading,
    login,
    signup,
    signInWithGoogle,
    logout,
    isAuthenticated: !!user && !!session,
    isSuperAdmin
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
