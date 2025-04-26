/**
 * recommendation.service.ts
 * Service de génération de recommandations d'irrigation,
 * basé sur :
 *  - la météo (ET₀ via Hargreaves)
 *  - le stade de croissance (via date de plantation → Kc dynamique)
 *  - le type de sol (rétention & intervalle)
 *  - la superficie de l'utilisateur
 *  - le moment de la journée (matin / soir)
 */

//////////////////////
// Interfaces
//////////////////////

/** Données de la culture renseignées par l'utilisateur */
interface CultureData {
  nom:                 string;  // Ex : "Tomate", "Maïs", "Laitue"
  datePlantation:      string;  // ISO string, ex: "2024-04-01"
}

/** Données du sol renseignées par l'utilisateur */
interface SolData {
  nom:                 string;  // Ex : "Ferrugineux", "Alluvial", etc.
  capaciteRetenue:     number;  // Capacité de rétention en mm/m (ex: 60)
  intervalleIrrigation:number;  // Intervalle conseillé en jours (ex: 3)
}

/** Données météo récupérées en temps réel */
interface WeatherData {
  tMax:        number;  // Température max (°C)
  tMin:        number;  // Température min (°C)
  rayonnement: number;  // Rayonnement solaire (MJ/m²/jour)
  humidite:    number;  // Humidité relative (%)
  pluie:       boolean; // Il pleut actuellement ?
  pluiePrevue: boolean; // Pluie prévue dans la journée ?
  heure:       number;  // Heure actuelle (0–23)
}

/** Format de la recommandation renvoyée à l'UI */
interface Recommandation {
  culture:     string;
  sol:         string;
  volume:      number; // Litre/m² pour un cycle d'irrigation
  superficie:  number; // m²
  total:       number; // litres totaux à arroser
  frequence:   string; // "1 jour", "3 jours", etc.
  moment:      'matin' | 'soir';
  contrainte:  string | null; // Message météo spécial
  message:     string;        // Recommandation finale à afficher
  plageHoraire: string;       // Plage horaire optimale (ex: "6:00 - 8:00")
  stade?:      string;        // Stade de croissance (pour le debug)
  kc?:         number;        // Coefficient cultural (pour le debug)
  et0?:        number;        // ET₀ calculée (pour le debug)
  etc?:        number;        // ETc calculée (pour le debug)
}

//////////////////////
// 1) STOCKAGE DES COEFFICIENTS CULTURAUX (Kc)
//////////////////////

/**
 * kcData[culture][stade] → coefficient cultural.
 * On récupère dynamiquement en fonction de la date de plantation.
 */
const kcData: Record<string, Record<string, number>> = {
  tomate: {
    initial:      0.45,
    developpement:0.75,
    floraison:    1.15,
    fin:          0.80,
  },
  mais: {
    initial:      0.50,
    developpement:0.80,
    floraison:    1.15,
    fin:          0.85,
  },
  maïs: {  // Alternative avec accent
    initial:      0.50,
    developpement:0.80,
    floraison:    1.15,
    fin:          0.85,
  },
  laitue: {
    initial:      0.60,
    developpement:0.80,
    floraison:    0.90,
    fin:          0.75,
  },
  oignon: {
    initial:      0.50,
    developpement:0.70,
    floraison:    1.00,
    fin:          0.75,
  },
  piment: {
    initial:      0.35,
    developpement:0.70,
    floraison:    1.05,
    fin:          0.90,
  },
  aubergine: {
    initial:      0.45,
    developpement:0.75,
    floraison:    1.15,
    fin:          0.80,
  },
  carotte: {
    initial:      0.40,
    developpement:0.75,
    floraison:    1.05,
    fin:          0.90,
  },
  haricot: {
    initial:      0.40,
    developpement:0.70,
    floraison:    1.10,
    fin:          0.30,
  },
};

//////////////////////
// 2) DÉTECTION DU STADE DE CROISSANCE
//////////////////////

/**
 * Détermine le stade de croissance (initial, developpement, floraison, fin)
 * à partir de la date de plantation.
 */
function getStadeCroissance(datePlantation: string): string {
  const maintenant = new Date();
  const plante     = new Date(datePlantation);
  const msParJour  = 1000 * 3600 * 24;
  // Nombre de jours depuis la plantation
  const jours      = Math.floor((maintenant.getTime() - plante.getTime()) / msParJour);

  if (jours <= 20) return "initial";
  if (jours <= 40) return "developpement";
  if (jours <= 70) return "floraison";
  return "fin";
}

/**
 * Récupère le Kc pour une culture et un stade donné.
 * Fallback à 0.8 si introuvable.
 */
function getKc(culture: string, stade: string): number {
  if (!culture || !stade) return 0.8;
  const keyCulture = culture.toLowerCase().trim();
  return kcData[keyCulture]?.[stade] ?? 0.8;
}

//////////////////////
// 3) CALCUL DE L'EVAPOTRANSPIRATION DE RÉFÉRENCE (ET₀)
//////////////////////

/**
 * Calcule ET₀ via la formule de Hargreaves :
 * ET₀ = 0.0023 × (T_moy + 17.8) × √(T_max - T_min) × Ra
 * Où Ra est le rayonnement solaire (MJ/m²/jour).
 */
function calculET0(weather: WeatherData): number {
  const tMoy     = (weather.tMax + weather.tMin) / 2;     // Température moyenne
  const amplitude= weather.tMax - weather.tMin;          // Amplitude journalière
  const racine   = Math.sqrt(amplitude);                  // √(Tmax - Tmin)
  const et0      = 0.0023 * (tMoy + 17.8) * racine * weather.rayonnement;
  // On arrondit à 2 décimales
  return parseFloat(et0.toFixed(2));
}

//////////////////////
// 4) GÉNÉRATION DE LA RECOMMANDATION FINALE
//////////////////////

function genererRecommandation(
  culture: CultureData,
  sol:      SolData,
  weather:  WeatherData,
  superficie: number
): Recommandation {
  try {
    // Validation des données d'entrée
    if (!culture?.nom) {
      throw new Error("Le nom de la culture est manquant");
    }
    
    if (!culture?.datePlantation) {
      throw new Error("La date de plantation est manquante");
    }
    
    if (!sol?.nom) {
      throw new Error("Le type de sol est manquant");
    }
    
    if (sol?.intervalleIrrigation === undefined) {
      throw new Error("L'intervalle d'irrigation du sol est manquant");
    }
    
    if (sol?.capaciteRetenue === undefined) {
      throw new Error("La capacité de rétention du sol est manquante");
    }
    
    if (!weather || weather.tMax === undefined || weather.tMin === undefined) {
      throw new Error("Les données météorologiques de température sont manquantes");
    }
    
    if (weather.humidite === undefined) {
      throw new Error("Le taux d'humidité est manquant dans les données météorologiques");
    }
    
    if (weather.rayonnement === undefined) {
      throw new Error("Les données de rayonnement solaire sont manquantes");
    }
    
    if (superficie <= 0) {
      throw new Error("La superficie doit être supérieure à zéro");
    }
    
    // 1. Matin / Soir
    const moment = weather.heure < 12 ? 'matin' : 'soir';
  
    // 2. Stade & Kc dynamique
    const stade = getStadeCroissance(culture.datePlantation);
    const kc     = getKc(culture.nom, stade);
  
    // 3. ET₀ → ETc
    const et0 = calculET0(weather);
    const etc = et0 * kc;  // mm/jour pour cette culture/stade
  
    // 4. Volume en L/m² = ETc × intervalle du sol
    const volume = etc * sol.intervalleIrrigation;
  
    // 5. Total litres sur la parcelle
    const total = volume * superficie;
  
    // 6. Gestion des contraintes météo
    let contrainte: string | null = null;
    if (weather.humidite > 80) {
      contrainte = "Humidité élevée. Pas d'irrigation recommandée.";
    } else if (weather.pluie) {
      contrainte = moment === 'matin'
        ? "Il pleut ce matin. Attendez ce soir pour voir l'évolution."
        : "Il pleut ce soir. La pluie suffit aujourd'hui.";
    } else if (weather.pluiePrevue && moment === 'soir') {
      contrainte = "Pluie prévue ce soir. Arrosez le matin si ce n'est pas encore fait.";
    } else if (weather.tMax > 38) {
      contrainte = "Température très élevée. Arrosez tôt le matin ou tard le soir.";
    }
  
    // 7. Déterminer les plages horaires optimales
    let plageHoraire = '';
    if (moment === 'matin') {
      plageHoraire = '6:00 - 8:00';
    } else {
      plageHoraire = '17:00 - 19:00';  
    }
    
    // 8. Fréquence et message final
    const frequence = `${sol.intervalleIrrigation} jour(s)`;
    let message = '';
    
    if (contrainte) {
      message = contrainte;
    } else {
      message = `Arrosez ${volume.toFixed(1)} L/m² (${total.toFixed(0)} L total) tous les ${frequence} ` +
        `pour ${culture.nom} (${stade}) sur sol ${sol.nom}.`;
    }
  
    return {
      culture:    culture.nom,
      sol:        sol.nom,
      volume:     parseFloat(volume.toFixed(1)),
      superficie,
      total:      parseFloat(total.toFixed(0)),
      frequence,
      moment,
      contrainte,
      message,
      plageHoraire,
      stade,
      kc,
      et0,
      etc,
    };
  } catch (error) {
    console.error("Erreur lors de la génération de la recommandation:", error);
    throw error; // Propager l'erreur au lieu de retourner une recommandation par défaut
  }
}

/**
 * Convertit un nom de culture en objet CultureData
 * avec une date de plantation par défaut si non spécifiée
 */
function convertToCultureData(nomCulture: string, datePlantation?: string): CultureData {
  return {
    nom: nomCulture,
    datePlantation: datePlantation || new Date().toISOString().slice(0, 10)
  };
}

/**
 * Convertit un nom de sol en objet SolData
 * avec des valeurs par défaut basées sur le type de sol
 */
function convertToSolData(typeSol: string): SolData {
  // Valeurs par défaut basées sur le type de sol
  let capaciteRetenue = 60;
  let intervalleIrrigation = 3;
  
  // Ajuster les valeurs en fonction du type de sol
  switch(typeSol.toLowerCase()) {
    case 'sablonneux':
      capaciteRetenue = 40;
      intervalleIrrigation = 2;
      break;
    case 'argileux':
      capaciteRetenue = 80;
      intervalleIrrigation = 4;
      break;
    case 'limoneux':
      capaciteRetenue = 60;
      intervalleIrrigation = 3;
      break;
    case 'ferrugineux':
      capaciteRetenue = 55;
      intervalleIrrigation = 3;
      break;
    case 'alluvial':
      capaciteRetenue = 65;
      intervalleIrrigation = 3;
      break;
    // Ajouter d'autres types au besoin
  }
  
  return {
    nom: typeSol,
    capaciteRetenue,
    intervalleIrrigation
  };
}

// Regrouper toutes les fonctions pour l'export par défaut
const recommendationService = {
  genererRecommandation,
  calculET0,
  getStadeCroissance,
  getKc,
  convertToCultureData,
  convertToSolData
};

export { 
  genererRecommandation, 
  calculET0,
  getStadeCroissance,
  getKc,
  convertToCultureData,
  convertToSolData,
  type CultureData,
  type SolData,
  type WeatherData,
  type Recommandation 
};

// Export par défaut pour l'utilisation comme service
export default recommendationService;
