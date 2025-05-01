import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '../../contexts/AuthContext';
import { FormattedWeatherData } from '../../services/weather.service';
import weatherService from '../../services/weather.service';
import userService from '../../services/user.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IrrigationForecastChart from '../../components/charts/IrrigationForecastChart';

const screenWidth = Dimensions.get('window').width;

// Interface pour les données de culture
interface CultureData {
  id: string;
  name: string;
  soilType: string;
  plantingDate: string;
  area: number;
}

// DONNÉES DE DÉMONSTRATION pour le développement
const DEMO_CULTURES: CultureData[] = [
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

// DONNÉES MÉTÉO DE DÉMONSTRATION
const DEMO_WEATHER: FormattedWeatherData = {
  currentTemperature: 36,
  currentHumidity: 85,
  currentWeatherCode: 3,
  forecastHours: ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00"],
  hourlyTemperatures: [26, 27, 29, 32, 34, 35],
  hourlyHumidity: [80, 78, 75, 70, 68, 65],
  hourlyPrecipitation: [0, 0, 0, 0, 0, 0],
  weatherDescription: "Partiellement nuageux",
  nextRainHours: ["14:00", "15:00", "16:00"],
  locationName: "Porto-Novo, Bénin",
  weatherIcon: "partly-sunny",
  backgroundGradient: ['#4A90E2', '#87CEEB'],
  isNight: false,
  cloudCover: 50,
  windSpeed: 10,
  windDirection: 180,
  shortwave_radiation_sum: 22.5,
  dailyForecast: {
    maxTemperatures: [36, 34, 35, 33, 34, 36, 35],
    minTemperatures: [24, 23, 24, 23, 22, 23, 24],
    precipitationSum: [0, 5, 10, 2, 0, 0, 3],
    precipitationProbability: [10, 60, 80, 40, 20, 10, 30]
  }
};

// Interfaces pour les calculs d'irrigation
interface BaseWaterNeeds {
  [key: string]: {
    [key: string]: number;
  };
}

interface SoilFactors {
  [key: string]: number;
}

const baseNeeds: BaseWaterNeeds = {
  Tomate: { initial: 2.0, développement: 2.5, floraison: 3.0, maturité: 2.8 },
  Laitue: { initial: 1.5, développement: 1.8, floraison: 2.0, maturité: 1.9 },
  Maïs: { initial: 2.5, développement: 3.0, floraison: 3.5, maturité: 3.2 },
};

const soilFactors: SoilFactors = {
  Sablonneux: 1.2, // Besoin plus fréquent
  Argileux: 0.8,   // Retient mieux l'eau
  Limoneux: 1.0,   // Équilibré
};

// Type pour les cultures supportées
type SupportedCulture = 'Tomate' | 'Laitue' | 'Maïs';
type SupportedSoilType = 'Sablonneux' | 'Argileux' | 'Limoneux';

// Vérification du type de culture
const isSupportedCulture = (culture: string): culture is SupportedCulture => {
  return ['Tomate', 'Laitue', 'Maïs'].includes(culture);
};

// Type pour les icônes supportées
type SupportedIcon = 'thunderstorm' | 'thermometer' | 'water-outline' | 'rainy' | 'leaf' | 'analytics' | 'home' | 'water' | 'person';

// Vérification du type d'icône
const isSupportedIcon = (icon: string): icon is SupportedIcon => {
  return ['thunderstorm', 'thermometer', 'water-outline', 'rainy', 'leaf', 'analytics', 'home', 'water', 'person'].includes(icon);
};

export default function ConseilsIAScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userCultures, setUserCultures] = useState<CultureData[]>([]);
  const [selectedCulture, setSelectedCulture] = useState<CultureData | null>(null);
  const [weatherData, setWeatherData] = useState<FormattedWeatherData | null>(null);
  const [irrigationData, setIrrigationData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Charger les cultures de l'utilisateur
        const culturesData = await userService.getUserCultures(currentUser?.uid);
        
        // 2. Charger les données météo
        const weather = await weatherService.getCurrentWeather();
        
        // Mettre à jour les états
        setUserCultures(culturesData);
        setSelectedCulture(culturesData[0]);
        setWeatherData(weather);
        
        // 3. Générer des prévisions d'irrigation sur 7 jours
        generateIrrigationForecast(culturesData);
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        // En cas d'erreur, utiliser les données de démonstration
        setUserCultures(DEMO_CULTURES);
        setSelectedCulture(DEMO_CULTURES[0]);
        setWeatherData(DEMO_WEATHER);
        generateIrrigationForecast(DEMO_CULTURES);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Générer des prévisions d'irrigation intelligentes
  const generateIrrigationForecast = (cultures: CultureData[]) => {
    if (!cultures || cultures.length === 0) return;

    // Calcul des besoins en eau basé sur:
    // - Stade de croissance
    // - Type de sol
    // - Conditions météo
    // - Historique d'irrigation
    const forecastData = [];
    
    for (let i = 0; i < 7; i++) {
      const dayData: any = {
        date: DAYS_FR[i],
      };

      // Calculer les besoins pour chaque culture
      cultures.forEach(culture => {
        const growthStage = getGrowthStage(culture.plantingDate);
        const soilFactor = getSoilFactor(culture.soilType);
        
        // Facteurs qui influencent les besoins en eau
        const baseNeed = getBaseWaterNeed(culture.name, growthStage.stage);
        const weatherFactor = getWeatherFactor(i);
        const soilMoisture = getSoilMoistureFactor(culture.soilType, i);
        
        // Calcul final avec tous les facteurs
        const waterNeed = baseNeed * weatherFactor * soilFactor * soilMoisture;
        
        // Ajouter au jour
        switch (culture.name) {
          case 'Tomate':
            dayData.tomato = waterNeed;
            break;
          case 'Laitue':
            dayData.lettuce = waterNeed;
            break;
          case 'Maïs':
            dayData.corn = waterNeed;
            break;
        }
      });

      forecastData.push(dayData);
    }

    setIrrigationData(forecastData);
  };

  // Fonctions utilitaires pour le calcul des besoins en eau
  const getBaseWaterNeed = (culture: string, stage: string): number => {
    return baseNeeds[culture]?.[stage] || 2.0; // Valeur par défaut si non trouvé
  };

  const getSoilFactor = (soilType: string): number => {
    return soilFactors[soilType] || 1.0; // Valeur par défaut si non trouvé
  };

  const getWeatherFactor = (dayOffset: number): number => {
    if (!weatherData?.dailyForecast) return 1.0;
    
    const temp = weatherData.dailyForecast.maxTemperatures[dayOffset];
    const rainProb = weatherData.dailyForecast.precipitationProbability[dayOffset];
    
    let factor = 1.0;
    
    // Ajustement selon la température
    if (temp > 35) factor *= 1.3;
    else if (temp > 30) factor *= 1.2;
    else if (temp < 25) factor *= 0.9;
    
    // Ajustement selon la probabilité de pluie
    if (rainProb > 70) factor *= 0.5;
    else if (rainProb > 40) factor *= 0.7;
    
    return factor;
  };

  const getSoilMoistureFactor = (soilType: string, dayOffset: number): number => {
    // Simulation de l'humidité du sol basée sur:
    // - Type de sol
    // - Précipitations récentes
    // - Température
    let factor = 1.0;
    
    if (weatherData?.dailyForecast) {
      const recentRain = weatherData.dailyForecast.precipitationSum
        .slice(Math.max(0, dayOffset - 2), dayOffset + 1)
        .reduce((sum, rain) => sum + rain, 0);
      
      if (recentRain > 20) factor *= 0.6;
      else if (recentRain > 10) factor *= 0.8;
    }
    
    // Ajustement selon le type de sol
    switch (soilType) {
      case 'Sablonneux':
        factor *= 1.2; // Sèche plus vite
        break;
      case 'Argileux':
        factor *= 0.8; // Retient mieux l'eau
        break;
      case 'Limoneux':
        factor *= 1.0; // Équilibré
        break;
    }
    
    return factor;
  };

  // Déterminer le stade de croissance
  const getGrowthStage = (plantingDate: string): { stage: string, daysPlanted: number } => {
    const now = new Date();
    const planted = new Date(plantingDate);
    const msPerDay = 1000 * 3600 * 24;
    const daysPlanted = Math.floor((now.getTime() - planted.getTime()) / msPerDay);

    let stage = "initial";
    if (daysPlanted <= 20) stage = "initial";
    else if (daysPlanted <= 40) stage = "développement";
    else if (daysPlanted <= 70) stage = "floraison";
    else stage = "maturité";

    return { stage, daysPlanted };
  };

  // Obtenir des conseils IA basés sur les données météo et la culture
  const getAIAdvice = (): { icon: string, title: string, description: string, color: string }[] => {
    if (!weatherData || !selectedCulture) {
      return [];
    }

    const advice = [];
    const { stage } = getGrowthStage(selectedCulture.plantingDate);
    const isHighTemperature = weatherData.currentTemperature >= 35;
    const isHighHumidity = weatherData.currentHumidity >= 80;
    const isRainForecast = weatherData.dailyForecast.precipitationProbability[0] >= 50;
    const isStorm = weatherData.currentWeatherCode >= 95;

    // 1. Alertes prioritaires
    if (isStorm) {
      advice.push({
        icon: 'thunderstorm',
        title: '⚠️ Alerte orage',
        description: `👉 Protégez vos plants de ${selectedCulture.name} des vents violents et de la grêle possible. Renforcez les tuteurs si nécessaire.`,
        color: Colors.danger
      });
    }

    // 2. Stress thermique
    if (isHighTemperature) {
      let specificAdvice = "";
      
      if (selectedCulture.name === "Tomate") {
        specificAdvice = `👉 Température élevée (${Math.round(weatherData.currentTemperature)}°C) : Pour vos tomates au stade de ${stage}, arrosez tôt ce matin ou tard le soir pour éviter l'évaporation et les brûlures.`;
      } else if (selectedCulture.name === "Laitue") {
        specificAdvice = `👉 Température élevée (${Math.round(weatherData.currentTemperature)}°C) : La laitue est sensible au stress thermique à ce stade de ${stage}. Créez de l'ombre et arrosez avant 7h ou après 18h.`;
      } else if (selectedCulture.name === "Maïs") {
        specificAdvice = `👉 Température élevée (${Math.round(weatherData.currentTemperature)}°C) : Le maïs en ${stage} a besoin d'eau supplémentaire. Augmentez le volume d'irrigation de 15%.`;
      }
      
      advice.push({
        icon: 'thermometer',
        title: 'Stress thermique détecté',
        description: specificAdvice,
        color: '#FF6B6B'
      });
    }

    // 3. Humidité élevée
    if (isHighHumidity) {
      advice.push({
        icon: 'water-outline',
        title: 'Humidité élevée',
        description: `👉 Humidité > ${Math.round(weatherData.currentHumidity)}% : Diminuez la quantité d'eau de moitié. Pour vos ${selectedCulture.name}, cela prévient les maladies fongiques.`,
        color: '#4ECDC4'
      });
    }

    // 4. Pluie prévue
    if (isRainForecast && !isStorm) {
      advice.push({
        icon: 'rainy',
        title: 'Pluie prévue',
        description: `👉 Pluie prévue aujourd'hui (${weatherData.dailyForecast.precipitationProbability[0]}% de probabilité) : Adaptez l'irrigation de vos ${selectedCulture.name} en conséquence.`,
        color: '#45B7D1'
      });
    }

    // 5. Stade de croissance et conseils spécifiques
    if (advice.length < 3) {
      let stageAdvice = "";
      
      if (stage === "initial") {
        stageAdvice = `👉 Vos ${selectedCulture.name} sont au stade initial. Le sol doit rester humide mais pas détrempé. Arrosages légers mais fréquents.`;
      } else if (stage === "développement") {
        stageAdvice = `👉 Vos ${selectedCulture.name} sont en plein développement. C'est une phase cruciale pour l'irrigation qui détermine le rendement final.`;
      } else if (stage === "floraison") {
        stageAdvice = `👉 Vos ${selectedCulture.name} sont en floraison. L'irrigation régulière est essentielle pour la formation des fruits/grains.`;
      } else {
        stageAdvice = `👉 Vos ${selectedCulture.name} approchent de la maturité. Maintenez une irrigation régulière jusqu'à la récolte complète.`;
      }
      
      advice.push({
        icon: 'leaf',
        title: `Stade de croissance: ${stage}`,
        description: stageAdvice,
        color: '#45B7D1'
      });
    }

    return advice.slice(0, 3);
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Analyse des données en cours...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      
      <ScrollView style={styles.scrollView}>
        {/* En-tête avec sélection de culture */}
      <View style={styles.header}>
          <Text style={styles.title}>Conseils IA</Text>
          <View style={styles.culturesContainer}>
                  {userCultures.map((culture) => (
                    <TouchableOpacity
                      key={culture.id}
                      style={[
                  styles.cultureButton,
                  selectedCulture?.id === culture.id && styles.cultureButtonActive
                      ]}
                      onPress={() => setSelectedCulture(culture)}
                    >
                <Text style={[
                  styles.cultureButtonText,
                  selectedCulture?.id === culture.id && styles.cultureButtonTextActive
                ]}>
                        {culture.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
          </View>
              </View>

        {/* Graphique des prévisions */}
        {irrigationData && selectedCulture && isSupportedCulture(selectedCulture.name) && (
          <IrrigationForecastChart
                    data={irrigationData}
            selectedCulture={selectedCulture.name}
          />
            )}

            {/* Conseils IA */}
            <View style={styles.adviceContainer}>
          <Text style={styles.sectionTitle}>Conseils personnalisés</Text>
          {getAIAdvice().map((advice, index) => (
                <Animated.View 
                  key={index}
                  entering={FadeInUp.delay(index * 200)}
                  style={styles.adviceCard}
                >
                  <LinearGradient
                colors={['#ffffff', '#f8f9fa']}
                    style={styles.adviceGradient}
                  >
                <View style={styles.adviceHeader}>
                  {isSupportedIcon(advice.icon) && (
                    <Ionicons name={advice.icon} size={24} color={advice.color} />
                  )}
                  <Text style={[styles.adviceTitle, { color: advice.color }]}>
                    {advice.title}
                  </Text>
                    </View>
                <Text style={styles.adviceDescription}>
                  {advice.description}
                </Text>
                  </LinearGradient>
                </Animated.View>
              ))}
            </View>
      </ScrollView>

      {/* Barre de navigation */}
      <View style={styles.navbar}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(auth)/home')}
        >
          <Ionicons name="home" size={24} color={Colors.darkGray} />
          <Text style={styles.navText}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(auth)/irrigation')}
        >
          <Ionicons name="water" size={24} color={Colors.darkGray} />
          <Text style={styles.navText}>Irrigation</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="analytics" size={24} color={Colors.primary} />
          <Text style={[styles.navText, styles.activeNavText]}>Conseils IA</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(auth)/profile')}
        >
          <Ionicons name="person" size={24} color={Colors.darkGray} />
          <Text style={styles.navText}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.darkGray,
    textAlign: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 16,
  },
  culturesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cultureButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
  },
  cultureButtonActive: {
    backgroundColor: Colors.primary,
  },
  cultureButtonText: {
    fontSize: 14,
    color: Colors.darkGray,
  },
  cultureButtonTextActive: {
    color: Colors.white,
  },
  adviceContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 16,
  },
  adviceCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  adviceGradient: {
    padding: 16,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  adviceDescription: {
    fontSize: 14,
    color: Colors.darkGray,
    lineHeight: 20,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: Colors.darkGray,
    marginTop: 4,
  },
  activeNavText: {
    color: Colors.primary,
  },
}); 