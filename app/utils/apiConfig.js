import Constants from 'expo-constants'

const API_URL = const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:5000'
// fallback for Android emulator

export default API_URL
