import Constants from 'expo-constants'

const API_URL =
  Constants.expoConfig?.extra?.apiUrl || 'https://peepapi.ashmif.com'

export default API_URL
