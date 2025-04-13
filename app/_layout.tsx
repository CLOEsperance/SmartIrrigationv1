import React, { useCallback, useEffect } from 'react';
import { Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Colors from '../constants/Colors';

// Gardez l'écran de démarrage visible jusqu'à ce que les ressources soient prêtes
SplashScreen.preventAutoHideAsync();

// Composant pour gérer la redirection en fonction de l'état d'authentification
function AuthStateListener({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Si l'authentification est toujours en cours de chargement, ne rien faire
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inPublicGroup = segments[0] === '(public)';
    
    if (currentUser && !inAuthGroup) {
      // Rediriger vers l'accueil si l'utilisateur est connecté mais n'est pas dans le groupe auth
      router.replace('/(auth)/home');
    } else if (!currentUser && inAuthGroup) {
      // Rediriger vers la connexion si l'utilisateur n'est pas connecté mais essaie d'accéder au groupe auth
      router.replace('/(public)/welcome');
    }
  }, [currentUser, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ marginTop: 20, color: '#ffffff', fontSize: 16 }}>Chargement...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
    'OpenSans-Regular': require('../assets/fonts/OpenSans-Regular.ttf'),
    'RobotoMono-Regular': require('../assets/fonts/RobotoMono-Regular.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <AuthStateListener>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#3A7D44',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontFamily: 'Montserrat-Bold',
              },
            }}
          >
            {/* Écrans publics */}
            <Stack.Screen
              name="(public)/index"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(public)/welcome"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(public)/login"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(public)/register"
              options={{
                title: "Inscription",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(public)/forgot-password"
              options={{
                title: "Mot de passe oublié",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(public)/language-select"
              options={{
                title: "Sélection de la langue",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(public)/language-setup"
              options={{
                headerShown: false,
              }}
            />
            
            {/* Écrans authentifiés */}
            <Stack.Screen
              name="(auth)/home"
              options={{
                title: "Accueil",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(auth)/initial-config"
              options={{
                title: "Configuration Initiale",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(auth)/crop-config"
              options={{
                title: "Configuration des Cultures",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(auth)/irrigation"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(auth)/settings"
              options={{
                title: "Paramètres",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(auth)/weather"
              options={{
                title: "Météo",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(auth)/conseils-ia"
              options={{
                title: "Conseils IA",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(auth)/profile"
              options={{
                title: "Profil",
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(auth)/weather-details"
              options={{
                title: "Détails Météo",
                headerShown: false,
              }}
            />
          </Stack>
        </View>
      </AuthStateListener>
    </AuthProvider>
  );
}
