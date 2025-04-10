import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import Colors from '../../constants/Colors';
import Animated, { FadeInUp } from 'react-native-reanimated';

const screenWidth = Dimensions.get('window').width;

export default function ConseilsIAScreen() {
  const chartData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        data: [2.5, 2.0, 3.0, 2.8, 2.5, 2.3, 2.8],
        color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`, // Tomate
        strokeWidth: 2,
      },
      {
        data: [1.8, 1.5, 2.0, 1.9, 1.8, 1.7, 1.9],
        color: (opacity = 1) => `rgba(144, 238, 144, ${opacity})`, // Laitue
        strokeWidth: 2,
      },
      {
        data: [3.0, 2.8, 3.2, 3.1, 3.0, 2.9, 3.0],
        color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`, // Maïs
        strokeWidth: 2,
      },
    ],
    legend: ['Tomate (L/m²)', 'Laitue (L/m²)', 'Maïs (L/m²)'],
  };

  const recommendations = [
    {
      icon: 'sunny',
      title: 'Température élevée prévue',
      description: 'Arrosez vos tomates en fin de journée pour éviter l\'évaporation excessive.',
      color: '#FF6B6B',
    },
    {
      icon: 'rainy',
      title: 'Précipitations prévues',
      description: 'Réduisez l\'irrigation des laitues le 18/05 en raison des pluies prévues.',
      color: '#4ECDC4',
    },
    {
      icon: 'leaf',
      title: 'Stade de croissance',
      description: 'Vos plants de maïs sont en phase de croissance rapide, augmentez l\'apport en eau de 15%.',
      color: '#45B7D1',
    },
  ];

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
        <Text style={styles.headerTitle}>Conseils IA</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/(auth)/settings')}
        >
          <Ionicons name="settings-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Graphique */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Prévisions d'irrigation sur 7 jours</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
              },
            }}
            bezier
            style={styles.chart}
          />
          <View style={styles.legendContainer}>
            {chartData.legend.map((label, index) => (
              <View key={index} style={styles.legendItem}>
                <View 
                  style={[
                    styles.legendColor, 
                    { backgroundColor: chartData.datasets[index].color(1) }
                  ]} 
                />
                <Text style={styles.legendText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recommandations */}
        <View style={styles.recommendationsContainer}>
          <Text style={styles.sectionTitle}>Recommandations</Text>
          {recommendations.map((item, index) => (
            <Animated.View 
              key={index}
              entering={FadeInUp.delay(index * 200)}
              style={styles.recommendationCard}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={24} color="white" />
              </View>
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>{item.title}</Text>
                <Text style={styles.recommendationText}>{item.description}</Text>
              </View>
            </Animated.View>
          ))}
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
    backgroundColor: '#3A7D44',
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
  content: {
    flex: 1,
  },
  chartContainer: {
    backgroundColor: Colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
  },
  recommendationsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    marginBottom: 16,
  },
  recommendationCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    lineHeight: 20,
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