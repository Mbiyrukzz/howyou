import { useEffect, useRef, useState } from 'react'
import { Platform, Alert } from 'react-native'

const SIGNALING_URL =
  Platform.OS === 'web' ? 'ws://localhost:5000' : 'ws://10.156.197.87:5000'

export function useWebSocket(user, chatId, onMessage, navigation) {
  const wsRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!user?.uid || !chatId) {
      console.warn('🕓 Waiting for user or chatId...')
      return
    }

    const wsUrl = `${SIGNALING_URL}/signaling?userId=${user.uid}&chatId=${chatId}`
    console.log('🔌 Connecting WebSocket:', wsUrl)

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    let intentionalClose = false

    ws.onopen = () => {
      console.log('✅ WebSocket connected')
      setIsConnected(true)

      ws.send(
        JSON.stringify({
          type: 'join-call',
          chatId,
          userId: user.uid,
        })
      )
    }

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        console.error('❌ WebSocket message error:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
      setIsConnected(false)
    }

    ws.onclose = (event) => {
      console.log('🔴 WebSocket disconnected:', event.code)
      setIsConnected(false)

      if (!intentionalClose && event.code !== 1000 && event.code !== 1006) {
        Alert.alert('Connection Lost', 'Call connection was lost.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ])
      }
    }

    return () => {
      console.log('🧹 Cleaning up WebSocket')
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
      wsRef.current.send(JSON.stringify(message))
      return true
    }
    return false
  }

  return { wsRef, isConnected, sendMessage }
}
