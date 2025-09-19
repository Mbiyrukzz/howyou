// setUpFirebase.js
import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'

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

if (typeof window !== 'undefined') {
  // 👉 Web
  auth = getAuth(app)
  setPersistence(auth, browserLocalPersistence)
} else {
  // 👉 React Native
  const { initializeAuth, getReactNativePersistence } = require('firebase/auth')
  const AsyncStorage =
    require('@react-native-async-storage/async-storage').default

  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  })
}

export { auth }
