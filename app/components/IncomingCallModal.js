// components/IncomingCallModal.js - FIXED for web audio
import React, { useEffect, useRef } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import styled from 'styled-components/native'

// Only import Audio for native platforms
let Audio = null
if (Platform.OS !== 'web') {
  Audio = require('expo-av').Audio
}

export default function IncomingCallModal({
  visible,
  callerName,
  callType,
  onAccept,
  onReject,
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current
  const soundRef = useRef(null)
  const audioElementRef = useRef(null)

  useEffect(() => {
    if (visible) {
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start()

      // Play ringtone
      playRingtone()
    } else {
      pulseAnim.setValue(1)
      stopRingtone()
    }

    return () => {
      stopRingtone()
    }
  }, [visible])

  const playRingtone = async () => {
    try {
      if (Platform.OS === 'web') {
        // Use HTML5 Audio for web
        if (!audioElementRef.current) {
          audioElementRef.current = new window.Audio('../assets/ringtone.mp3')
          audioElementRef.current.loop = true
          audioElementRef.current.volume = 1.0
        }
        audioElementRef.current.play().catch((error) => {
          console.warn('Failed to play ringtone:', error)
        })
      } else if (Audio) {
        // Use Expo Audio for native
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/ringtone.mp3'),
          { isLooping: true, volume: 1.0 }
        )
        soundRef.current = sound
        await sound.playAsync()
      }
    } catch (error) {
      console.error('Failed to play ringtone:', error)
    }
  }

  const stopRingtone = async () => {
    try {
      if (Platform.OS === 'web') {
        // Stop HTML5 Audio
        if (audioElementRef.current) {
          audioElementRef.current.pause()
          audioElementRef.current.currentTime = 0
          audioElementRef.current = null
        }
      } else if (soundRef.current) {
        // Stop Expo Audio
        await soundRef.current.stopAsync()
        await soundRef.current.unloadAsync()
        soundRef.current = null
      }
    } catch (error) {
      console.error('Failed to stop ringtone:', error)
    }
  }

  const handleAccept = () => {
    stopRingtone()
    onAccept()
  }

  const handleReject = () => {
    stopRingtone()
    onReject()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <ModalOverlay>
        <ModalContent>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <CallerAvatar>
              <Ionicons
                name={callType === 'video' ? 'videocam' : 'call'}
                size={50}
                color="#fff"
              />
            </CallerAvatar>
          </Animated.View>

          <CallTypeText>
            {callType === 'video' ? 'Video' : 'Voice'} Call
          </CallTypeText>
          <CallerName>{callerName}</CallerName>
          <CallingText>is calling...</CallingText>

          <ButtonsContainer>
            <ActionButton onPress={handleReject} color="#dc2626">
              <Ionicons name="close" size={32} color="#fff" />
            </ActionButton>

            <ActionButton onPress={handleAccept} color="#10b981">
              <Ionicons name="call" size={32} color="#fff" />
            </ActionButton>
          </ButtonsContainer>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  )
}

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.9);
  justify-content: center;
  align-items: center;
`

const ModalContent = styled.View`
  align-items: center;
  padding: 40px;
`

const CallerAvatar = styled.View`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background-color: #3396d3;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
`

const CallTypeText = styled.Text`
  color: #9ca3af;
  font-size: 16px;
  margin-bottom: 8px;
`

const CallerName = styled.Text`
  color: #fff;
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
  text-align: center;
`

const CallingText = styled.Text`
  color: #9ca3af;
  font-size: 18px;
  margin-bottom: 60px;
`

const ButtonsContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  width: 100%;
  max-width: 300px;
`

const ActionButton = styled.TouchableOpacity`
  width: 70px;
  height: 70px;
  border-radius: 35px;
  background-color: ${(props) => props.color};
  justify-content: center;
  align-items: center;
  shadow-color: ${(props) => props.color};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.4;
  shadow-radius: 8px;
  elevation: 8;
`
