/**
 * Service de génération de recommandations d'irrigation
 * Basé sur :
 * - les données météo
 * - le type de culture
 * - le type de sol
 * - les contraintes météo (pluie, humidité, chaleur)
 * - la superficie saisie par l'utilisateur
 * - l'heure actuelle (matin ou soir)
 */

// Coefficient culturaux (Kc) des principales cultures
export const KcValues: { [key: string]: number } = {
  "Tomate": 0.80,
  "Maïs": 0.95,
  "Laitue": 0.90,
  "Oignon": 0.8,
  "Carotte": 0.85,
  "Riz": 1.05,
  "Poivron": 0.8,
  "Aubergine": 0.85,
  "Default": 0.90 // Valeur par défaut
};

// Paramètres des types de sols
export const SoilParams: { [key: string]: { capaciteRetenue: number, intervalleIrrigation: number } } = {
  "Sablonneux": { capaciteRetenue: 80, intervalleIrrigation: 2 },
  "Argileux": { capaciteRetenue: 150, intervalleIrrigation: 4 },
  "Limoneux": { capaciteRetenue: 120, intervalleIrrigation: 3 },
  "Ferrallitique": { capaciteRetenue: 100, intervalleIrrigation: 3 },
  "Hydromorphe": { capaciteRetenue: 160, intervalleIrrigation: 5 },
  "Alluvial": { capaciteRetenue: 120, intervalleIrrigation: 3 },
  "Default": { capaciteRetenue: 100, intervalleIrrigation: 3 } // Valeur par défaut
};

export interface CultureData {
  nom: string;
  kc: number; // coefficient cultural
  stade?: string;
}

export interface SolData {
  nom: string;
  capaciteRetenue: number; // mm/m
  intervalleIrrigation: number; // jours
}

export interface WeatherData {
  tMax: number;
  tMin: number;
  rayonnement: number; // MJ/m²/jour
  humidite: number; // %
  pluie: boolean;
  pluiePrevue: boolean;
  heure: number; // Heure actuelle (0 à 23)
}

export interface Recommandation {
  culture: string;
  sol: string;
  volume: number; // litres/m²
  superficie: number; // m²
  total: number; // litres à arroser pour toute la parcelle
  frequence: string;
  moment: 'matin' | 'soir';
  contrainte: string | null;
  message: string;
}

/**
 * Calcule l'évapotranspiration de référence (ET0) selon la formule de Hargreaves
 * @param weather Données météorologiques
 * @returns La valeur ET0 en mm/jour
 */
export function calculET0(weather: WeatherData): number {
  const tMoy = (weather.tMax + weather.tMin) / 2;
  const amplitude = weather.tMax - weather.tMin;
  const racine = Math.sqrt(amplitude);
  const et0 = 0.0023 * (tMoy + 17.8) * racine * weather.rayonnement;
  return parseFloat(et0.toFixed(2));
}

/**
 * Génère une recommandation d'irrigation pour une culture donnée
 * @param culture Données de la culture
 * @param sol Données du sol
 * @param weather Données météorologiques
 * @param superficie Surface cultivée en m²
 * @returns Une recommandation d'irrigation complète
 */
export function genererRecommandation(
  culture: CultureData,
  sol: SolData,
  weather: WeatherData,
  superficie: number // Surface saisie par l'utilisateur
): Recommandation {
  const moment = weather.heure < 12 ? 'matin' : 'soir';
  const et0 = calculET0(weather);
  const etc = et0 * culture.kc;
  const volume = etc * sol.intervalleIrrigation;
  const total = volume * superficie;
  let contrainte: string | null = null;

  // Gestion des contraintes météo
  if (weather.humidite > 80) {
    contrainte = "Humidité élevée. Pas d'irrigation recommandée.";
  } else if (weather.pluie) {
    if (moment === 'matin') {
      contrainte = "Il pleut ce matin. Attendez ce soir pour voir l'évolution.";
    } else {
      contrainte = "Il pleut ce soir. La pluie suffit aujourd'hui.";
    }
  } else if (weather.pluiePrevue && moment === 'soir') {
    contrainte = "Pluie prévue ce soir. Arrosez le matin si ce n'est pas encore fait.";
  } else if (weather.tMax > 38) {
    contrainte = "Température très élevée. Privilégiez un arrosage très tôt le matin ou tard le soir.";
  }

  const frequence = `${sol.intervalleIrrigation} jours`;
  const message = contrainte
    ? contrainte
    : `Arrosez ${volume.toFixed(1)} L/m² (${total.toFixed(0)} L au total) tous les ${frequence} pour la culture de ${culture.nom} sur sol ${sol.nom}.`;

  return {
    culture: culture.nom,
    sol: sol.nom,
    volume: parseFloat(volume.toFixed(1)),
    superficie,
    total: parseFloat(total.toFixed(0)),
    frequence,
    moment,
    contrainte,
    message,
  };
}

/**
 * Crée des données météo simulées pour les tests
 * @param isRaining Indique s'il pleut actuellement
 * @param highHumidity Indique si l'humidité est élevée
 * @returns Données météo simulées
 */
export function createSimulatedWeatherData(
  isRaining = false, 
  highHumidity = false
): WeatherData {
  const now = new Date();
  const hour = now.getHours();
  
  return {
    tMax: 32,
    tMin: 26,
    rayonnement: 20,
    humidite: highHumidity ? 85 : 65,
    pluie: isRaining,
    pluiePrevue: false,
    heure: hour,
  };
}

/**
 * Convertit les données utilisateur de Firestore en format CultureData
 * @param name Nom de la culture
 * @returns Données de culture formatées
 */
export function convertToCultureData(name: string): CultureData {
  return {
    nom: name,
    kc: KcValues[name] || KcValues.Default,
    stade: "Croissance", // Valeur par défaut
  };
}

/**
 * Convertit les données de sol de Firestore en format SolData
 * @param name Nom du type de sol
 * @returns Données de sol formatées
 */
export function convertToSolData(name: string): SolData {
  const params = SoilParams[name] || SoilParams.Default;
  
  return {
    nom: name,
    capaciteRetenue: params.capaciteRetenue,
    intervalleIrrigation: params.intervalleIrrigation,
  };
}

/**
 * Convertit les données météo de l'API en format WeatherData
 * @param currentTemperature Température actuelle
 * @param maxTemperature Température maximale prévue
 * @param minTemperature Température minimale prévue
 * @param humidity Humidité relative
 * @param isRaining Indique s'il pleut actuellement
 * @param rainForecast Indique s'il pleuvra dans les prochaines heures
 * @returns Données météo formatées
 */
export function convertToWeatherData(
  currentTemperature: number,
  maxTemperature: number,
  minTemperature: number,
  humidity: number,
  isRaining: boolean,
  rainForecast: boolean
): WeatherData {
  const now = new Date();
  
  return {
    tMax: maxTemperature,
    tMin: minTemperature,
    rayonnement: calculateRadiation(now.getMonth()),
    humidite: humidity,
    pluie: isRaining,
    pluiePrevue: rainForecast,
    heure: now.getHours(),
  };
}

/**
 * Estime le rayonnement solaire en fonction du mois (valeurs approximatives pour le Bénin)
 * @param month Mois (0-11)
 * @returns Rayonnement solaire estimé en MJ/m²/jour
 */
function calculateRadiation(month: number): number {
  // Valeurs approximatives pour le Bénin selon la saison
  const radiationByMonth = [
    22, // Janvier
    23, // Février
    22, // Mars
    21, // Avril
    20, // Mai
    18, // Juin
    17, // Juillet
    17, // Août
    18, // Septembre
    19, // Octobre
    20, // Novembre
    21  // Décembre
  ];
  
  return radiationByMonth[month];
}

export default {
  genererRecommandation,
  calculET0,
  convertToCultureData,
  convertToSolData,
  convertToWeatherData,
  createSimulatedWeatherData,
  KcValues,
  SoilParams
};
