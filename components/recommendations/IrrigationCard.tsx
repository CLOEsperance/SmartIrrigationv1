import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ViewStyle 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

interface IrrigationCardProps {
  volume: number; // litres/m²
  totalVolume: number; // litres totaux
  frequency: string; // fréquence d'irrigation
  moment: 'matin' | 'soir';
  message: string;
  style?: ViewStyle;
  constraint?: string | null;
  culture: string;
  sol: string;
  weatherIcon?: string;
  plageHoraire?: string; // Nouvelle prop pour la plage horaire optimale
  onMarkComplete?: () => void;
}

/**
 * Carte de recommandation d'irrigation
 * Affiche les recommandations d'irrigation générées par le service
 */
const IrrigationCard: React.FC<IrrigationCardProps> = ({
  volume,
  totalVolume,
  frequency,
  moment,
  message,
  style,
  constraint,
  culture,
  sol,
  weatherIcon = 'sunny',
  plageHoraire,
  onMarkComplete,
}) => {
  // Couleurs du dégradé en fonction du moment de la journée
  const gradientColors = moment === 'matin' 
    ? [Colors.blue, '#B7E4F7'] as const
    : ['#4A6FA5', '#B7E4F7'] as const;

  // Icône météo en fonction du type de temps
  const getWeatherIcon = () => {
    switch (weatherIcon) {
      case 'rainy':
        return <Ionicons name="rainy" size={45} color="#FFFFFF" />;
      case 'partly-sunny':
        return <Ionicons name="partly-sunny" size={45} color="#FFFFFF" />;
      case 'cloud':
        return <Ionicons name="cloud" size={45} color="#FFFFFF" />;
      case 'thunderstorm':
        return <Ionicons name="thunderstorm" size={45} color="#FFFFFF" />;
      default:
        return <Ionicons name="sunny" size={45} color="#FFFFFF" />;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.header}>
          <View style={styles.weatherIcon}>
            {getWeatherIcon()}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.momentText}>
              {moment === 'matin' ? 'Ce matin' : 'Ce soir'}
            </Text>
            <Text style={styles.cultureText}>
              {culture} sur sol {sol}
            </Text>
          </View>
        </View>
        
        <View style={styles.content}>
          <View style={styles.besoinsContainer}>
            <Text style={styles.besoinsLabel}>Besoin en eau :</Text>
            <Text style={styles.volumeText}>
              {volume.toFixed(1)} L/m²
            </Text>
          </View>
          <Text style={styles.totalText}>
            ({totalVolume.toFixed(0)} L au total)
          </Text>
          
          <View style={styles.frequenceContainer}>
            <Text style={styles.frequenceLabel}>Fréquence :</Text>
            <Text style={styles.frequencyText}>
              Tous les {frequency}
            </Text>
          </View>
          
          {plageHoraire && (
            <View style={styles.plageHoraireContainer}>
              <Text style={styles.plageHoraireLabel}>Heure optimale :</Text>
              <Text style={styles.plageHoraireText}>{plageHoraire}</Text>
              <View style={styles.recommendedTag}>
                <Text style={styles.recommendedTagText}>Recommandé</Text>
              </View>
            </View>
          )}

          {constraint ? (
            <View style={styles.constraintContainer}>
              <Ionicons name="warning" size={18} color={Colors.yellow} />
              <Text style={styles.constraintText}>{constraint}</Text>
            </View>
          ) : (
            <Text style={styles.messageText}>{message}</Text>
          )}
          
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              <Ionicons name="calendar-outline" size={12} color="#FFFFFF" /> Recommandation générée le {new Date().toLocaleDateString()}
            </Text>
          </View>
        </View>

        {onMarkComplete && (
          <TouchableOpacity 
            style={styles.markButton}
            onPress={onMarkComplete}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.markButtonText}>Marquer comme arrosé</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherIcon: {
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  momentText: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cultureText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    marginVertical: 8,
  },
  besoinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  besoinsLabel: {
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: '#FFFFFF',
    marginRight: 8,
  },
  volumeText: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
    color: '#FFFFFF',
  },
  totalText: {
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  frequenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  frequenceLabel: {
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: '#FFFFFF',
    marginRight: 8,
  },
  frequencyText: {
    fontSize: 16,
    fontFamily: 'OpenSans-SemiBold',
    color: '#FFFFFF',
  },
  plageHoraireContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  plageHoraireLabel: {
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: '#FFFFFF',
    marginRight: 8,
  },
  plageHoraireText: {
    fontSize: 16,
    fontFamily: 'OpenSans-SemiBold',
    color: '#FFFFFF',
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 20,
  },
  constraintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  constraintText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: '#FFFFFF',
    flex: 1,
  },
  markButton: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
  },
  recommendedTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  recommendedTagText: {
    fontSize: 12,
    fontFamily: 'OpenSans-Regular',
    color: '#FFFFFF',
  },
  dateContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: '#FFFFFF',
  },
});

export default IrrigationCard;
