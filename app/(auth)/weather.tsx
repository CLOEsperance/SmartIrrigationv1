import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';

export default function WeatherScreen() {
  const weatherData = {
    temperature: 28,
    humidity: 65,
    rain: 10,
    sunshine: 8,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.headerTitle}>Météo</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Section Météo */}
        <View style={styles.weatherContainer}>
          <View style={styles.weatherHeader}>
            <Ionicons name="partly-sunny" size={24} color={Colors.white} />
            <Text style={styles.weatherTitle}>Météo du jour</Text>
          </View>
          <View style={styles.weatherGrid}>
            <View style={styles.weatherItem}>
              <Ionicons name="thermometer" size={24} color={Colors.white} />
              <Text style={styles.weatherValue}>{weatherData.temperature}°C</Text>
              <Text style={styles.weatherLabel}>Température</Text>
            </View>
            <View style={styles.weatherItem}>
              <Ionicons name="water" size={24} color={Colors.white} />
              <Text style={styles.weatherValue}>{weatherData.humidity}%</Text>
              <Text style={styles.weatherLabel}>Humidité</Text>
            </View>
            <View style={styles.weatherItem}>
              <Ionicons name="rainy" size={24} color={Colors.white} />
              <Text style={styles.weatherValue}>{weatherData.rain}mm</Text>
              <Text style={styles.weatherLabel}>Précipitations</Text>
            </View>
            <View style={styles.weatherItem}>
              <Ionicons name="sunny" size={24} color={Colors.white} />
              <Text style={styles.weatherValue}>{weatherData.sunshine}h</Text>
              <Text style={styles.weatherLabel}>Ensoleillement</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Navigation Bar */}
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
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(auth)/conseils-ia')}
        >
          <Ionicons name="analytics" size={24} color={Colors.darkGray} />
          <Text style={styles.navText}>Conseils IA</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(auth)/settings')}
        >
          <Ionicons name="settings" size={24} color={Colors.darkGray} />
          <Text style={styles.navText}>Paramètres</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    height: 56,
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
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  weatherContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(73, 151, 222, 0.9)',
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
    marginLeft: 8,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weatherItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
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
}); 