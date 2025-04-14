import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import storageService from './storage.service';

// Clé pour stocker l'état d'authentification dans le stockage local
const AUTH_STATE_KEY = 'smart_irrigation_auth_state';

/**
 * Service d'authentification pour l'application SmartIrrigation
 * Gère l'inscription, la connexion, la déconnexion et la récupération de mot de passe
 */
class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   * @param username Nom d'utilisateur
   * @param email Email de l'utilisateur
   * @param password Mot de passe
   * @returns Promesse contenant les informations d'authentification
   */
  async register(username: string, email: string, password: string): Promise<UserCredential> {
    try {
      // Créer l'utilisateur avec email et mot de passe
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Mettre à jour le profil avec le nom d'utilisateur
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: username
        });
        
        // Stocker l'état d'authentification
        await this.saveAuthState({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: username
        });
      }
      
      return userCredential;
    } catch (error: any) {
      // Gestion des erreurs spécifiques à Firebase
      let errorMessage = "Erreur lors de l'inscription";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "Cette adresse email est déjà utilisée";
          break;
        case 'auth/invalid-email':
          errorMessage = "L'adresse email est invalide";
          break;
        case 'auth/weak-password':
          errorMessage = "Le mot de passe est trop faible";
          break;
        default:
          errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Connexion d'un utilisateur existant
   * @param email Email de l'utilisateur
   * @param password Mot de passe
   * @returns Promesse contenant les informations d'authentification
   */
  async login(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Stocker l'état d'authentification
      if (userCredential.user) {
        await this.saveAuthState({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName
        });
      }
      
      return userCredential;
    } catch (error: any) {
      // Gestion des erreurs spécifiques à Firebase
      let errorMessage = "Erreur lors de la connexion";
      
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = "Email ou mot de passe incorrect";
          break;
        case 'auth/invalid-email':
          errorMessage = "L'adresse email est invalide";
          break;
        case 'auth/user-disabled':
          errorMessage = "Ce compte a été désactivé";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Trop de tentatives échouées. Veuillez réessayer plus tard";
          break;
        default:
          errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Déconnexion de l'utilisateur actuel
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      // Supprimer l'état d'authentification lors de la déconnexion
      await this.clearAuthState();
    } catch (error: any) {
      throw new Error("Erreur lors de la déconnexion: " + error.message);
    }
  }

  /**
   * Envoi d'un email de réinitialisation de mot de passe
   * @param email Email de l'utilisateur
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      let errorMessage = "Erreur lors de la réinitialisation du mot de passe";
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "Aucun compte associé à cette adresse email";
          break;
        case 'auth/invalid-email':
          errorMessage = "L'adresse email est invalide";
          break;
        default:
          errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Récupère l'utilisateur actuellement connecté
   * @returns L'utilisateur connecté ou null
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Vérifie si un utilisateur est connecté
   * @returns true si un utilisateur est connecté, false sinon
   */
  isLoggedIn(): boolean {
    return !!auth.currentUser;
  }
  
  /**
   * Sauvegarde l'état d'authentification dans le stockage local
   * @param userData Données de l'utilisateur à sauvegarder
   */
  async saveAuthState(userData: any): Promise<void> {
    try {
      // Utiliser le stockage local
      await storageService.setItem(AUTH_STATE_KEY, userData);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'état d\'authentification:', error);
    }
  }
  
  /**
   * Récupère l'état d'authentification depuis le stockage local
   * @returns Les données de l'utilisateur ou null si non connecté
   */
  async getAuthState(): Promise<any> {
    try {
      // Utiliser le stockage local
      const authData = await storageService.getItem<any>(AUTH_STATE_KEY);
      return authData;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'état d\'authentification:', error);
      return null;
    }
  }
  
  /**
   * Supprime l'état d'authentification du stockage local
   */
  async clearAuthState(): Promise<void> {
    try {
      // Utiliser le stockage local
      await storageService.removeItem(AUTH_STATE_KEY);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'état d\'authentification:', error);
    }
  }
}

// Exporter une instance du service
const authService = new AuthService();
export default authService;
