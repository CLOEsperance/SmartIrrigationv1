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
      return await signInWithEmailAndPassword(auth, email, password);
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
}

// Exporter une instance du service
const authService = new AuthService();
export default authService;
