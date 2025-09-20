// setUpFirebase.js
import { initializeApp } from 'firebase/app'
import { Platform } from 'react-native'
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyA1Mlyss9iWXWoXXtLlS3FuBF8A2XHLjmA',
  authDomain: 'howyou-a5577.firebaseapp.com',
  projectId: 'howyou-a5577',
  storageBucket: 'howyou-a5577.appspot.com',
  messagingSenderId: '281176617986',
  appId: '1:281176617986:web:b4e59b294a59c76675a31b',
}

const app = initializeApp(firebaseConfig)

let auth

if (Platform.OS === 'web') {
  // 👉 Web: use getAuth + local persistence
  auth = getAuth(app)
  setPersistence(auth, browserLocalPersistence)
} else {
  // 👉 Mobile (iOS/Android): use initializeAuth + AsyncStorage
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  })
}

export { auth }
