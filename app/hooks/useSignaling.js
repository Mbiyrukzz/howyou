import { useEffect, useRef } from 'react'
import { Alert } from 'react-native'
import { RTCPeerConnection, mediaDevices } from 'react-native-webrtc'

const SIGNALING_URL = 'ws://10.38.189.87:5000/signaling'
const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }]

export default function useSignaling(userId, chatId, onRemoteStream) {
  const wsRef = useRef(null)
  const pcRef = useRef(null)
  const localStreamRef = useRef(null)

  useEffect(() => {
    if (!userId) return
    const ws = new WebSocket(
      `${SIGNALING_URL}?userId=${userId}&chatId=${chatId}`
    )
    wsRef.current = ws

    ws.onopen = () => console.log('🟢 Connected to signaling server')
    ws.onmessage = (msg) => handleSignalingMessage(JSON.parse(msg.data))
    ws.onerror = (err) => console.error('❌ WebSocket error:', err)
    ws.onclose = () => console.log('🔴 WebSocket disconnected')

    return () => ws.close()
  }, [userId, chatId])

  const send = (type, targetId, payload) => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return
    wsRef.current.send(JSON.stringify({ type, targetId, payload }))
  }

  const createPeerConnection = async () => {
    pcRef.current = new RTCPeerConnection({ iceServers })

    pcRef.current.onicecandidate = (e) => {
      if (e.candidate) {
        send('candidate', remoteUserId.current, e.candidate)
      }
    }

    pcRef.current.ontrack = (e) => {
      console.log('📡 Remote stream received')
      onRemoteStream(e.streams[0])
    }

    localStreamRef.current = await mediaDevices.getUserMedia({
      audio: true,
      video: true,
    })

    localStreamRef.current.getTracks().forEach((track) => {
      pcRef.current.addTrack(track, localStreamRef.current)
    })
  }

  const handleSignalingMessage = async (data) => {
    const { type, senderId, payload } = data

    switch (type) {
      case 'incoming_call':
        Alert.alert('📞 Incoming Call', `User ${senderId} is calling...`, [
          {
            text: 'Reject',
            onPress: () =>
              send('call_rejected', senderId, { callId: payload?.callId }),
          },
          {
            text: 'Accept',
            onPress: async () => await answerCall(senderId, payload?.callId),
          },
        ])
        break

      case 'offer':
        await handleOffer(senderId, payload)
        break

      case 'answer':
        await pcRef.current?.setRemoteDescription(payload)
        break

      case 'candidate':
        if (payload) {
          try {
            await pcRef.current?.addIceCandidate(payload)
          } catch (e) {
            console.error('ICE candidate error', e)
          }
        }
        break

      case 'call_rejected':
        Alert.alert('Call Rejected', `User ${senderId} declined.`)
        endCall()
        break

      case 'call_accepted':
        console.log('✅ Call accepted')
        break

      case 'end_call':
        endCall()
        break
    }
  }

  const startCall = async (targetId) => {
    await createPeerConnection()
    const offer = await pcRef.current.createOffer()
    await pcRef.current.setLocalDescription(offer)
    send('offer', targetId, offer)
  }

  const handleOffer = async (senderId, offer) => {
    await createPeerConnection()
    await pcRef.current.setRemoteDescription(offer)
    const answer = await pcRef.current.createAnswer()
    await pcRef.current.setLocalDescription(answer)
    send('answer', senderId, answer)
  }

  const answerCall = async (callerId, callId) => {
    send('call_accepted', callerId, { callId })
  }

  const endCall = () => {
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    console.log('🛑 Call ended')
  }

  return { startCall, endCall, localStreamRef }
}
