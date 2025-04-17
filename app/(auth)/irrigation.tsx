import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import userService, { UserData } from '../../services/user.service';
import weatherService, { FormattedWeatherData } from '../../services/weather.service';
import recommendationService, { 
  CultureData, 
  SolData, 
  WeatherData, 
  Recommandation,
  convertToCultureData,
  convertToSolData
} from '../../services/recommendations.service';
import IrrigationCard from '../../components/recommendations/IrrigationCard';
import AlertBanner from '../../components/recommendations/AlertBanner';
import * as Location from 'expo-location';

type TabType = 'besoins' | 'historique';

interface IrrigationHistory {
  date: string;
  culture: string;
  quantity: string;
  isCompleted: boolean;
}

interface CropDetails {
  id: string;
  name: string;
  soilType: string;
  area: string;
  plantingDate: string;
  image: any;  // Pour l'image locale
}

export default function IrrigationScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('besoins');
  const [selectedCultureIndex, setSelectedCultureIndex] = useState(0);
  const [userCrops, setUserCrops] = useState<CropDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<FormattedWeatherData | null>(null);
  const [recommendation, setRecommendation] = useState<Recommandation | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  
  // Obtenir l'utilisateur actuellement connecté
  const { currentUser } = useAuth();

  // Mapping des images locales pour les cultures
  const cropImages: {[key: string]: any} = {
    'Tomate': require('../../assets/images/culture_tomate.jpg.png'),
    'Maïs': require('../../assets/images/culture_tomate.jpg.png'),
    'Laitue': require('../../assets/images/culture_tomate.jpg.png'),
    // Valeur par défaut si l'image n'est pas trouvée
    'default': require('../../assets/images/culture_tomate.jpg.png')
  };

  const [irrigationHistory] = useState<IrrigationHistory[]>([
    {
      date: '15/05/2023',
      culture: 'Tomate',
      quantity: '2.5L/m²',
      isCompleted: true,
    },
    {
      date: '14/05/2023',
      culture: 'Tomate',
      quantity: '2.5L/m²',
      isCompleted: true,
    },
    {
      date: '13/05/2023',
      culture: 'Tomate',
      quantity: '2.5L/m²',
      isCompleted: false,
    },
    {
      date: '12/05/2023',
      culture: 'Tomate',
      quantity: '2.5L/m²',
      isCompleted: true,
    },
    {
      date: '11/05/2023',
      culture: 'Tomate',
      quantity: '2.5L/m²',
      isCompleted: true,
    },
    {
      date: '10/05/2023',
      culture: 'Tomate',
      quantity: '2.5L/m²',
      isCompleted: false,
    },
    {
      date: '09/05/2023',
      culture: 'Tomate',
      quantity: '2.5L/m²',
      isCompleted: true,
    },
  ]);

  // Charger les données utilisateur et météo
  useEffect(() => {
    loadUserDataAndWeather();
  }, [currentUser]);

  // Générer une recommandation chaque fois que l'utilisateur change de culture sélectionnée
  // ou que les données météo changent
  useEffect(() => {
    if (userCrops.length > 0 && weatherData) {
      generateRecommendation();
    }
  }, [selectedCultureIndex, weatherData, userCrops]);

  // Charger les données utilisateur à partir de Firestore et les données météo
  const loadUserDataAndWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      setWeatherLoading(true);
      setWeatherError(null);
      
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }
      
      // Récupérer les données de l'utilisateur à partir de Firestore
      const userData = await userService.getUserData(currentUser.uid);
      
      if (!userData || !userData.crops || userData.crops.length === 0) {
        throw new Error('Aucune culture configurée');
      }
      
      // Transformer les données des cultures pour inclure les images
      const cropDetails: CropDetails[] = userData.crops.map(crop => {
        // Obtenir l'image correspondante ou l'image par défaut
        const image = cropImages[crop.name] || cropImages.default;
        
        return {
          ...crop,
          image,
        };
      });
      
      setUserCrops(cropDetails);
      
      // Récupérer les coordonnées de l'utilisateur pour la météo
      let location;
      
      if (userData.location) {
        // Utiliser la localisation stockée
        location = {
          latitude: userData.location.latitude,
          longitude: userData.location.longitude
        };
      } else {
        // Demander la permission de localisation
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          // Utiliser des coordonnées par défaut pour Cotonou
          location = { latitude: 6.36, longitude: 2.42 };
        } else {
          const currentLocation = await Location.getCurrentPositionAsync({});
          location = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude
          };
          
          // Sauvegarder la localisation pour utilisation future
          await userService.updateUserLocation(
            currentUser.uid, 
            location.latitude, 
            location.longitude
          );
        }
      }
      
      // Récupérer les données météo
      const weather = await weatherService.getWeatherData(
        location.latitude,
        location.longitude
      );
      
      setWeatherData(weather);
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des données:', error);
      setError(error.message);
      setWeatherError('Impossible de récupérer les données météo');
    } finally {
      setLoading(false);
      setWeatherLoading(false);
    }
  };

  // Générer une recommandation d'irrigation pour la culture sélectionnée
  const generateRecommendation = () => {
    try {
      if (!weatherData || userCrops.length === 0) return;
      
      const selectedCrop = userCrops[selectedCultureIndex];
      
      // Convertir les données de culture au format attendu par le service
      const cultureData: CultureData = convertToCultureData(selectedCrop.name);
      
      // Convertir les données de sol au format attendu par le service
      const solData: SolData = convertToSolData(selectedCrop.soilType);
      
      // Créer les données météo au format attendu par le service
      const isRaining = weatherData.weatherDescription.toLowerCase().includes('pluie') || 
                        weatherData.weatherDescription.toLowerCase().includes('bruine');
      
      const rainForecast = weatherData.nextRainHours.length > 0;
      
      const weatherDataForRecommendation: WeatherData = {
        tMax: Math.max(...weatherData.hourlyTemperatures.slice(0, 24)),
        tMin: Math.min(...weatherData.hourlyTemperatures.slice(0, 24)),
        rayonnement: 20, // Valeur approximative
        humidite: weatherData.currentHumidity,
        pluie: isRaining,
        pluiePrevue: rainForecast,
        heure: new Date().getHours(),
      };
      
      // Convertir la superficie en nombre
      const area = parseFloat(selectedCrop.area) || 100; // Valeur par défaut si non définie
      
      // Générer la recommandation
      const reco = recommendationService.genererRecommandation(
        cultureData,
        solData,
        weatherDataForRecommendation,
        area
      );
      
      setRecommendation(reco);
      
    } catch (error: any) {
      console.error('Erreur lors de la génération de la recommandation:', error);
      setRecommendation(null);
    }
  };

  // Marquer une recommandation comme complétée
  const handleMarkComplete = () => {
    Alert.alert(
      "Irrigation effectuée",
      "Voulez-vous marquer cette irrigation comme effectuée?",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Confirmer",
          onPress: () => {
            Alert.alert(
              "Parfait!",
              "Cette irrigation a été marquée comme effectuée",
              [{ text: "OK" }]
            );
          }
        }
      ]
    );
  };

  const renderBesoinsTab = () => {
    if (loading || weatherLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorSubtext}>
            Veuillez configurer vos cultures dans les paramètres de votre profil.
          </Text>
        </View>
      );
    }
    
    if (userCrops.length === 0) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="leaf" size={48} color={Colors.primary} />
          <Text style={styles.errorText}>Aucune culture configurée</Text>
          <Text style={styles.errorSubtext}>
            Veuillez configurer vos cultures dans les paramètres de votre profil.
          </Text>
        </View>
      );
    }
    
    const selectedCulture = userCrops[selectedCultureIndex];
    
    return (
      <ScrollView style={styles.tabContent}>
        {userCrops.length > 1 && (
          <View style={styles.culturePicker}>
            <Text style={styles.culturePickerLabel}>Sélectionnez une culture:</Text>
            <View style={styles.culturePickerButtons}>
              {userCrops.map((crop, index) => (
                <TouchableOpacity
                  key={crop.id}
                  style={[
                    styles.culturePickerButton,
                    selectedCultureIndex === index && styles.culturePickerButtonActive
                  ]}
                  onPress={() => setSelectedCultureIndex(index)}
                >
                  <Text 
                    style={[
                      styles.culturePickerButtonText,
                      selectedCultureIndex === index && styles.culturePickerButtonTextActive
                    ]}
                  >
                    {crop.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {weatherData && (
          <View style={styles.weatherContainer}>
            <View style={styles.weatherHeader}>
              <Ionicons name="location" size={16} color={Colors.darkGray} />
              <Text style={styles.weatherLocation}>{weatherData.locationName}</Text>
            </View>
            <View style={styles.weatherDetails}>
              <Ionicons 
                name={weatherData.isNight ? "moon" : "sunny"} 
                size={24} 
                color={Colors.primary} 
              />
              <Text style={styles.weatherTemp}>{weatherData.currentTemperature}°C</Text>
              <Text style={styles.weatherDesc}>{weatherData.weatherDescription}</Text>
            </View>
          </View>
        )}

        {weatherError && (
          <AlertBanner
            message="Impossible de récupérer les données météo actuelles. Les recommandations pourraient ne pas être précises."
            type="warning"
          />
        )}

        {recommendation && (
          <IrrigationCard
            volume={recommendation.volume}
            totalVolume={recommendation.total}
            frequency={recommendation.frequence}
            moment={recommendation.moment}
            message={recommendation.message}
            constraint={recommendation.contrainte}
            culture={recommendation.culture}
            sol={recommendation.sol}
            weatherIcon={weatherData?.weatherIcon || 'sunny'}
            onMarkComplete={handleMarkComplete}
          />
        )}

        <View style={styles.cultureHeader}>
          <Image source={selectedCulture.image} style={styles.cultureImage} />
          <Text style={styles.cultureName}>{selectedCulture.name}</Text>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type de sol:</Text>
            <Text style={styles.infoValue}>{selectedCulture.soilType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Superficie:</Text>
            <Text style={styles.infoValue}>{selectedCulture.area} m²</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Planté le:</Text>
            <Text style={styles.infoValue}>{formatDate(selectedCulture.plantingDate)}</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderHistoriqueTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.calendarContainer}>
        <TouchableOpacity>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.monthText}>Mai 2023</Text>
        <TouchableOpacity>
          <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDaysContainer}>
        {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((day) => (
          <Text key={day} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>

      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Historique d'irrigation</Text>
        {irrigationHistory.map((item, index) => (
          <View key={index} style={styles.historyItem}>
            <View style={styles.historyDate}>
              <Text style={styles.historyDateText}>{item.date}</Text>
            </View>
            <View style={styles.historyDetails}>
              <Text style={styles.historyText}>{item.culture}</Text>
              <Text style={styles.historyText}>{item.quantity}</Text>
            </View>
            <View style={styles.historyStatus}>
              {item.isCompleted ? (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              ) : (
                <Ionicons name="close-circle" size={24} color="#F44336" />
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  // Format date for display
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Irrigation</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/(auth)/settings')}
        >
          <Ionicons name="settings-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'besoins' && styles.activeTab]}
          onPress={() => setActiveTab('besoins')}
        >
          <Text style={[styles.tabText, activeTab === 'besoins' && styles.activeTabText]}>
            Besoins
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'historique' && styles.activeTab]}
          onPress={() => setActiveTab('historique')}
        >
          <Text style={[styles.tabText, activeTab === 'historique' && styles.activeTabText]}>
            Historique
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'besoins' ? renderBesoinsTab() : renderHistoriqueTab()}

      {/* Navigation Bar */}
      <View style={styles.navbar}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => router.push('/(auth)/home')}
        >
          <Ionicons name="home" size={24} color={Colors.darkGray} />
          <Text style={styles.navText}>Accueil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="water" size={24} color={Colors.primary} />
          <Text style={[styles.navText, styles.activeNavText]}>Irrigation</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
  },
  activeTabText: {
    color: Colors.primary,
  },
  tabContent: {
    flex: 1,
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    textAlign: 'center',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    textAlign: 'center',
  },
  culturePicker: {
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
  },
  culturePickerLabel: {
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    marginBottom: 10,
  },
  culturePickerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  culturePickerButton: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  culturePickerButtonActive: {
    backgroundColor: Colors.primary,
  },
  culturePickerButtonText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  culturePickerButtonTextActive: {
    color: Colors.white,
  },
  weatherContainer: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weatherLocation: {
    marginLeft: 4,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  weatherDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherTemp: {
    marginLeft: 10,
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
  },
  weatherDesc: {
    marginLeft: 10,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  cultureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  cultureImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  cultureName: {
    marginLeft: 16,
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
  },
  infoContainer: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.darkGray,
  },
  highlightedInfo: {
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
    borderBottomWidth: 0,
  },
  highlightedText: {
    color: Colors.primary,
  },
  irrigationButton: {
    backgroundColor: Colors.primary,
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  irrigationButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.white,
  },
  monthText: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.primary,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#E8F5E9',
  },
  weekDayText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  historyContainer: {
    backgroundColor: Colors.white,
    marginTop: 1,
    padding: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.primary,
    marginBottom: 15,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  historyDate: {
    width: 100,
  },
  historyDateText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  historyDetails: {
    flex: 1,
  },
  historyText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  historyStatus: {
    width: 40,
    alignItems: 'center',
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
    color: Colors.primary,
  },
}); 