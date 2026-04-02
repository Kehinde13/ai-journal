import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { User } from '@supabase/supabase-js';
import { supabase } from '@config/supabase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const intentionalSignOut = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (event === 'SIGNED_OUT' && !intentionalSignOut.current) {
        Alert.alert(
          'Session expired',
          'Please log in again.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      }
      intentionalSignOut.current = false;
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    intentionalSignOut.current = true;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
