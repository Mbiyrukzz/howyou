/**
 * API Configuration
 *
 * This file handles API URL configuration for different environments.
 * Set environment variables in your .env file or Expo configuration.
 */

// For React Native/Expo development
// Use your local IP address when running on physical devices
// Example: 'http://192.168.1.100:5000'

// For Expo development
let API_BASE_URL = ''

// Get environment-specific configuration
if (__DEV__) {
  // Development - Using localhost for iOS Simulator/Android Emulator
  // For physical devices, use your computer's IP address
  API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'

  // Auto-detect platform for better development experience
  if (process.env.EXPO_PUBLIC_API_URL) {
    // Use the explicitly set URL from environment variables
    console.log('🌐 Using API URL from environment:', API_BASE_URL)
  } else {
    // Default to localhost with common ports
    console.log('🌐 Development mode: Using default localhost API')
  }
} else {
  // Production - Use your deployed backend URL
  API_BASE_URL =
    process.env.EXPO_PUBLIC_API_URL || 'https://your-production-api.com'
  console.log('🚀 Production mode: Using production API')
}

// WebSocket configuration
const WEBSOCKET_CONFIG = {
  // WebSocket base URL (without protocol)
  BASE_URL: API_BASE_URL.replace(/^https?:\/\//, ''),

  // Use secure WebSocket (wss) for HTTPS, ws for HTTP
  PROTOCOL: API_BASE_URL.startsWith('https') ? 'wss' : 'ws',

  // WebSocket endpoint paths
  ENDPOINTS: {
    CHAT: '/chat',
    POSTS: '/posts',
    NOTIFICATIONS: '/notifications',
  },

  // Reconnection settings
  RECONNECT_INTERVAL: 3000, // 3 seconds
  MAX_RECONNECT_ATTEMPTS: 5,

  // Ping interval to keep connection alive (seconds)
  PING_INTERVAL: 30,

  // Timeout settings
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  RESPONSE_TIMEOUT: 5000, // 5 seconds
}

// API Endpoints configuration
const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    VERIFY_TOKEN: '/auth/verify-token',
    REFRESH_TOKEN: '/auth/refresh-token',
  },

  // User Management
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    UPDATE_PROFILE_PICTURE: '/users/profile-picture',
    UPDATE_PASSWORD: '/users/password',
    DELETE_PROFILE_PICTURE: '/users/profile-picture',
    GET_USER: (userId) => `/users/${userId}`,
    SEARCH_USERS: '/users/search',
    GET_ONLINE_USERS: '/users/online',
  },

  // Chats
  CHATS: {
    LIST: '/chats',
    CREATE: '/chats',
    GET_CHAT: (chatId) => `/chats/${chatId}`,
    UPDATE_CHAT: (chatId) => `/chats/${chatId}`,
    DELETE_CHAT: (chatId) => `/chats/${chatId}`,
    GET_MESSAGES: (chatId) => `/chats/${chatId}/messages`,
    SEND_MESSAGE: (chatId) => `/chats/${chatId}/messages`,
    DELETE_MESSAGE: (chatId, messageId) =>
      `/chats/${chatId}/messages/${messageId}`,
    MARK_AS_READ: (chatId) => `/chats/${chatId}/read`,
    TYPING_STATUS: (chatId) => `/chats/${chatId}/typing`,
  },

  // Posts
  POSTS: {
    LIST: '/posts',
    CREATE: '/posts',
    GET_POST: (postId) => `/posts/${postId}`,
    UPDATE_POST: (postId) => `/posts/${postId}`,
    DELETE_POST: (postId) => `/posts/${postId}`,
    LIKE_POST: (postId) => `/posts/${postId}/like`,
    GET_COMMENTS: (postId) => `/posts/${postId}/comments`,
    ADD_COMMENT: (postId) => `/posts/${postId}/comments`,
    DELETE_COMMENT: (postId, commentId) =>
      `/posts/${postId}/comments/${commentId}`,
  },

  // Status/Stories
  STATUS: {
    LIST: '/status',
    MY_STATUS: '/status/my',
    CREATE: '/status',
    DELETE: (statusId) => `/status/${statusId}`,
    VIEW_STATUS: (statusId) => `/status/${statusId}/view`,
    GET_STATUS_VIEWERS: (statusId) => `/status/${statusId}/viewers`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_AS_READ: (notificationId) => `/notifications/${notificationId}/read`,
    MARK_ALL_READ: '/notifications/mark-all-read',
    DELETE: (notificationId) => `/notifications/${notificationId}`,
  },

  // Uploads
  UPLOADS: {
    UPLOAD_FILE: '/upload',
    UPLOAD_MULTIPLE: '/upload/multiple',
    GET_FILE_URL: (filename) => `/uploads/${filename}`,
  },

  // Analytics/Stats
  ANALYTICS: {
    APP_STATS: '/analytics/stats',
    USER_STATS: '/analytics/user-stats',
  },
}

// Request configuration
const REQUEST_CONFIG = {
  // Default timeout for requests (milliseconds)
  TIMEOUT: 30000,

  // Default headers
  HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },

  // File upload configuration
  UPLOAD: {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_TYPES: {
      IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      VIDEO: ['video/mp4', 'video/mpeg', 'video/quicktime'],
      AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
      DOCUMENT: ['application/pdf', 'application/msword', 'text/plain'],
    },
  },
}

// Error codes and messages
const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
}

// Helper function to get full WebSocket URL
const getWebSocketUrl = (endpoint) => {
  const path = WEBSOCKET_CONFIG.ENDPOINTS[endpoint.toUpperCase()] || endpoint
  return `${WEBSOCKET_CONFIG.PROTOCOL}://${WEBSOCKET_CONFIG.BASE_URL}${path}`
}

// Helper function to get full API URL
const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`
}

// Helper function to get upload URL for a file
const getUploadUrl = (filename, type = 'images') => {
  return `${API_BASE_URL}/uploads/${type}/${filename}`
}

// Development helper - log API configuration
if (__DEV__) {
  console.log('📡 API Configuration:', {
    API_BASE_URL,
    WEBSOCKET_PROTOCOL: WEBSOCKET_CONFIG.PROTOCOL,
    IS_DEV: __DEV__,
  })
}

export {
  API_BASE_URL,
  WEBSOCKET_CONFIG,
  API_ENDPOINTS,
  REQUEST_CONFIG,
  ERROR_CODES,
  getWebSocketUrl,
  getApiUrl,
  getUploadUrl,
}
