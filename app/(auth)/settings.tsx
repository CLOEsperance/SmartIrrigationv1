import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsScreen() {
  // Récupérer les données de l'utilisateur depuis le contexte d'authentification
  const { currentUser, logout } = useAuth();
  
  // États pour les différents paramètres
  const [notifications, setNotifications] = useState({
    daily: true,
    weather: true,
    irrigation: true,
  });
  const [offlineMode, setOfflineMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('Français');
  
  // Générer une URL d'avatar par défaut basée sur le nom d'utilisateur
  const avatarUrl = currentUser?.photoURL || 
    `https://ui-avatars.com/api/?name=${currentUser?.displayName || 'User'}&background=3A7D44&color=fff&size=256`;
  
  const userData = {
    name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Utilisateur',
    email: currentUser?.email || 'Non disponible',
    phone: '+229 XX XX XX XX',
    avatar: avatarUrl,
  };

  const languages = ['Français', 'Fon', 'Yoruba', 'Goun'];

  // Sécurité : Vérification de session
  useEffect(() => {
    // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
    if (!currentUser) {
      router.replace('/(public)/login');
    }
  }, [currentUser]);

  const handleLanguageChange = (language: string) => {
    Alert.alert(
      'Changer la langue',
      'Êtes-vous sûr de vouloir changer la langue ? L\'application redémarrera.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Confirmer',
          onPress: () => {
            setSelectedLanguage(language);
            // TODO: Implémenter le changement de langue
          }
        }
      ]
    );
  };

  // Sécurité : Gestion sécurisée de la déconnexion
  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(public)/login');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de se déconnecter. Veuillez réessayer.');
            }
          }
        }
      ]
    );
  };

  // Sécurité : Modification du profil sécurisée
  const handleProfileUpdate = async (newData: any) => {
    try {
      // TODO: Implémenter la validation et la mise à jour sécurisée
      // - Valider les données
      // - Chiffrer si nécessaire
      // - Envoyer au backend
      await validateAndUpdateProfile(newData);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil. Veuillez réessayer.');
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
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section Profil */}
        <Animated.View 
          entering={FadeInDown.delay(100)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Profil</Text>
          <View style={styles.profileContainer}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: userData.avatar }} style={styles.avatar} />
              <TouchableOpacity style={styles.editAvatarButton}>
                <Ionicons name="camera" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userData.name}</Text>
              <Text style={styles.profileEmail}>{userData.email}</Text>
              <Text style={styles.profilePhone}>{userData.phone}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => Alert.alert('Modification du profil', 'Cette fonctionnalité sera bientôt disponible')}
          >
            <Ionicons name="create-outline" size={24} color={Colors.white} />
            <Text style={styles.buttonText}>Modifier le profil</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Section Notifications */}
        <Animated.View 
          entering={FadeInDown.delay(200)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.optionContainer}>
            <View style={styles.option}>
              <Ionicons name="notifications" size={24} color={Colors.darkGray} />
              <Text style={styles.optionText}>Notifications quotidiennes</Text>
              <Switch
                value={notifications.daily}
                onValueChange={(value) => setNotifications(prev => ({ ...prev, daily: value }))}
                trackColor={{ false: Colors.lightGray, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
            <View style={styles.option}>
              <Ionicons name="cloudy" size={24} color={Colors.darkGray} />
              <Text style={styles.optionText}>Alertes météo</Text>
              <Switch
                value={notifications.weather}
                onValueChange={(value) => setNotifications(prev => ({ ...prev, weather: value }))}
                trackColor={{ false: Colors.lightGray, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
            <View style={styles.option}>
              <Ionicons name="water" size={24} color={Colors.darkGray} />
              <Text style={styles.optionText}>Rappels d'irrigation</Text>
              <Switch
                value={notifications.irrigation}
                onValueChange={(value) => setNotifications(prev => ({ ...prev, irrigation: value }))}
                trackColor={{ false: Colors.lightGray, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </Animated.View>

        {/* Section Langue */}
        <Animated.View 
          entering={FadeInDown.delay(300)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Langue</Text>
          <View style={styles.languageContainer}>
            {languages.map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.languageButton,
                  selectedLanguage === language && styles.languageButtonActive
                ]}
                onPress={() => handleLanguageChange(language)}
              >
                <Text style={[
                  styles.languageButtonText,
                  selectedLanguage === language && styles.languageButtonTextActive
                ]}>
                  {language}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Section Mode Hors-ligne */}
        <Animated.View 
          entering={FadeInDown.delay(400)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Mode Hors-ligne</Text>
          <View style={styles.optionContainer}>
            <View style={styles.option}>
              <Ionicons name="cloud-offline" size={24} color={Colors.darkGray} />
              <Text style={styles.optionText}>Activer le mode hors-ligne</Text>
              <Switch
                value={offlineMode}
                onValueChange={setOfflineMode}
                trackColor={{ false: Colors.lightGray, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
          <Text style={styles.helpText}>
            Le mode hors-ligne vous permet d'accéder à vos données même sans connexion internet
          </Text>
        </Animated.View>

        {/* Section Sécurité */}
        <Animated.View 
          entering={FadeInDown.delay(500)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Sécurité</Text>
          <View style={styles.optionContainer}>
            <TouchableOpacity 
              style={styles.securityOption}
              onPress={() => Alert.alert('Modification du mot de passe', 'Cette fonctionnalité sera bientôt disponible')}
            >
              <Ionicons name="key" size={24} color={Colors.darkGray} />
              <Text style={styles.securityOptionText}>Changer le mot de passe</Text>
              <Ionicons name="chevron-forward" size={24} color={Colors.darkGray} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Bouton Déconnexion */}
        <Animated.View
          entering={FadeInDown.delay(600)}
          style={styles.logoutSection}
        >
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color={Colors.white} />
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
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
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    marginBottom: 16,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: Colors.darkGray,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    opacity: 0.8,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    marginLeft: 8,
  },
  optionContainer: {
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    marginLeft: 12,
  },
  languageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    margin: 4,
  },
  languageButtonActive: {
    backgroundColor: Colors.primary,
  },
  languageButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
  },
  languageButtonTextActive: {
    color: Colors.white,
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    opacity: 0.8,
    marginTop: 8,
  },
  securityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  securityOptionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.darkGray,
    marginLeft: 12,
  },
  logoutSection: {
    marginBottom: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  logoutButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    marginLeft: 8,
  },
});

// Fonction utilitaire pour valider et mettre à jour le profil
const validateAndUpdateProfile = async (data: any) => {
  // TODO: Implémenter la validation et mise à jour du profil
  return Promise.resolve();
}; 