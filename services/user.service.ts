import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Interface pour les données utilisateur
export interface UserData {
  userId: string;
  username?: string;
  email?: string;
  language?: string;
  location?: {
    latitude: number;
    longitude: number;
    region?: string;
  };
  crops?: Array<{
    id: string;
    name: string;
    soilType: string;
    area: string;
    plantingDate: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Service pour gérer les données utilisateur dans Firestore
 */
class UserService {
  /**
   * Crée un nouveau profil utilisateur après l'inscription
   * @param userId ID de l'utilisateur Firebase Auth
   * @param username Nom d'utilisateur
   * @param email Email de l'utilisateur
   * @returns Une promesse
   */
  async createUserProfile(userId: string, username: string, email: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userData: UserData = {
        userId,
        username,
        email,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(userRef, userData);
      console.log('Profil utilisateur créé avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la création du profil utilisateur:', error);
      throw new Error('Erreur lors de la création du profil utilisateur: ' + error.message);
    }
  }

  /**
   * Met à jour la langue préférée de l'utilisateur
   * @param userId ID de l'utilisateur
   * @param language Code de la langue
   * @returns Une promesse
   */
  async updateUserLanguage(userId: string, language: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        language,
        updatedAt: new Date()
      });
      console.log('Langue utilisateur mise à jour avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la langue:', error);
      throw new Error('Erreur lors de la mise à jour de la langue: ' + error.message);
    }
  }

  /**
   * Met à jour la localisation de l'utilisateur
   * @param userId ID de l'utilisateur
   * @param latitude Latitude
   * @param longitude Longitude
   * @param region Région (optionnel)
   * @returns Une promesse
   */
  async updateUserLocation(
    userId: string, 
    latitude: number, 
    longitude: number, 
    region?: string
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        location: {
          latitude,
          longitude,
          region
        },
        updatedAt: new Date()
      });
      console.log('Localisation utilisateur mise à jour avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la localisation:', error);
      throw new Error('Erreur lors de la mise à jour de la localisation: ' + error.message);
    }
  }

  /**
   * Met à jour les cultures de l'utilisateur
   * @param userId ID de l'utilisateur
   * @param crops Tableau des cultures
   * @returns Une promesse
   */
  async updateUserCrops(
    userId: string, 
    crops: Array<{
      id: string;
      name: string;
      soilType: string;
      area: string;
      plantingDate: string;
    }>
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        crops,
        updatedAt: new Date()
      });
      console.log('Cultures utilisateur mises à jour avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour des cultures:', error);
      throw new Error('Erreur lors de la mise à jour des cultures: ' + error.message);
    }
  }

  /**
   * Récupère les données d'un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Les données utilisateur ou null si non trouvé
   */
  async getUserData(userId: string): Promise<UserData | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as UserData;
      } else {
        console.log('Aucun profil utilisateur trouvé');
        return null;
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      throw new Error('Erreur lors de la récupération des données utilisateur: ' + error.message);
    }
  }

  /**
   * Vérifie si un profil utilisateur existe
   * @param userId ID de l'utilisateur
   * @returns true si le profil existe, false sinon
   */
  async doesUserProfileExist(userId: string): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      return userDoc.exists();
    } catch (error: any) {
      console.error('Erreur lors de la vérification du profil utilisateur:', error);
      throw new Error('Erreur lors de la vérification du profil utilisateur: ' + error.message);
    }
  }
}

// Exporter une instance du service
const userService = new UserService();
export default userService; 