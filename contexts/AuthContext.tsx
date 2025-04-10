import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import authService from '../services/auth.service';

// Type pour le contexte d'authentification
interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

// Valeur par défaut du contexte
const defaultAuthContext: AuthContextType = {
  currentUser: null,
  isLoading: true,
  logout: async () => {},
};

// Création du contexte
const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => useContext(AuthContext);

// Props pour le fournisseur de contexte
interface AuthProviderProps {
  children: ReactNode;
}

// Fournisseur de contexte
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // S'abonner aux changements d'état d'authentification
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });

    // Nettoyer l'abonnement lors du démontage
    return unsubscribe;
  }, []);

  // Fonction de déconnexion
  const logout = async () => {
    await authService.logout();
  };

  const value = {
    currentUser,
    isLoading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 