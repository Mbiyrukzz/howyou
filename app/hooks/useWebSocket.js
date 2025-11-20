import { useEffect, useRef, useState, useCallback } from 'react'
import { Alert } from 'react-native'

const WS_URL = 'ws://10.230.214.87:5000'

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
  const connectionIdRef = useRef(0) // Track connection attempts

  const maxReconnectAttempts = 10
  const heartbeatInterval = 30000 // 30 seconds
  const minReconnectDelay = 1000 // 1 second
  const maxReconnectDelay = 30000 // 30 seconds

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

    // Increment connection ID to track this specific connection attempt
    connectionIdRef.current++
    const currentConnectionId = connectionIdRef.current

    try {
      // Close existing connection if any
      if (wsRef.current) {
        isIntentionalCloseRef.current = true
        try {
          wsRef.current.close()
        } catch (e) {
          console.warn('Error closing previous connection:', e)
        }
        wsRef.current = null
      }

      const wsUrl = `${WS_URL}${endpoint}?userId=${userId}${
        chatId ? `&chatId=${chatId}` : ''
      }`

      console.log(`🔌 Connecting WebSocket [${currentConnectionId}]: ${wsUrl}`)

      setConnectionState('connecting')
      const newWs = new WebSocket(wsUrl)
      wsRef.current = newWs

      newWs.onopen = () => {
        // Check if this is still the current connection attempt
        if (currentConnectionId !== connectionIdRef.current) {
          console.log(
            `⚠️ Connection [${currentConnectionId}] superseded, closing`
          )
          newWs.close()
          return
        }

        console.log(`✅ WebSocket connected [${currentConnectionId}]`)
        setIsConnected(true)
        setConnectionState('connected')
        reconnectAttemptsRef.current = 0
        isIntentionalCloseRef.current = false

        // Start heartbeat
        startHeartbeat()

        // Process any queued messages
        processMessageQueue()
      }

      newWs.onmessage = (event) => {
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

      newWs.onerror = (error) => {
        console.error(`❌ WebSocket error [${currentConnectionId}]:`, error)
        setConnectionState('error')
      }

      newWs.onclose = (event) => {
        // Check if this is still the current connection
        if (currentConnectionId !== connectionIdRef.current) {
          console.log(
            `⚠️ Old connection [${currentConnectionId}] closed, ignoring`
          )
          return
        }

        console.log(`🔴 WebSocket disconnected [${currentConnectionId}]:`, {
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
            'Unable to connect to server. Please check your internet connection.',
            [{ text: 'Retry', onPress: () => reconnect() }, { text: 'Cancel' }]
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
    chatId,
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
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        try {
          wsRef.current.close(1000, 'Client disconnect')
        } catch (e) {
          console.warn('Error closing connection:', e)
        }
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
    isIntentionalCloseRef.current = true

    // Disconnect first
    if (wsRef.current) {
      try {
        wsRef.current.close()
      } catch (e) {
        console.warn('Error closing during reconnect:', e)
      }
      wsRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    stopHeartbeat()

    // Wait a bit then reconnect
    setTimeout(() => {
      isIntentionalCloseRef.current = false
      connect()
    }, 500)
  }, [connect, stopHeartbeat])

  /**
   * Get connection status
   */
  const getStatus = useCallback(() => {
    return {
      isConnected,
      connectionState,
      reconnectAttempts: reconnectAttemptsRef.current,
      queuedMessages: messageQueueRef.current.length,
      readyState: wsRef.current?.readyState,
    }
  }, [isConnected, connectionState])

  // Auto-connect when enabled and userId changes
  useEffect(() => {
    if (enabled && userId) {
      console.log(`🔄 useEffect: Connecting for user ${userId} on ${endpoint}`)
      connect()
    } else {
      console.log(
        `🔄 useEffect: Disconnecting (enabled: ${enabled}, userId: ${userId})`
      )
      disconnect()
    }

    return () => {
      console.log('🔄 useEffect cleanup: Disconnecting')
      disconnect()
    }
  }, [userId, endpoint, enabled]) // Stable dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, cleaning up WebSocket')
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      stopHeartbeat()
      isIntentionalCloseRef.current = true
      if (wsRef.current) {
        try {
          wsRef.current.close()
        } catch (e) {
          console.warn('Error closing on unmount:', e)
        }
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
