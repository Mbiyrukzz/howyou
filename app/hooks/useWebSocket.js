import { useEffect, useRef, useState, useCallback } from 'react'
import { Alert } from 'react-native'

const WS_URL = 'ws://localhost:5000'

/**
 * Dedicated WebSocket Hook
 * Manages WebSocket connection lifecycle, reconnection, and message handling
 */
const useWebSocket = ({
  userId,
  chatId,
  endpoint = '/notifications',
  onMessage,
  enabled = true,
}) => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState('disconnected') // disconnected, connecting, connected, reconnecting

  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const heartbeatIntervalRef = useRef(null)
  const messageQueueRef = useRef([])
  const isIntentionalCloseRef = useRef(false)

  const maxReconnectAttempts = 10
  const heartbeatInterval = 30000 // 30 seconds
  const minReconnectDelay = 1000 // 1 second
  const maxReconnectDelay = 3000 // 3 seconds

  /**
   * Calculate exponential backoff delay for reconnection
   */
  const getReconnectDelay = useCallback(() => {
    const delay = Math.min(
      minReconnectDelay * Math.pow(2, reconnectAttemptsRef.current),
      maxReconnectDelay
    )
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000
  }, [])

  /**
   * Start heartbeat to keep connection alive
   */
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: 'ping' }))
          console.log('💓 Heartbeat ping sent')
        } catch (error) {
          console.error('❌ Failed to send heartbeat:', error)
        }
      }
    }, heartbeatInterval)
  }, [])

  /**
   * Stop heartbeat
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }, [])

  /**
   * Process queued messages after reconnection
   */
  const processMessageQueue = useCallback(() => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN &&
      messageQueueRef.current.length > 0
    ) {
      console.log(
        `📤 Processing ${messageQueueRef.current.length} queued messages`
      )

      while (messageQueueRef.current.length > 0) {
        const message = messageQueueRef.current.shift()
        try {
          wsRef.current.send(JSON.stringify(message))
        } catch (error) {
          console.error('❌ Failed to send queued message:', error)
          // Put it back in queue
          messageQueueRef.current.unshift(message)
          break
        }
      }
    }
  }, [])

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (!userId || !enabled) {
      console.log('⏸️ WebSocket connection skipped (no userId or disabled)')
      return
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected')
      return
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('⏳ WebSocket already connecting')
      return
    }

    try {
      // Close existing connection if any
      if (wsRef.current) {
        isIntentionalCloseRef.current = true
        wsRef.current.close()
        wsRef.current = null
      }

      const wsUrl = `${WS_URL}${endpoint}?userId=${userId}${
        chatId ? `&chatId=${chatId}` : ''
      }`

      console.log(`🔌 Connecting WebSocket to: ${wsUrl}`)

      setConnectionState('connecting')
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected successfully')
        setIsConnected(true)
        setConnectionState('connected')
        reconnectAttemptsRef.current = 0
        isIntentionalCloseRef.current = false

        // Start heartbeat
        startHeartbeat()

        // Process any queued messages
        processMessageQueue()
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // Handle pong responses
          if (data.type === 'pong') {
            console.log('💓 Heartbeat pong received')
            return
          }

          // Forward message to handler
          if (onMessage) {
            onMessage(data)
          }
        } catch (error) {
          console.error('❌ WebSocket message parse error:', error)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        setConnectionState('error')
      }

      wsRef.current.onclose = (event) => {
        console.log('🔴 WebSocket disconnected:', {
          code: event.code,
          reason: event.reason,
          clean: event.wasClean,
          intentional: isIntentionalCloseRef.current,
        })

        setIsConnected(false)
        stopHeartbeat()

        // Don't reconnect if it was intentional
        if (isIntentionalCloseRef.current) {
          setConnectionState('disconnected')
          isIntentionalCloseRef.current = false
          return
        }

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts && enabled) {
          const delay = getReconnectDelay()
          setConnectionState('reconnecting')

          console.log(
            `⏳ Reconnecting in ${Math.round(delay / 1000)}s (attempt ${
              reconnectAttemptsRef.current + 1
            }/${maxReconnectAttempts})`
          )

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, delay)
        } else {
          setConnectionState('failed')
          console.error('❌ Max reconnection attempts reached')

          Alert.alert(
            'Connection Lost',
            'Unable to connect to server. Please check your internet connection and restart the app.',
            [{ text: 'OK' }]
          )
        }
      }
    } catch (error) {
      console.error('❌ WebSocket initialization error:', error)
      setIsConnected(false)
      setConnectionState('error')
    }
  }, [
    userId,
    endpoint,
    enabled,
    onMessage,
    startHeartbeat,
    processMessageQueue,
    getReconnectDelay,
    stopHeartbeat,
  ])

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting WebSocket...')

    isIntentionalCloseRef.current = true

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    stopHeartbeat()

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Client disconnect')
      }
      wsRef.current = null
    }

    setIsConnected(false)
    setConnectionState('disconnected')
  }, [stopHeartbeat])

  /**
   * Send message through WebSocket
   */
  const send = useCallback((message) => {
    if (!wsRef.current) {
      console.warn('⚠️ Cannot send message: WebSocket not initialized')
      messageQueueRef.current.push(message)
      return false
    }

    if (wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message))
        console.log('📤 Message sent:', message.type)
        return true
      } catch (error) {
        console.error('❌ Failed to send message:', error)
        messageQueueRef.current.push(message)
        return false
      }
    } else {
      console.warn('⚠️ WebSocket not ready, queueing message')
      messageQueueRef.current.push(message)
      return false
    }
  }, [])

  /**
   * Reconnect manually
   */
  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnect triggered')
    reconnectAttemptsRef.current = 0
    disconnect()
    setTimeout(() => connect(), 100)
  }, [connect, disconnect])

  /**
   * Get connection status
   */
  const getStatus = useCallback(() => {
    return {
      isConnected,
      connectionState,
      reconnectAttempts: reconnectAttemptsRef.current,
      queuedMessages: messageQueueRef.current.length,
    }
  }, [isConnected, connectionState])

  // Auto-connect when enabled and userId changes
  useEffect(() => {
    if (enabled && userId) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [userId, enabled]) // Note: connect and disconnect are stable

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      stopHeartbeat()
      isIntentionalCloseRef.current = true
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [stopHeartbeat])

  return {
    isConnected,
    connectionState,
    send,
    connect,
    disconnect,
    reconnect,
    getStatus,
  }
}

export default useWebSocket
