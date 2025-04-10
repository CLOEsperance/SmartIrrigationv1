import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';

type TabType = 'besoins' | 'historique';

interface IrrigationHistory {
  date: string;
  culture: string;
  quantity: string;
  isCompleted: boolean;
}

export default function IrrigationScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('besoins');
  const [selectedCulture] = useState({
    name: 'Tomate',
    image: require('../../assets/images/culture_tomate.jpg.png'),
    soilType: 'Argileux',
    area: '100m²',
    plantedDate: '15/03/2023',
    waterNeed: '2.5L/m²',
    optimalTime: '17:00 - 18:00',
  });

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

  const renderBesoinsTab = () => (
    <ScrollView style={styles.tabContent}>
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
          <Text style={styles.infoValue}>{selectedCulture.area}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Planté le:</Text>
          <Text style={styles.infoValue}>{selectedCulture.plantedDate}</Text>
        </View>
        <View style={[styles.infoRow, styles.highlightedInfo]}>
          <Text style={[styles.infoLabel, styles.highlightedText]}>Besoin en eau:</Text>
          <Text style={[styles.infoValue, styles.highlightedText]}>{selectedCulture.waterNeed}</Text>
        </View>
        <View style={[styles.infoRow, styles.highlightedInfo]}>
          <Text style={[styles.infoLabel, styles.highlightedText]}>Heure optimale:</Text>
          <Text style={[styles.infoValue, styles.highlightedText]}>{selectedCulture.optimalTime}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.irrigationButton}>
        <Text style={styles.irrigationButtonText}>Marquer comme arrosé</Text>
      </TouchableOpacity>
    </ScrollView>
  );

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
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#3A7D44', // Vert foncé
    height: 56,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
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
  },
  cultureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.white,
  },
  cultureImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  cultureName: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.primary,
  },
  infoContainer: {
    backgroundColor: Colors.white,
    marginTop: 1,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  infoLabel: {
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
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
  weatherValue: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
    marginVertical: 8,
  },
}); 