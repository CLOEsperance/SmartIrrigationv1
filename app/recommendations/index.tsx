import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import IrrigationCard from '@/components/recommendations/IrrigationCard';
import AlertBanner from '@/components/recommendations/AlertBanner';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { 
  genererRecommandation, 
  type CultureData, 
  type SolData, 
  type WeatherData, 
  type Recommandation 
} from '@/services/recommendations.service';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import WeatherService from '@/services/weather.service';

// Récupérer la fonction du service météo
const getWeatherData = async (lat: number, lon: number) => {
  // Créer une instance de WeatherService sans constructeur
  const weatherService = WeatherService;
  return await weatherService.getWeatherData(lat, lon);
};

export default function RecommendationsScreen() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<Recommandation | null>(null);
  const [weatherIcon, setWeatherIcon] = useState('sunny');

  // Function to mark irrigation as completed
  const handleMarkComplete = () => {
    // Implement functionality to mark irrigation as completed
    // This could update Firestore, show a confirmation, etc.
    alert('Irrigation marquée comme complétée !');
  };

  // Get current weather condition for icon
  const determineWeatherIcon = (weather: WeatherData) => {
    if (weather.pluie) return 'rainy';
    if (weather.pluiePrevue) return 'cloudy';
    if (weather.humidite > 80) return 'partly-sunny';
    if (weather.tMax > 35) return 'sunny';
    return 'partly-sunny';
  };

  // Load user data and generate recommendation
  const loadRecommendation = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user's culture data from Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        setError("Aucune donnée utilisateur trouvée. Veuillez configurer vos cultures.");
        setLoading(false);
        return;
      }
      
      const userData = userDoc.data();
      
      // Vérification des champs obligatoires
      if (!userData.culture?.nom) {
        setError("Données utilisateur incomplètes : type de culture manquant");
        setLoading(false);
        return;
      }
      
      if (!userData.culture?.datePlantation) {
        setError("Données utilisateur incomplètes : date de plantation manquante");
        setLoading(false);
        return;
      }
      
      if (!userData.sol?.nom) {
        setError("Données utilisateur incomplètes : type de sol manquant");
        setLoading(false);
        return;
      }
      
      if (userData.sol?.capaciteRetenue === undefined) {
        setError("Données utilisateur incomplètes : capacité de rétention du sol manquante");
        setLoading(false);
        return;
      }
      
      if (userData.sol?.intervalleIrrigation === undefined) {
        setError("Données utilisateur incomplètes : intervalle d'irrigation manquant");
        setLoading(false);
        return;
      }
      
      if (userData.superficie === undefined) {
        setError("Données utilisateur incomplètes : superficie manquante");
        setLoading(false);
        return;
      }
      
      if (!userData.location?.latitude || !userData.location?.longitude) {
        setError("Données utilisateur incomplètes : localisation manquante");
        setLoading(false);
        return;
      }
      
      // Get culture data
      const culture: CultureData = {
        nom: userData.culture.nom,
        datePlantation: userData.culture.datePlantation
      };
      
      // Get soil data
      const sol: SolData = {
        nom: userData.sol.nom,
        capaciteRetenue: userData.sol.capaciteRetenue,
        intervalleIrrigation: userData.sol.intervalleIrrigation
      };
      
      // Get surface area
      const superficie = userData.superficie;
      
      // Récupération des données météo dynamiques
      try {
        const formattedWeather = await getWeatherData(
          userData.location.latitude,
          userData.location.longitude
        );
        
        // Conversion des données météo au format attendu par le service de recommandations
        const weather: WeatherData = {
          tMax: formattedWeather.dailyForecast.maxTemperatures[0] || 30,
          tMin: formattedWeather.dailyForecast.minTemperatures[0] || 22,
          rayonnement: formattedWeather.shortwave_radiation_sum || 20, 
          humidite: formattedWeather.currentHumidity || 65,
          pluie: formattedWeather.hourlyPrecipitation[0] > 0.5, // Pluie si > 0.5mm
          pluiePrevue: formattedWeather.nextRainHours.length > 0,
          heure: new Date().getHours()
        };
        
        // Set weather icon
        setWeatherIcon(formattedWeather.weatherIcon || determineWeatherIcon(weather));
        
        // Generate recommendation
        const reco = genererRecommandation(culture, sol, weather, superficie);
        setRecommendation(reco);
        
      } catch (weatherError) {
        console.error("Erreur lors de la récupération des données météo:", weatherError);
        
        // Fallback sur des données simulées en cas d'erreur
        const now = new Date();
        const weather: WeatherData = {
          tMax: 32,
          tMin: 26,
          rayonnement: 20,
          humidite: 65,
          pluie: false,
          pluiePrevue: false,
          heure: now.getHours()
        };
        
        setWeatherIcon(determineWeatherIcon(weather));
        
        // Generate recommendation with fallback data
        const reco = genererRecommandation(culture, sol, weather, superficie);
        setRecommendation(reco);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error loading recommendation:", err);
      setError("Erreur lors de la génération de la recommandation. Veuillez réessayer.");
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadRecommendation();
  }, [currentUser]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecommendation();
    setRefreshing(false);
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title">Recommandations d'Irrigation</ThemedText>
        <ThemedText style={styles.subtitle}>
          Recommandations basées sur les conditions météo et vos cultures
        </ThemedText>
      </ThemedView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.blue} />
          <ThemedText style={styles.loadingText}>
            Calcul des recommandations...
          </ThemedText>
        </View>
      ) : error ? (
        <AlertBanner 
          message={error} 
          type="danger" 
        />
      ) : recommendation ? (
        <View style={styles.recommendationContainer}>
          <IrrigationCard
            culture={recommendation.culture}
            sol={recommendation.sol}
            volume={recommendation.volume}
            totalVolume={recommendation.total}
            frequency={recommendation.frequence}
            moment={recommendation.moment}
            message={recommendation.message}
            constraint={recommendation.contrainte}
            weatherIcon={weatherIcon}
            plageHoraire={recommendation.plageHoraire}
            onMarkComplete={handleMarkComplete}
          />
          
          {/* Explication de la recommandation */}
          <ThemedView style={styles.explanationCard}>
            <View style={styles.explanationHeader}>
              <Ionicons name="information-circle" size={24} color={Colors.blue} />
              <ThemedText style={styles.explanationTitle}>
                Comprendre cette recommandation
              </ThemedText>
            </View>
            <ThemedText style={styles.explanationText}>
              Cette recommandation est basée sur la formule d'évapotranspiration de Hargreaves,
              adaptée au stade de croissance de votre {recommendation.culture} et au type de sol {recommendation.sol}.
            </ThemedText>
          </ThemedView>
        </View>
      ) : (
        <ThemedView style={styles.emptyContainer}>
          <Ionicons name="water-outline" size={64} color={Colors.blue} />
          <ThemedText style={styles.emptyText}>
            Aucune recommandation disponible
          </ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Configurez vos cultures dans les paramètres
          </ThemedText>
        </ThemedView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  recommendationContainer: {
    gap: 16,
  },
  explanationCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  explanationText: {
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    marginTop: 8,
    opacity: 0.7,
    textAlign: 'center',
  },
});
