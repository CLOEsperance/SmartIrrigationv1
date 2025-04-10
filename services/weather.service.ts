/**
 * Service météo pour l'application SmartIrrigation
 * Utilise l'API Open-Meteo pour récupérer les données météorologiques
 * Documentation API: https://open-meteo.com/en/docs
 */

// Types pour les données météo
export interface CurrentWeatherData {
  temperature: number;        // Température en °C
  windspeed: number;          // Vitesse du vent en km/h
  winddirection: number;      // Direction du vent en degrés
  weathercode: number;        // Code météo WMO
  time: string;               // Horodatage
}

export interface HourlyWeatherData {
  time: string[];                   // Horodatages pour les prévisions horaires
  temperature_2m: number[];         // Températures horaires en °C
  relative_humidity_2m: number[];   // Humidité relative horaire en %
  precipitation_sum: number[];      // Précipitations horaires en mm
}

export interface WeatherResponse {
  current_weather: CurrentWeatherData;
  hourly: HourlyWeatherData;
}

// Interface pour les données météo formatées
export interface FormattedWeatherData {
  currentTemperature: number;       // Température actuelle en °C
  currentHumidity: number;          // Humidité actuelle en %
  currentWeatherCode: number;       // Code WMO pour la condition météo actuelle
  forecastHours: string[];          // Heures de prévision
  hourlyTemperatures: number[];     // Températures horaires en °C
  hourlyHumidity: number[];         // Humidité horaire en %
  hourlyPrecipitation: number[];    // Précipitations horaires en mm
  weatherDescription: string;       // Description textuelle de la météo actuelle
}

/**
 * Classe pour gérer les appels à l'API météo et formater les données
 */
class WeatherService {
  // Mapping des codes météo WMO vers des descriptions en français
  private weatherCodeDescriptions: { [key: number]: string } = {
    0: "Ciel dégagé",
    1: "Principalement dégagé",
    2: "Partiellement nuageux",
    3: "Couvert",
    45: "Brouillard",
    48: "Brouillard givrant",
    51: "Bruine légère",
    53: "Bruine modérée",
    55: "Bruine dense",
    56: "Bruine verglaçante légère",
    57: "Bruine verglaçante dense",
    61: "Pluie légère",
    63: "Pluie modérée",
    65: "Pluie forte",
    66: "Pluie verglaçante légère",
    67: "Pluie verglaçante forte",
    71: "Neige légère",
    73: "Neige modérée",
    75: "Neige forte",
    77: "Grains de neige",
    80: "Averses de pluie légères",
    81: "Averses de pluie modérées",
    82: "Averses de pluie violentes",
    85: "Averses de neige légères",
    86: "Averses de neige fortes",
    95: "Orage",
    96: "Orage avec grêle légère",
    99: "Orage avec grêle forte"
  };

  /**
   * Récupère les données météo pour une localisation donnée
   * @param latitude Latitude de la localisation
   * @param longitude Longitude de la localisation
   * @returns Promise contenant les données météo formatées
   */
  async getWeatherData(latitude: number, longitude: number): Promise<FormattedWeatherData> {
    try {
      // Construire l'URL de l'API avec les paramètres
      const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,precipitation_sum&timezone=auto`;
      
      // Faire la requête à l'API
      const response = await fetch(apiUrl);
      
      // Vérifier si la requête a réussi
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} - ${response.statusText}`);
      }
      
      // Convertir la réponse en JSON
      const data: WeatherResponse = await response.json();
      
      // Récupérer l'index de l'heure actuelle
      const currentHourIndex = this.getCurrentHourIndex(data.hourly.time);
      
      // Formater les données
      const formattedData: FormattedWeatherData = {
        currentTemperature: data.current_weather.temperature,
        currentHumidity: data.hourly.relative_humidity_2m[currentHourIndex],
        currentWeatherCode: data.current_weather.weathercode,
        forecastHours: data.hourly.time.slice(currentHourIndex, currentHourIndex + 24).map(this.formatHour),
        hourlyTemperatures: data.hourly.temperature_2m.slice(currentHourIndex, currentHourIndex + 24),
        hourlyHumidity: data.hourly.relative_humidity_2m.slice(currentHourIndex, currentHourIndex + 24),
        hourlyPrecipitation: data.hourly.precipitation_sum.slice(currentHourIndex, currentHourIndex + 24),
        weatherDescription: this.getWeatherDescription(data.current_weather.weathercode)
      };
      
      return formattedData;
    } catch (error) {
      console.error('Erreur lors de la récupération des données météo:', error);
      throw new Error('Impossible de récupérer les données météo. Veuillez réessayer plus tard.');
    }
  }

  /**
   * Récupère l'index de l'heure actuelle dans le tableau des heures de prévision
   * @param timeArray Tableau des heures de prévision
   * @returns Index de l'heure actuelle
   */
  private getCurrentHourIndex(timeArray: string[]): number {
    const now = new Date();
    const currentTimeString = now.toISOString().split('T')[0] + 'T' + now.getHours() + ':00';
    
    // Trouver l'index de l'heure la plus proche
    return timeArray.findIndex(time => time >= currentTimeString);
  }

  /**
   * Formate une heure ISO en format plus lisible (HH:MM)
   * @param isoTime Heure au format ISO
   * @returns Heure formatée (HH:MM)
   */
  private formatHour(isoTime: string): string {
    const date = new Date(isoTime);
    return date.getHours() + ':00';
  }

  /**
   * Récupère la description textuelle d'un code météo WMO
   * @param code Code météo WMO
   * @returns Description textuelle
   */
  private getWeatherDescription(code: number): string {
    return this.weatherCodeDescriptions[code] || "Conditions inconnues";
  }
}

// Exporter une instance du service
const weatherService = new WeatherService();
export default weatherService;

