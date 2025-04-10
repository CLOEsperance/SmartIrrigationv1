import React, { useState } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { currentUser } = useAuth();
  const [cultures] = useState([
    {
      id: '1',
      name: 'Tomate',
      image: require('../../assets/images/culture_tomate.jpg.png'),
      waterNeeded: '4L/m²',
      status: 'Besoin d\'eau',
      nextWatering: '17:00 - 18:00',
    },
    {
      id: '2',
      name: 'Laitue',
      image: require('../../assets/images/lettuce.png'),
      waterNeeded: '2.5L/m²',
      status: 'Humidité optimale',
      nextWatering: '06:00 - 07:00 (demain)',
    },
    {
      id: '3',
      name: 'Maïs',
      image: require('../../assets/images/corn.png'),
      waterNeeded: '3L/m²',
      status: 'Besoin d\'eau',
      nextWatering: '16:00 - 17:00',
    },
  ]);

  const weatherData = {
    temperature: 28,
    humidity: 65,
    rain: 10,
    sunshine: 8,
  };

  const handleIrrigationDone = (id: string) => {
    // Logique pour marquer l'irrigation comme effectuée
    console.log('Irrigation effectuée pour la culture:', id);
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
          <View style={styles.weatherContainer}>
            <View style={styles.weatherHeader}>
              <Ionicons name="partly-sunny" size={24} color={Colors.white} />
              <Text style={styles.weatherTitle}>Météo du jour</Text>
            </View>
            <View style={styles.weatherGrid}>
              <View style={styles.weatherItem}>
                <FontAwesome5 name="temperature-high" size={20} color={Colors.white} />
                <Text style={styles.weatherValue}>{weatherData.temperature}°C</Text>
                <Text style={styles.weatherLabel}>Température</Text>
              </View>
              <View style={styles.weatherItem}>
                <Ionicons name="water" size={20} color={Colors.white} />
                <Text style={styles.weatherValue}>{weatherData.humidity}%</Text>
                <Text style={styles.weatherLabel}>Humidité</Text>
              </View>
              <View style={styles.weatherItem}>
                <Ionicons name="rainy" size={20} color={Colors.white} />
                <Text style={styles.weatherValue}>{weatherData.rain}mm</Text>
                <Text style={styles.weatherLabel}>Précipitations</Text>
              </View>
              <View style={styles.weatherItem}>
                <Ionicons name="sunny" size={20} color={Colors.white} />
                <Text style={styles.weatherValue}>{weatherData.sunshine}h</Text>
                <Text style={styles.weatherLabel}>Ensoleillement</Text>
              </View>
            </View>
          </View>

          {/* Liste des cultures */}
          <View style={styles.culturesContainer}>
            <Text style={styles.sectionTitle}>Vos Cultures</Text>
            {cultures.map((culture) => (
              <View key={culture.id} style={styles.cultureCard}>
                <Image source={culture.image} style={styles.cultureImage} />
                <View style={styles.cultureInfo}>
                  <Text style={styles.cultureName}>{culture.name}</Text>
                  <View style={styles.cultureDetails}>
                    <View style={styles.detailItem}>
                      <Ionicons name="water" size={16} color={Colors.primary} />
                      <Text style={styles.detailText}>{culture.waterNeeded}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="time" size={16} color={Colors.primary} />
                      <Text style={styles.detailText}>{culture.nextWatering}</Text>
                    </View>
                    <View style={[styles.statusBadge, 
                      culture.status === 'Humidité optimale' ? styles.statusOptimal : styles.statusNeedsWater
                    ]}>
                      <Text style={styles.statusText}>{culture.status}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.irrigationButton}
                    onPress={() => handleIrrigationDone(culture.id)}
                  >
                    <Text style={styles.irrigationButtonText}>Marquer comme arrosé</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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
  weatherContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
    backgroundColor: 'rgba(73, 151, 222, 0.9)',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  weatherTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
    marginLeft: 10,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weatherItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  weatherValue: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
    marginVertical: 8,
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
});
