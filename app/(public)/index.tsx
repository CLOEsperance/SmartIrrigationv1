import React, { useEffect } from 'react';
import { StyleSheet, View, Image, Text, Animated } from 'react-native';
import { router } from 'expo-router';
import Colors from '../../constants/Colors';

export default function SplashScreen() {
  const loadingProgress = React.useRef(new Animated.Value(0)).current;
  const scaleAnimation = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animation de pulsation du logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animation de la barre de chargement
    Animated.timing(loadingProgress, {
      toValue: 100,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    // Redirection vers l'écran de bienvenue après 3 secondes
    const timer = setTimeout(() => {
      router.replace('/welcome');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../assets/images/logo.png')}
        style={[styles.logo, { transform: [{ scale: scaleAnimation }] }]}
        resizeMode="contain"
      />
      <View style={styles.loadingBarContainer}>
        <Animated.View 
          style={[
            styles.loadingBar, 
            { width: loadingProgress.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }) }
          ]} 
        />
      </View>
      <Text style={styles.appName}>SmartIrrigation</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  loadingBarContainer: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginVertical: 20,
    overflow: 'hidden',
  },
  loadingBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
