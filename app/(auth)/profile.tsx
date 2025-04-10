import React from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../contexts/AuthContext';

const screenWidth = Dimensions.get('window').width;

export default function ProfileScreen() {
  const { currentUser, logout } = useAuth();

  // Générer une URL d'avatar par défaut basée sur le nom d'utilisateur
  const avatarUrl = currentUser?.photoURL || 
    `https://ui-avatars.com/api/?name=${currentUser?.displayName || 'User'}&background=3A7D44&color=fff&size=256`;

  const userData = {
    name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Utilisateur',
    email: currentUser?.email || 'Non disponible',
    avatar: avatarUrl,
    stats: {
      cultures: 5,
      irrigations: 28,
      efficiency: 92,
    },
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(public)/login');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de se déconnecter. Veuillez réessayer.');
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
            <TouchableOpacity style={styles.editAvatarButton}>
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
          <View style={styles.statCard}>
            <Ionicons name="leaf" size={32} color={Colors.primary} />
            <Text style={styles.statValue}>{userData.stats.cultures}</Text>
            <Text style={styles.statLabel}>Cultures</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="water" size={32} color="#4ECDC4" />
            <Text style={styles.statValue}>{userData.stats.irrigations}</Text>
            <Text style={styles.statLabel}>Irrigations</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={32} color="#FF6B6B" />
            <Text style={styles.statValue}>{userData.stats.efficiency}%</Text>
            <Text style={styles.statLabel}>Efficacité</Text>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View 
          entering={FadeInDown.delay(600)}
          style={styles.actionsContainer}
        >
          <TouchableOpacity style={styles.actionButton}>
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
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: (screenWidth - 48) / 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    opacity: 0.8,
  },
  actionsContainer: {
    paddingHorizontal: 16,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: Colors.white,
    marginLeft: 12,
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
  logoutButton: {
    backgroundColor: '#FF6B6B',
    marginTop: 10,
  },
  settingsButtonAction: {
    backgroundColor: '#4ECDC4',
    marginTop: 10,
  },
}); 