import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { BarChart } from 'react-native-chart-kit';
import userService from '../../services/user.service';

const screenWidth = Dimensions.get('window').width;

export default function ProfileScreen() {
  const { currentUser, logout, updateProfile } = useAuth();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    cultures: 0,
    irrigations: 0,
    efficiency: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Générer une URL d'avatar par défaut basée sur le nom d'utilisateur
  const avatarUrl = currentUser?.photoURL || 
    `https://ui-avatars.com/api/?name=${currentUser?.displayName || 'User'}&background=3A7D44&color=fff&size=256`;

  const userData = {
    name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Utilisateur',
    email: currentUser?.email || 'Non disponible',
    avatar: avatarUrl,
  };

  // Charger les statistiques de l'utilisateur
  useEffect(() => {
    const loadStats = async () => {
      if (!currentUser) return;
      
      try {
        setLoadingStats(true);
        const userStats = await userService.getUserStats(currentUser.uid);
        setStats(userStats);
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        Alert.alert('Erreur', 'Impossible de charger les statistiques');
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(public)/login');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de se déconnecter. Veuillez réessayer.');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setIsLoading(true);
        await updateProfile({ photoURL: result.assets[0].uri });
        setIsLoading(false);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de changer la photo de profil.');
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editedName.trim()) {
      Alert.alert('Erreur', 'Le nom ne peut pas être vide');
      return;
    }

    try {
      setIsLoading(true);
      await updateProfile({ displayName: editedName });
      setIsEditModalVisible(false);
      setIsLoading(false);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
      setIsLoading(false);
    }
  };

  const chartData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [{
      data: [20, 45, 28, 80, 99, 43, 50]
    }]
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
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/(auth)/settings')}
        >
          <Ionicons name="settings-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profil Info */}
        <Animated.View 
          entering={FadeInDown.delay(200)}
          style={styles.profileContainer}
        >
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: userData.avatar }}
              style={styles.avatar}
            />
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={pickImage}
              disabled={isLoading}
            >
              <Ionicons name="camera" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
        </Animated.View>

        {/* Stats */}
        <Animated.View 
          entering={FadeInDown.delay(400)}
          style={styles.statsContainer}
        >
          {loadingStats ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : (
            <>
              <View style={styles.statCard}>
                <Ionicons name="leaf" size={32} color={Colors.primary} />
                <Text style={styles.statValue}>{stats.cultures}</Text>
                <Text style={styles.statLabel}>Cultures</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="water" size={32} color="#4ECDC4" />
                <Text style={styles.statValue}>{stats.irrigations}</Text>
                <Text style={styles.statLabel}>Irrigations</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="trending-up" size={32} color="#FF6B6B" />
                <Text style={styles.statValue}>{stats.efficiency}%</Text>
                <Text style={styles.statLabel}>Efficacité</Text>
              </View>
            </>
          )}
        </Animated.View>

        {/* Graphique */}
        <Animated.View 
          entering={FadeInDown.delay(600)}
          style={styles.chartContainer}
        >
          <Text style={styles.chartTitle}>Activité hebdomadaire</Text>
          <BarChart
            data={chartData}
            width={screenWidth - 32}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: Colors.white,
              backgroundGradientFrom: Colors.white,
              backgroundGradientTo: Colors.white,
              decimalPlaces: 0,
              color: (opacity = 1) => Colors.primary,
              labelColor: (opacity = 1) => Colors.darkGray,
              style: {
                borderRadius: 16,
              },
              barPercentage: 0.5,
            }}
            style={styles.chart}
          />
        </Animated.View>

        {/* Actions */}
        <Animated.View 
          entering={FadeInDown.delay(800)}
          style={styles.actionsContainer}
        >
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              setEditedName(userData.name);
              setIsEditModalVisible(true);
            }}
          >
            <Ionicons name="create-outline" size={24} color={Colors.white} />
            <Text style={styles.actionButtonText}>Modifier le profil</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.settingsButtonAction]}
            onPress={() => router.push('/(auth)/settings')}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.white} />
            <Text style={styles.actionButtonText}>Paramètres</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color={Colors.white} />
            <Text style={styles.actionButtonText}>Se déconnecter</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Modal d'édition */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier le profil</Text>
            <TextInput
              style={styles.input}
              placeholder="Nouveau nom"
              value={editedName}
              onChangeText={setEditedName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateProfile}
                disabled={isLoading}
              >
                <Text style={styles.modalButtonText}>
                  {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person" size={24} color={Colors.primary} />
          <Text style={[styles.navText, styles.activeNavText]}>Profil</Text>
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
  profileContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.white,
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
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: Colors.darkGray,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: Colors.white,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statCard: {
    alignItems: 'center',
    padding: 12,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    color: Colors.darkGray,
  },
  chartContainer: {
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
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
  actionsContainer: {
    padding: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    marginLeft: 12,
  },
  settingsButtonAction: {
    backgroundColor: '#4ECDC4',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: Colors.darkGray,
    marginTop: 4,
  },
  activeNavText: {
    color: Colors.primary,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontFamily: 'Montserrat-Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: Colors.lightGray,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  modalButtonText: {
    color: Colors.white,
    fontFamily: 'Montserrat-Medium',
  },
}); 