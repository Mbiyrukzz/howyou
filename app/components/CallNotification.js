import React, { useContext, useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  Vibration,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import { Audio } from 'expo-av'
import ChatsContext from '../contexts/ChatsContext'
import { useNavigation } from '@react-navigation/native'

const { width: screenWidth } = Dimensions.get('window')

const CallNotification = () => {
  const navigation = useNavigation()
  const {
    incomingCall,
    callNotification,
    answerCall,
    rejectCall,
    dismissCallNotification,
    findUserById,
  } = useContext(ChatsContext)

  const [sound, setSound] = useState(null)
  const [isVibrating, setIsVibrating] = useState(false)

  useEffect(() => {
    if (callNotification?.type === 'incoming_call') {
      playRingtone()
      startVibration()
    } else {
      stopRingtone()
      stopVibration()
    }

    return () => {
      stopRingtone()
      stopVibration()
    }
  }, [callNotification])

  const playRingtone = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../assets/sounds/ringtone.mp3'),
        {
          shouldPlay: true,
          isLooping: true,
          volume: 0.8,
        }
      )
      setSound(newSound)
    } catch (error) {
      console.error('Error playing ringtone:', error)
    }
  }

  const stopRingtone = async () => {
    if (sound) {
      try {
        await sound.stopAsync()
        await sound.unloadAsync()
        setSound(null)
      } catch (error) {
        console.error('Error stopping ringtone:', error)
      }
    }
  }

  const startVibration = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      setIsVibrating(true)
      const vibrationPattern = [1000, 1000] // 1 second on, 1 second off
      Vibration.vibrate(vibrationPattern, true) // Repeat
    }
  }

  const stopVibration = () => {
    if (isVibrating) {
      Vibration.cancel()
      setIsVibrating(false)
    }
  }

  const handleAnswerCall = async () => {
    if (!incomingCall) return

    try {
      stopRingtone()
      stopVibration()

      const result = await answerCall(incomingCall.callId, true)

      if (result.success) {
        const caller = findUserById(incomingCall.caller.id)
        navigation.navigate('CallScreen', {
          chatId: incomingCall.chatId,
          remoteUserId: incomingCall.caller.id,
          remoteUserName: caller?.name || incomingCall.caller.name,
          callType: incomingCall.callType,
        })
      }
    } catch (error) {
      console.error('Error answering call:', error)
    }
  }

  const handleRejectCall = async () => {
    console.log('📵 User rejecting call...')

    stopRingtones()
    clearRingTimer()

    try {
      // Notify backend that call was rejected
      const response = await fetch(
        `http://localhost:5000/answer-call/${route.params?.callId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({ accepted: false }),
        }
      )

      const data = await response.json()
      console.log('✅ Backend notified of call rejection')

      // Send WebSocket notification to caller
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'call-rejected',
            from: user?.uid,
            to: remoteUserId,
            chatId,
          })
        )
      }
    } catch (error) {
      console.error('❌ Error rejecting call:', error)
    } finally {
      cleanup()
      navigation.goBack()
    }
  }

  const handleDismiss = () => {
    stopRingtone()
    stopVibration()
    dismissCallNotification()
  }

  if (!callNotification || callNotification.type !== 'incoming_call') {
    return null
  }

  const caller = callNotification.caller
  const isVideoCall = callNotification.callType === 'video'

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <CallOverlay>
        <CallContainer>
          {/* Background blur effect */}
          <BackgroundBlur />

          {/* Caller info */}
          <CallerSection>
            <CallerAvatar>
              <CallerAvatarText>
                {caller.name?.[0]?.toUpperCase() || '?'}
              </CallerAvatarText>
            </CallerAvatar>

            <CallerName>{caller.name || 'Unknown'}</CallerName>

            <CallTypeText>
              {isVideoCall ? 'Video Call' : 'Voice Call'}
            </CallTypeText>

            {/* Animated ring indicator */}
            <RingIndicator>
              <RingPulse />
              <RingPulse delay={0.5} />
              <RingPulse delay={1} />
            </RingIndicator>
          </CallerSection>

          {/* Call actions */}
          <ActionsSection>
            <ActionButton
              onPress={handleRejectCall}
              backgroundColor="#e74c3c"
              style={{ transform: [{ scale: 1.1 }] }}
            >
              <Ionicons name="call" size={32} color="#fff" />
            </ActionButton>

            <ActionButton
              onPress={handleAnswerCall}
              backgroundColor="#27ae60"
              style={{ transform: [{ scale: 1.1 }] }}
            >
              <Ionicons
                name={isVideoCall ? 'videocam' : 'call'}
                size={32}
                color="#fff"
              />
            </ActionButton>
          </ActionsSection>

          {/* Additional options */}
          <QuickActions>
            <QuickActionButton onPress={handleDismiss}>
              <Ionicons name="notifications-off" size={20} color="#fff" />
              <QuickActionText>Dismiss</QuickActionText>
            </QuickActionButton>

            <QuickActionButton>
              <Ionicons name="chatbubble" size={20} color="#fff" />
              <QuickActionText>Message</QuickActionText>
            </QuickActionButton>
          </QuickActions>
        </CallContainer>
      </CallOverlay>
    </Modal>
  )
}

// Styled Components
const CallOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.9);
  justify-content: center;
  align-items: center;
`

const CallContainer = styled.View`
  width: ${screenWidth * 0.9}px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 40px 20px;
  align-items: center;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.2);
`

const BackgroundBlur = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 24px;
`

const CallerSection = styled.View`
  align-items: center;
  margin-bottom: 40px;
`

const CallerAvatar = styled.View`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background-color: #3498db;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  border-width: 4px;
  border-color: rgba(255, 255, 255, 0.3);
`

const CallerAvatarText = styled.Text`
  color: #fff;
  font-size: 48px;
  font-weight: bold;
`

const CallerName = styled.Text`
  color: #fff;
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
  text-align: center;
`

const CallTypeText = styled.Text`
  color: rgba(255, 255, 255, 0.8);
  font-size: 18px;
  margin-bottom: 20px;
`

const RingIndicator = styled.View`
  position: relative;
  width: 60px;
  height: 60px;
`

const RingPulse = styled.View`
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  border-width: 2px;
  border-color: rgba(255, 255, 255, 0.5);
  animation: pulse 2s infinite;
  animation-delay: ${(props) => props.delay || 0}s;
`

const ActionsSection = styled.View`
  flex-direction: row;
  justify-content: space-around;
  width: 100%;
  margin-bottom: 30px;
  padding: 0 20px;
`

const ActionButton = styled.TouchableOpacity`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: ${(props) => props.backgroundColor};
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 8;
`

const QuickActions = styled.View`
  flex-direction: row;
  justify-content: space-around;
  width: 100%;
  padding: 0 40px;
`

const QuickActionButton = styled.TouchableOpacity`
  align-items: center;
  padding: 10px;
`

const QuickActionText = styled.Text`
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  margin-top: 4px;
`

export default CallNotification
