import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../firebaseConfig';
import userService from '../../services/user.service';
// Pour une implémentation réelle, nous utiliserions le module expo-location
// import * as Location from 'expo-location';

// Dimensions de l'écran
const { width, height } = Dimensions.get('window');

// Coordonnées simulées pour le Bénin (centre du pays)
const BENIN_COORDS = {
  latitude: 9.3077,
  longitude: 2.3158,
  region: "Bénin Central"
};

export default function InitialConfigScreen() {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Dans une implémentation réelle, nous stockerions les vrais coordonnées
  const [userLocation, setUserLocation] = useState(BENIN_COORDS);

  const handleEnableLocation = async () => {
    setIsLoading(true);
    try {
      // Vérifier que l'utilisateur est connecté
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Erreur", "Vous devez être connecté pour configurer votre localisation");
        return;
      }

      // Dans une implémentation réelle, nous utiliserions expo-location
      // 1. Demander la permission
      // const { status } = await Location.requestForegroundPermissionsAsync();
      // if (status !== 'granted') {
      //   Alert.alert("Permission refusée", "L'accès à la localisation est nécessaire pour fournir des recommandations précises.");
      //   return;
      // }
      
      // 2. Obtenir la position actuelle
      // const location = await Location.getCurrentPositionAsync({});
      // const userCoordinates = {
      //   latitude: location.coords.latitude,
      //   longitude: location.coords.longitude,
      //   region: "À déterminer" // Pourrait être déterminé par géocodage inverse
      // };
      
      // Simulation d'une requête de géolocalisation (à remplacer par du code réel)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Enregistrer la localisation dans Firestore
      await userService.updateUserLocation(
        user.uid, 
        userLocation.latitude, 
        userLocation.longitude, 
        userLocation.region
      );
      
      setLocationEnabled(true);
      
      // Navigation automatique vers l'écran suivant une fois la localisation activée
      router.push('/(auth)/crop-config');
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement de la localisation:", error);
      Alert.alert(
        "Erreur de localisation",
        "Impossible d'accéder à votre position. Veuillez vérifier les paramètres de localisation de votre appareil.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/signup.jpg.webp')}
      style={styles.backgroundImage}
    >
      <StatusBar style="light" />
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.configForm}>
              <Image 
                source={require('../../assets/images/logo.png')}
                style={styles.logo}
              />
            <Text style={styles.title}>Configuration Initiale</Text>
              <Text style={styles.subtitle}>Votre localisation</Text>
              
              <Text style={styles.locationText}>
                {locationEnabled 
                  ? "Votre position a été détectée et affichée sur la carte."
                  : "Activez votre localisation pour voir votre position sur la carte."}
              </Text>

              <Text style={styles.locationImportance}>
                La localisation est nécessaire pour :
                {'\n'}- Identifier les types de sols disponibles dans votre région
                {'\n'}- Obtenir des prévisions météo précises
                {'\n'}- Recevoir des recommandations d'irrigation adaptées
              </Text>

              {/* Zone de la carte */}
              <View style={styles.mapContainer}>
                <Image 
                  source={require('../../assets/images/map-benin.png')} 
                  style={styles.mapImage}
                  resizeMode="contain"
                />
                {locationEnabled && (
                  <View style={styles.markerContainer}>
                    <View style={styles.marker}>
                      <Ionicons name="location" size={24} color={Colors.primary} />
                    </View>
                  </View>
                )}
              </View>

              {/* Bouton d'activation de la localisation */}
              {!locationEnabled && (
                <TouchableOpacity
                  style={[styles.enableLocationButton, isLoading && styles.enableLocationButtonDisabled]}
                  onPress={handleEnableLocation}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Text style={styles.enableLocationText}>Activation en cours...</Text>
                  ) : (
                    <>
                      <Ionicons name="location" size={20} color={Colors.white} />
                      <Text style={styles.enableLocationText}>Activer la localisation</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
          </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 30,
    alignItems: 'center',
  },
  configForm: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 600,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    textAlign: 'center',
    marginBottom: 16,
  },
  locationImportance: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    marginBottom: 20,
    lineHeight: 20,
  },
  mapContainer: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -24 }],
  },
  marker: {
    width: 24,
    height: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  enableLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  enableLocationButtonDisabled: {
    opacity: 0.7,
  },
  enableLocationText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
}); 