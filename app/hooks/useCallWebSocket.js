import { useEffect, useRef, useState } from 'react'
import { Platform, Alert } from 'react-native'

const SIGNALING_URL =
  Platform.OS === 'web'
    ? process.env.EXPO_PUBLIC_SOCKET_URL
    : process.env.EXPO_PUBLIC_SOCKET_URL

export function useWebSocket(user, chatId, onMessage, navigation) {
  const wsRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!user?.uid || !chatId) {
      console.warn('🕓 Waiting for user or chatId...', {
        hasUser: !!user?.uid,
        hasChatId: !!chatId,
      })
      return
    }

    const wsUrl = `${SIGNALING_URL}/signaling?userId=${user.uid}&chatId=${chatId}`
    console.log('🔌 Connecting to signaling WebSocket:', {
      url: wsUrl,
      userId: user.uid,
      chatId,
    })

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    let intentionalClose = false

    ws.onopen = () => {
      console.log('✅ Signaling WebSocket connected')
      setIsConnected(true)

      // Send join-call message
      const joinMessage = {
        type: 'join-call',
        chatId,
        userId: user.uid,
      }
      console.log('📤 Sending join-call:', joinMessage)
      ws.send(JSON.stringify(joinMessage))
    }

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)

        // ✅ Log ALL incoming messages with full data for debugging
        console.log('📨 [WebSocket] Received message:', {
          type: data.type,
          from: data.from,
          to: data.to,
          userId: data.userId,
          chatId: data.chatId,
          callId: data.callId,
          recipientId: data.recipientId,
          timestamp: data.timestamp || new Date().toISOString(),
        })

        // Log the FULL message for call-related events
        if (data.type?.includes('call') || data.type?.includes('webrtc')) {
          console.log('🔍 [Full Message Data]:', JSON.stringify(data, null, 2))
        }

        // Handle ping/pong
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }))
          return
        }

        if (data.type === 'connected') {
          console.log('✅ Connection confirmed by server:', data)
          return
        }

        // Forward to message handler
        onMessage(data)
      } catch (error) {
        console.error('❌ WebSocket message parse error:', error, {
          raw: event.data,
        })
      }
    }

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
      setIsConnected(false)
    }

    ws.onclose = (event) => {
      console.log('🔴 WebSocket disconnected:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        intentional: intentionalClose,
      })
      setIsConnected(false)

      // Only show alert if unexpected close
      if (!intentionalClose && event.code !== 1000 && event.code !== 1006) {
        Alert.alert('Connection Lost', 'Call connection was lost.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ])
      }
    }

    return () => {
      console.log('🧹 Cleaning up signaling WebSocket')
      intentionalClose = true
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close(1000, 'Component unmount')
      }
    }
  }, [user?.uid, chatId])

  const sendMessage = (message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('📤 [WebSocket] Sending:', {
        type: message.type,
        to: message.to,
        from: message.from,
      })
      wsRef.current.send(JSON.stringify(message))
      return true
    } else {
      console.warn('⚠️ Cannot send message - WebSocket not open:', {
        readyState: wsRef.current?.readyState,
        message: message.type,
      })
      return false
    }
  }

  return { wsRef, isConnected, sendMessage }
}
