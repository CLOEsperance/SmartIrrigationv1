import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { CultureData } from '../types/culture';

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
    detailedLocation?: string;
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

// Interface pour l'historique d'irrigation
export interface IrrigationHistoryItem {
  date: Date;
  culture: string;
  volume: number;
  totalVolume: number;
  completed: boolean;
}

// Format pour la présentation de l'historique d'irrigation dans l'UI
export interface IrrigationHistoryDisplay {
  id: string;
  date: string;
  culture: string;
  quantity: string;
  isCompleted: boolean;
}

interface UserStats {
  cultures: number;
  irrigations: number;
  efficiency: number;
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
   * @param detailedLocation Localisation détaillée (optionnel)
   * @returns Une promesse
   */
  async updateUserLocation(
    userId: string, 
    latitude: number, 
    longitude: number, 
    region?: string,
    detailedLocation?: string
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        location: {
          latitude,
          longitude,
          region,
          detailedLocation
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

  /**
   * Ajoute une entrée à l'historique d'irrigation
   * @param userId ID de l'utilisateur
   * @param irrigationData Données d'irrigation
   * @returns Une promesse avec l'ID du document créé
   */
  async addIrrigationHistory(
    userId: string,
    irrigationData: IrrigationHistoryItem
  ): Promise<string> {
    try {
      // Vérifier que userId est défini
      if (!userId) {
        throw new Error('ID utilisateur non défini');
      }
      
      // Vérifier que les données d'irrigation sont valides
      if (!irrigationData.culture || irrigationData.volume <= 0) {
        throw new Error("Données d'irrigation invalides");
      }
      
      // Créer la référence à la collection d'historique de l'utilisateur
      const historyCollection = collection(db, 'users', userId, 'irrigationHistory');
      
      // Ajouter le document
      const docRef = await addDoc(historyCollection, {
        date: Timestamp.fromDate(irrigationData.date || new Date()),
        culture: irrigationData.culture,
        volume: irrigationData.volume,
        totalVolume: irrigationData.totalVolume,
        completed: irrigationData.completed,
        createdAt: Timestamp.now()
      });
      
      console.log('Historique d\'irrigation ajouté avec succès, ID:', docRef.id);
      return docRef.id;
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout à l\'historique d\'irrigation:', error);
      throw new Error('Erreur lors de l\'ajout à l\'historique d\'irrigation: ' + error.message);
    }
  }

  /**
   * Récupère l'historique d'irrigation d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param days Nombre de jours d'historique à récupérer (par défaut: 30)
   * @returns Une promesse contenant un tableau d'éléments d'historique formatés pour l'affichage
   */
  async getIrrigationHistory(
    userId: string,
    days: number = 30
  ): Promise<IrrigationHistoryDisplay[]> {
    try {
      // Vérifier que userId est défini
      if (!userId) {
        throw new Error('ID utilisateur non défini');
      }
      
      // Calculer la date limite pour la requête
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - days);
      
      // Créer la requête
      const historyCollection = collection(db, 'users', userId, 'irrigationHistory');
      const q = query(
        historyCollection,
        where('date', '>=', Timestamp.fromDate(limitDate)),
        orderBy('date', 'desc')
      );
      
      // Exécuter la requête
      const querySnapshot = await getDocs(q);
      
      console.log(`Nombre d'entrées trouvées: ${querySnapshot.size}`);
      
      // Formater les résultats pour l'affichage
      const history: IrrigationHistoryDisplay[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Vérifier que date est bien un Timestamp
        if (!data.date || !data.date.toDate) {
          console.warn(`Date invalide pour l'entrée ${doc.id}:`, data.date);
          return; // Ignorer cette entrée
        }
        
        const date = data.date.toDate();
        
        history.push({
          id: doc.id,
          date: date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }),
          culture: data.culture || 'Culture inconnue',
          quantity: `${(data.volume || 0).toFixed(1)}L/m²`,
          isCompleted: !!data.completed
        });
      });
      
      return history;
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'historique d\'irrigation:', error);
      throw new Error('Erreur lors de la récupération de l\'historique d\'irrigation: ' + error.message);
    }
  }

  /**
   * Enregistre le feedback de l'utilisateur sur une recommandation d'irrigation
   * @param userId ID de l'utilisateur
   * @param feedbackData Données du feedback
   * @returns Une promesse
   */
  async addIrrigationFeedback(
    userId: string,
    feedbackData: {
      date: Date;
      culture: string;
      volume: number;
      isGood: boolean;
    }
  ): Promise<void> {
    try {
      const feedbackCollection = collection(db, 'users', userId, 'irrigationFeedback');
      
      await addDoc(feedbackCollection, {
        date: Timestamp.fromDate(feedbackData.date),
        culture: feedbackData.culture,
        volume: feedbackData.volume,
        isGood: feedbackData.isGood,
        createdAt: Timestamp.now()
      });
      
      console.log('Feedback d\'irrigation enregistré avec succès');
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement du feedback d\'irrigation:', error);
      throw new Error('Erreur lors de l\'enregistrement du feedback d\'irrigation: ' + error.message);
    }
  }

  async getUserCultures(userId: string | undefined): Promise<CultureData[]> {
    // TODO: Implémenter la récupération réelle des cultures depuis l'API
    // Pour l'instant, retourner des données de démonstration
    return [
      {
        id: 'demo-tomate-1',
        name: 'Tomate',
        soilType: 'Argileux',
        plantingDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        area: 50
      },
      {
        id: 'demo-laitue-1',
        name: 'Laitue',
        soilType: 'Limoneux',
        plantingDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        area: 30
      },
      {
        id: 'demo-mais-1',
        name: 'Maïs',
        soilType: 'Sablonneux',
        plantingDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        area: 100
      }
    ];
  }

  /**
   * Calcule les statistiques de l'utilisateur
   * @param userId ID de l'utilisateur
   * @returns Une promesse contenant les statistiques de l'utilisateur
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Récupérer les cultures de l'utilisateur
      const cultures = await this.getUserCultures(userId);
      
      // Récupérer l'historique d'irrigation
      const irrigationHistory = await this.getIrrigationHistory(userId);
      
      // Calculer l'efficacité
      const efficiency = this.calculateEfficiency(cultures, irrigationHistory);
      
      return {
        cultures: cultures.length,
        irrigations: irrigationHistory.length,
        efficiency: Math.round(efficiency * 100) // Convertir en pourcentage
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  }

  /**
   * Calcule l'efficacité d'irrigation
   * @param cultures Cultures de l'utilisateur
   * @param irrigationHistory Historique d'irrigation
   * @returns Un nombre entre 0 et 1 représentant l'efficacité
   */
  private calculateEfficiency(cultures: CultureData[], irrigationHistory: IrrigationHistoryDisplay[]): number {
    if (cultures.length === 0 || irrigationHistory.length === 0) {
      return 0;
    }

    // Calculer le nombre d'irrigations par culture
    const irrigationsPerCulture = irrigationHistory.reduce((acc, irrigation) => {
      acc[irrigation.culture] = (acc[irrigation.culture] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculer l'efficacité moyenne
    let totalEfficiency = 0;
    let cultureCount = 0;

    cultures.forEach(culture => {
      const irrigations = irrigationsPerCulture[culture.name] || 0;
      const expectedIrrigations = this.getExpectedIrrigations(culture);
      
      if (expectedIrrigations > 0) {
        const cultureEfficiency = Math.min(irrigations / expectedIrrigations, 1);
        totalEfficiency += cultureEfficiency;
        cultureCount++;
      }
    });

    return cultureCount > 0 ? totalEfficiency / cultureCount : 0;
  }

  /**
   * Calcule le nombre d'irrigations attendues pour une culture
   * @param culture Données de la culture
   * @returns Nombre d'irrigations attendues
   */
  private getExpectedIrrigations(culture: CultureData): number {
    const plantingDate = new Date(culture.plantingDate);
    const now = new Date();
    const daysSincePlanting = Math.floor((now.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Nombre d'irrigations attendues par semaine selon le type de culture
    const irrigationsPerWeek: Record<string, number> = {
      'Tomate': 3,
      'Laitue': 2,
      'Maïs': 2
    };

    const expectedIrrigations = Math.floor((daysSincePlanting / 7) * (irrigationsPerWeek[culture.name] || 2));
    return Math.max(expectedIrrigations, 0);
  }
}

// Exporter une instance du service
const userService = new UserService();
export default userService; 