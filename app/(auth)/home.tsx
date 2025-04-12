import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebaseConfig';
import userService from '../../services/user.service';
import weatherService, { FormattedWeatherData } from '../../services/weather.service';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Coordonnées par défaut pour Cotonou, Bénin
const DEFAULT_COORDS = {
  latitude: 6.36,
  longitude: 2.42,
};

// Interface pour les cultures utilisateur
interface UserCrop {
  id: string;
  name: string;
  soilType: string;
  area: string;
  plantingDate: string;
}

// Images des cultures
const cropImages: { [key: string]: any } = {
  tomato: require('../../assets/images/culture_tomate.jpg.png'),
  lettuce: require('../../assets/images/lettuce.png'),
  corn: require('../../assets/images/corn.png'),
  // Ajouter d'autres cultures si nécessaire
};

export default function HomeScreen() {
  const { currentUser } = useAuth();
  const [userCrops, setUserCrops] = useState<UserCrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<FormattedWeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>("Localisation...");
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showWeatherDetails, setShowWeatherDetails] = useState(false);

  // Fonction pour demander la permission de géolocalisation et obtenir la position
  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission de localisation refusée');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);
      return location;
    } catch (error) {
      console.error('Erreur de géolocalisation:', error);
      setLocationError('Impossible d\'obtenir votre position');
      return null;
    }
  };

  // Fonction pour charger les données météo avec la position actuelle
  const fetchWeatherData = async () => {
    try {
      setWeatherLoading(true);
      setWeatherError(null);

      // Obtenir la position actuelle
      const currentLocation = await getLocation();
      if (!currentLocation) {
        throw new Error('Position non disponible');
      }

      // Récupérer les données météo pour la position actuelle
      const data = await weatherService.getWeatherData(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
      
      setWeatherData(data);
    } catch (error) {
      setWeatherError('Erreur lors de la récupération des données météo');
      console.error(error);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Fonction pour charger les cultures de l'utilisateur depuis Firestore
  const loadUserCrops = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = auth.currentUser;
      if (!user) {
        setError('Aucun utilisateur connecté');
        return;
      }
      
      const userData = await userService.getUserData(user.uid);
      
      if (userData && userData.crops && userData.crops.length > 0) {
        setUserCrops(userData.crops);
      } else {
        // Aucune culture trouvée
        setUserCrops([]);
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des cultures:', err);
      setError('Impossible de charger vos cultures');
    } finally {
      setLoading(false);
    }
  };
  
  // Charger les cultures au chargement de l'écran
  useEffect(() => {
    loadUserCrops();
    fetchWeatherData();
  }, []);

  // Fonction pour obtenir une image par défaut en fonction du nom de la culture
  const getCropImage = (cropId: string) => {
    return cropImages[cropId] || require('../../assets/images/culture_tomate.jpg.png'); // Image par défaut
  };
  
  // Fonction temporaire (simulation) pour les statuts d'irrigation
  const getIrrigationStatus = (cropId: string) => {
    // Dans une implémentation réelle, cela serait basé sur des calculs
    const statuses = ['Besoin d\'eau', 'Humidité optimale'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };
  
  // Fonction temporaire (simulation) pour les besoins en eau
  const getWaterNeeded = (cropId: string, area: string) => {
    // Dans une implémentation réelle, cela serait basé sur des calculs
    const baseNeeds = {
      tomato: 4,
      lettuce: 2.5,
      corn: 3
    };
    
    return `${baseNeeds[cropId as keyof typeof baseNeeds] || 3}L/m²`;
  };
  
  // Fonction temporaire (simulation) pour le prochain arrosage
  const getNextWateringTime = (cropId: string) => {
    // Dans une implémentation réelle, cela serait basé sur des calculs
    const times = [
      '17:00 - 18:00',
      '06:00 - 07:00 (demain)',
      '16:00 - 17:00'
    ];
    
    return times[Math.floor(Math.random() * times.length)];
  };

  const handleIrrigationDone = (id: string) => {
    // Logique pour marquer l'irrigation comme effectuée
    console.log('Irrigation effectuée pour la culture:', id);
    Alert.alert('Irrigation enregistrée', 'Votre action d\'irrigation a été enregistrée avec succès.');
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Mise à jour de la section météo dans le rendu
  const renderWeatherSection = () => {
    if (weatherLoading) {
      return (
        <View style={styles.weatherSection}>
          <View style={styles.weatherLoading}>
            <ActivityIndicator size="large" color={Colors.white} />
            <Text style={styles.weatherLoadingText}>Chargement des données météo...</Text>
          </View>
        </View>
      );
    }

    if (weatherError) {
      return (
        <View style={styles.weatherSection}>
          <View style={styles.weatherError}>
            <Ionicons name="alert-circle" size={24} color={Colors.white} />
            <Text style={styles.weatherErrorText}>{weatherError}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchWeatherData}
            >
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (!weatherData) return null;

    return (
      <View style={styles.weatherSection}>
        <LinearGradient
          colors={weatherData.backgroundGradient}
          style={styles.weatherGradient}
        >
          <View style={styles.weatherHeader}>
            <Text style={styles.weatherTitle}>Météo</Text>
            <Text style={styles.weatherLocation}>{weatherData.locationName}</Text>
          </View>
          
          <View style={styles.weatherMain}>
            <Ionicons 
              name={weatherData.weatherIcon as any} 
              size={72} 
              color={Colors.white} 
            />
            <View style={styles.weatherMainInfo}>
              <Text style={styles.weatherTemp}>
                {Math.round(weatherData.currentTemperature)}°C
              </Text>
              <Text style={styles.weatherDesc}>
                {weatherData.weatherDescription}
              </Text>
            </View>
          </View>

          <View style={styles.weatherGrid}>
            <View style={styles.weatherItem}>
              <FontAwesome5 name="temperature-high" size={20} color={Colors.white} />
              <Text style={styles.weatherValue}>{weatherData.currentTemperature}°C</Text>
              <Text style={styles.weatherLabel}>Température</Text>
            </View>
            <View style={styles.weatherItem}>
              <Ionicons name="water" size={20} color={Colors.white} />
              <Text style={styles.weatherValue}>{weatherData.currentHumidity}%</Text>
              <Text style={styles.weatherLabel}>Humidité</Text>
            </View>
            <View style={styles.weatherItem}>
              <Ionicons name="rainy" size={20} color={Colors.white} />
              <Text style={styles.weatherValue}>{weatherData.hourlyPrecipitation[0] || 0}mm</Text>
              <Text style={styles.weatherLabel}>Précipitations</Text>
            </View>
          </View>

          {weatherData.nextRainHours.length > 0 && (
            <View style={styles.rainForecast}>
              <Text style={styles.rainForecastTitle}>🌧️ Pluie prévue à :</Text>
              <Text style={styles.rainForecastHours}>
                {weatherData.nextRainHours.join(', ')}
              </Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => setShowWeatherDetails(true)}
          >
            <Text style={styles.detailsButtonText}>Voir les détails</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require('../../assets/images/acceuille.webp')}
      style={styles.backgroundImage}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
          />
          <Text style={styles.headerTitle}>SmartIrrigation</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/(auth)/settings')}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Message de bienvenue */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>
              Bonjour, {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Utilisateur'}
            </Text>
            <Text style={styles.subText}>
              Voici les recommandations pour vos cultures aujourd'hui
            </Text>
          </View>

          {/* Alerte Météo */}
          <View style={styles.alertContainer}>
            <View style={styles.alertContent}>
              <Ionicons name="warning" size={24} color="#FFA000" />
              <Text style={styles.alertText}>
                Température élevée demain, arrosez en fin de journée
              </Text>
            </View>
          </View>

          {/* Section Météo */}
          {renderWeatherSection()}

          {/* Liste des cultures */}
          <View style={styles.culturesContainer}>
            <Text style={styles.sectionTitle}>Vos Cultures</Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.white} />
                <Text style={styles.loadingText}>Chargement de vos cultures...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={40} color={Colors.white} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={loadUserCrops}
                >
                  <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            ) : userCrops.length === 0 ? (
              <View style={styles.noCropsContainer}>
                <FontAwesome5 name="seedling" size={40} color={Colors.white} />
                <Text style={styles.noCropsText}>
                  Vous n'avez pas encore configuré de cultures
                </Text>
                <TouchableOpacity 
                  style={styles.addCropButton}
                  onPress={() => router.push('/(auth)/crop-config')}
                >
                  <Text style={styles.addCropButtonText}>Ajouter des cultures</Text>
                </TouchableOpacity>
              </View>
            ) : (
              userCrops.map((crop) => {
                const status = getIrrigationStatus(crop.id);
                const waterNeeded = getWaterNeeded(crop.id, crop.area);
                const nextWatering = getNextWateringTime(crop.id);
                
                return (
                  <View key={crop.id} style={styles.cultureCard}>
                    <Image source={getCropImage(crop.id)} style={styles.cultureImage} />
                    <View style={styles.cultureInfo}>
                      <Text style={styles.cultureName}>{crop.name}</Text>
                      <View style={styles.cultureDetails}>
                        <View style={styles.detailItem}>
                          <Ionicons name="water" size={16} color={Colors.primary} />
                          <Text style={styles.detailText}>{waterNeeded}</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Ionicons name="time" size={16} color={Colors.primary} />
                          <Text style={styles.detailText}>{nextWatering}</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Ionicons name="leaf" size={16} color={Colors.primary} />
                          <Text style={styles.detailText}>
                            Sol: {crop.soilType}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Ionicons name="calendar" size={16} color={Colors.primary} />
                          <Text style={styles.detailText}>
                            Planté le: {formatDate(crop.plantingDate)}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, 
                          status === 'Humidité optimale' ? styles.statusOptimal : styles.statusNeedsWater
                        ]}>
                          <Text style={styles.statusText}>{status}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.irrigationButton}
                        onPress={() => handleIrrigationDone(crop.id)}
                      >
                        <Text style={styles.irrigationButtonText}>Marquer comme arrosé</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Navigation Bar */}
        <View style={styles.navbar}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={24} color={Colors.primary} />
            <Text style={[styles.navText, styles.activeNavText]}>Accueil</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/(auth)/irrigation')}
          >
            <Ionicons name="water" size={24} color={Colors.darkGray} />
            <Text style={styles.navText}>Irrigation</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/(auth)/conseils-ia')}
          >
            <Ionicons name="analytics" size={24} color={Colors.darkGray} />
            <Text style={styles.navText}>Conseils IA</Text>
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.primary,
  },
  logo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
  },
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    padding: 20,
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subText: {
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.white,
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  alertContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 248, 225, 0.95)',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA000',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  alertText: {
    marginLeft: 10,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: '#5D4037',
    flex: 1,
  },
  weatherSection: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  weatherGradient: {
    padding: 20,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  weatherTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
  },
  weatherLocation: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.white,
  },
  weatherLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  weatherLoadingText: {
    color: Colors.white,
    marginTop: 10,
    fontSize: 16,
  },
  weatherError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  weatherErrorText: {
    color: Colors.white,
    marginTop: 10,
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weatherItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  weatherValue: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
    marginVertical: 5,
  },
  weatherLabel: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.white,
  },
  culturesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
  },
  loadingText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    marginTop: 15,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
  },
  errorText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    marginTop: 15,
    marginBottom: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  noCropsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
  },
  noCropsText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    marginTop: 15,
    marginBottom: 15,
    textAlign: 'center',
  },
  addCropButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addCropButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
  cultureCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cultureImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  cultureInfo: {
    flex: 1,
  },
  cultureName: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.primary,
    marginBottom: 5,
  },
  cultureDetails: {
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    marginLeft: 5,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 5,
  },
  statusOptimal: {
    backgroundColor: '#4CAF50',
  },
  statusNeedsWater: {
    backgroundColor: '#FFA000',
  },
  statusText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'OpenSans-Bold',
  },
  irrigationButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  irrigationButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 12,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    marginTop: 4,
  },
  activeNavText: {
    fontFamily: 'Montserrat-Bold',
  },
  rainForecast: {
    marginTop: 15,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  rainForecastTitle: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    marginBottom: 5,
  },
  rainForecastHours: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  weatherMainInfo: {
    marginLeft: 20,
  },
  weatherTemp: {
    fontSize: 48,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
  },
  weatherDesc: {
    fontSize: 18,
    fontFamily: 'OpenSans-Regular',
    color: Colors.white,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  detailsButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'OpenSans-Bold',
    marginRight: 5,
  },
});
