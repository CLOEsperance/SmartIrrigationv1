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
import { 
  CultureData, 
  SolData, 
  WeatherData, 
  Recommandation,
  convertToCultureData,
  convertToSolData,
  genererRecommandation
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
    if (currentUser) {
      console.log("Chargement des données utilisateur et météo");
      loadUserDataAndWeather();
    } else {
      console.log("Utilisateur non connecté, impossible de charger les données");
    }
  }, [currentUser]);

  // Générer une recommandation chaque fois que l'utilisateur change de culture sélectionnée
  // ou que les données météo changent
  useEffect(() => {
    if (userCrops.length > 0 && weatherData) {
      console.log("Données disponibles, génération de recommandation");
      generateRecommendation();
    } else {
      console.log("Données incomplètes pour générer une recommandation");
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
      
      console.log("Récupération des données pour l'utilisateur:", currentUser.uid);
      
      // Récupérer les données de l'utilisateur à partir de Firestore
      const userData = await userService.getUserData(currentUser.uid);
      
      if (!userData) {
        throw new Error('Profil utilisateur non trouvé. Veuillez configurer votre profil.');
      }
      
      if (!userData.crops || userData.crops.length === 0) {
        throw new Error('Aucune culture configurée. Veuillez ajouter des cultures dans votre profil.');
      }
      
      console.log("Données utilisateur récupérées:", JSON.stringify(userData));
      
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
      let isLocalFromDB = false;
      
      if (!userData.location || !userData.location.latitude || !userData.location.longitude) {
        // Si les données de localisation ne sont pas dans Firebase, demander la permission pour les obtenir
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          
          if (status !== 'granted') {
            throw new Error('La permission de localisation est nécessaire pour des recommandations précises.');
          }
          
          console.log("Permission accordée, récupération de la localisation actuelle");
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High
          });
          
          if (!currentLocation || !currentLocation.coords) {
            throw new Error('Impossible de récupérer votre position actuelle.');
          }
          
          location = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude
          };
          
          console.log("Localisation récupérée:", location);
          
          // Sauvegarder la localisation dans Firebase pour utilisation future
          await userService.updateUserLocation(
            currentUser.uid, 
            location.latitude, 
            location.longitude
          );
          console.log("Localisation sauvegardée dans la base de données");
        } catch (locationError) {
          console.error("Erreur lors de l'accès à la géolocalisation:", locationError);
          throw new Error("L'accès à votre position est nécessaire pour générer des recommandations d'irrigation précises.");
        }
      } else {
        // Utiliser les données de localisation de Firebase
        console.log("Utilisation de la localisation stockée dans Firebase:", 
          userData.location.latitude, userData.location.longitude);
        location = {
          latitude: userData.location.latitude,
          longitude: userData.location.longitude
        };
        isLocalFromDB = true;
      }
      
      if (!location) {
        throw new Error("Impossible de déterminer votre localisation. Vérifiez les permissions ou essayez de mettre à jour votre profil.");
      }
      
      // Récupérer les données météo en temps réel
      console.log("Récupération des données météo pour la localisation:", location);
      try {
        const weather = await weatherService.getWeatherData(
          location.latitude,
          location.longitude,
          isLocalFromDB
        );
        
        if (!weather) {
          throw new Error("Impossible de récupérer les données météo pour votre localisation.");
        }
        
        console.log("Données météo récupérées:", 
          `Température: ${weather.currentTemperature}°C, ` +
          `Humidité: ${weather.currentHumidity}%, ` +
          `Conditions: ${weather.weatherDescription}, ` +
          `Localisation: ${weather.locationName}`
        );
        
        // Vérifier si la localisation a un nom valide
        if (!weather.locationName || weather.locationName === "Localisation inconnue") {
          // Essayer de récupérer le nom de la localisation manuellement
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=10&accept-language=fr`,
              {
                headers: {
                  'Accept': 'application/json',
                  'User-Agent': 'SmartIrrigation/1.0'
                }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data && data.address) {
                // Utiliser le nom le plus précis disponible
                const locationName = data.address.village || 
                                     data.address.town || 
                                     data.address.city || 
                                     data.address.municipality ||
                                     data.address.county ||
                                     data.address.state;
                
                if (locationName) {
                  weather.locationName = locationName;
                  console.log("Nom de localisation mis à jour:", locationName);
                }
              }
            }
          } catch (nameError) {
            console.error("Erreur lors de la récupération du nom de localisation:", nameError);
            // Continuer sans interrompre le flux
          }
        }
        
        setWeatherData(weather);
      } catch (weatherError) {
        console.error("Erreur lors de la récupération des données météo:", weatherError);
        throw new Error("Impossible de récupérer les données météo en temps réel. Veuillez vérifier votre connexion internet.");
      }
      
    } catch (error: any) {
      console.error('Erreur lors du chargement des données:', error);
      setError(error.message || "Une erreur s'est produite lors du chargement des données");
    } finally {
      setLoading(false);
      setWeatherLoading(false);
    }
  };

  // Générer une recommandation d'irrigation pour la culture sélectionnée
  const generateRecommendation = () => {
    try {
      if (!weatherData || userCrops.length === 0) {
        console.log("Données météo ou cultures non disponibles, impossible de générer une recommandation");
        return;
      }
      
      const selectedCrop = userCrops[selectedCultureIndex];
      console.log("Génération de recommandation pour la culture:", selectedCrop.name);
      
      // Vérifier que toutes les données nécessaires sont disponibles
      if (!selectedCrop.plantingDate) {
        console.error("Date de plantation manquante pour la culture", selectedCrop.name);
        Alert.alert(
          "Données incomplètes",
          `La date de plantation pour ${selectedCrop.name} est manquante. Veuillez mettre à jour vos informations de culture.`
        );
        return;
      }
      
      if (!selectedCrop.soilType) {
        console.error("Type de sol manquant pour la culture", selectedCrop.name);
        Alert.alert(
          "Données incomplètes",
          `Le type de sol pour ${selectedCrop.name} est manquant. Veuillez mettre à jour vos informations de culture.`
        );
        return;
      }
      
      if (!selectedCrop.area || parseFloat(selectedCrop.area) <= 0) {
        console.error("Superficie invalide pour la culture", selectedCrop.name);
        Alert.alert(
          "Données incomplètes",
          `La superficie pour ${selectedCrop.name} est invalide. Veuillez mettre à jour vos informations de culture.`
        );
        return;
      }
      
      // Convertir les données de culture au format attendu par le service
      const cultureData: CultureData = convertToCultureData(selectedCrop.name, selectedCrop.plantingDate);
      
      // Convertir les données de sol au format attendu par le service
      const solData: SolData = convertToSolData(selectedCrop.soilType);
      
      // Vérifier les données météo
      if (!weatherData.hourlyTemperatures || weatherData.hourlyTemperatures.length === 0) {
        console.error("Données de température horaires manquantes");
        Alert.alert(
          "Données météo incomplètes",
          "Impossible de générer une recommandation d'irrigation précise. Les données météo sont incomplètes."
        );
        return;
      }
      
      if (weatherData.currentHumidity === undefined || weatherData.shortwave_radiation_sum === undefined) {
        console.error("Données d'humidité ou de rayonnement solaire manquantes");
        Alert.alert(
          "Données météo incomplètes",
          "Impossible de générer une recommandation d'irrigation précise. Certaines données météo essentielles sont manquantes."
        );
        return;
      }
      
      // Créer les données météo au format attendu par le service
      const isRaining = weatherData.weatherDescription?.toLowerCase().includes('pluie') || 
                        weatherData.weatherDescription?.toLowerCase().includes('bruine');
      
      const rainForecast = weatherData.nextRainHours?.length > 0;
      
      // Utiliser uniquement les données météo réelles, sans aucune valeur par défaut
      const weatherDataForRecommendation: WeatherData = {
        tMax: Math.max(...weatherData.hourlyTemperatures.slice(0, 24)),
        tMin: Math.min(...weatherData.hourlyTemperatures.slice(0, 24)),
        rayonnement: weatherData.shortwave_radiation_sum,
        humidite: weatherData.currentHumidity,
        pluie: isRaining,
        pluiePrevue: rainForecast,
        heure: new Date().getHours(),
      };
      
      console.log("Données météo pour recommandation:", JSON.stringify(weatherDataForRecommendation, null, 2));
      
      // Convertir la superficie en nombre
      const area = parseFloat(selectedCrop.area);
      
      // Générer la recommandation avec uniquement des données réelles
      const reco = genererRecommandation(
        cultureData,
        solData,
        weatherDataForRecommendation,
        area
      );
      
      console.log("Recommandation générée:", JSON.stringify(reco, null, 2));
      
      // Vérifier que la recommandation a été générée correctement
      if (!reco || reco.volume <= 0) {
        console.error("La recommandation générée n'est pas valide");
        Alert.alert(
          "Erreur",
          "Impossible de générer une recommandation d'irrigation valide avec les données disponibles."
        );
        return;
      }
      
      setRecommendation(reco);
      
    } catch (error: any) {
      console.error('Erreur lors de la génération de la recommandation:', error);
      Alert.alert(
        "Erreur",
        `Impossible de générer une recommandation d'irrigation: ${error.message || "Erreur inconnue"}`
      );
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
          <Text style={styles.loadingText}>
            {loading ? "Chargement des données utilisateur..." : "Récupération des données météo en temps réel..."}
          </Text>
          <Text style={styles.loadingSubtext}>
            Nous récupérons les données pour générer des recommandations précises
          </Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorSubtext}>
            Les recommandations d'irrigation nécessitent des données actualisées.
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={loadUserDataAndWeather}
          >
            <Ionicons name="refresh" size={20} color={Colors.white} />
            <Text style={styles.refreshButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (weatherError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={48} color={Colors.warning} />
          <Text style={styles.errorText}>{weatherError}</Text>
          <Text style={styles.errorSubtext}>
            Les données météo en temps réel sont nécessaires pour les recommandations d'irrigation.
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={loadUserDataAndWeather}
          >
            <Ionicons name="refresh" size={20} color={Colors.white} />
            <Text style={styles.refreshButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (userCrops.length === 0) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="leaf" size={48} color={Colors.primary} />
          <Text style={styles.errorText}>Aucune culture configurée</Text>
          <Text style={styles.errorSubtext}>
            Vous devez ajouter au moins une culture pour recevoir des recommandations d'irrigation.
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => router.push('/(auth)/profile')}
          >
            <Ionicons name="add-circle" size={20} color={Colors.white} />
            <Text style={styles.refreshButtonText}>Configurer mon profil</Text>
          </TouchableOpacity>
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
              <Text style={styles.weatherLocation}>
                {weatherData.locationName || "Position actuelle"}
              </Text>
              {weatherData.isLocalFromDB ? (
                <View style={styles.locationBadge}>
                  <Text style={styles.locationBadgeText}>Enregistrée</Text>
                </View>
              ) : (
                <View style={[styles.locationBadge, styles.locationBadgeLive]}>
                  <Text style={styles.locationBadgeText}>Temps réel</Text>
                </View>
              )}
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
            <View style={styles.weatherFooter}>
              <Text style={styles.weatherFooterText}>
                <Ionicons name="water-outline" size={14} color={Colors.darkGray} /> Humidité: {weatherData.currentHumidity}%
              </Text>
              <Text style={styles.weatherFooterText}>
                <Ionicons name="time-outline" size={14} color={Colors.darkGray} /> Mis à jour à {new Date().toLocaleTimeString()}
              </Text>
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
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    textAlign: 'center',
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
  refreshButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
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
  locationBadge: {
    backgroundColor: Colors.blue,
    borderRadius: 8,
    padding: 4,
    marginLeft: 8,
  },
  locationBadgeText: {
    fontSize: 12,
    fontFamily: 'OpenSans-Regular',
    color: Colors.white,
  },
  locationBadgeLive: {
    backgroundColor: '#4CAF50',
  },
  weatherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  weatherFooterText: {
    fontSize: 12,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
}); 