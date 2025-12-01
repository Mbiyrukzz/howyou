// components/IncomingCallModal.js - Enhanced with modern design
import React, { useEffect, useRef } from 'react'
import { Modal, Animated, Platform } from 'react-native'
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
  callerColor = '#3b82f6',
  onAccept,
  onReject,
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current
  const glowAnim = useRef(new Animated.Value(0)).current
  const soundRef = useRef(null)
  const audioElementRef = useRef(null)

  useEffect(() => {
    if (visible) {
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
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

      // Start glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start()

      playRingtone()
    } else {
      pulseAnim.setValue(1)
      glowAnim.setValue(0)
      stopRingtone()
    }

    return () => {
      stopRingtone()
    }
  }, [visible])

  const playRingtone = async () => {
    try {
      if (Platform.OS === 'web') {
        if (!audioElementRef.current) {
          audioElementRef.current = new window.Audio('../assets/ringtone.mp3')
          audioElementRef.current.loop = true
          audioElementRef.current.volume = 1.0
        }
        audioElementRef.current.play().catch((error) => {
          console.warn('Failed to play ringtone:', error)
        })
      } else if (Audio) {
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
        if (audioElementRef.current) {
          audioElementRef.current.pause()
          audioElementRef.current.currentTime = 0
          audioElementRef.current = null
        }
      } else if (soundRef.current) {
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

  const callTypeColor = callType === 'video' ? '#10b981' : '#3b82f6'

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <ModalOverlay>
        <ModalContent>
          <TopSection>
            <CallTypeBadge color={callTypeColor}>
              <Ionicons
                name={callType === 'video' ? 'videocam' : 'call'}
                size={18}
                color={callTypeColor}
              />
              <CallTypeBadgeText color={callTypeColor}>
                {callType === 'video' ? 'Video' : 'Voice'} Call
              </CallTypeBadgeText>
            </CallTypeBadge>
          </TopSection>

          <AvatarSection>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <CallerAvatar color={callerColor}>
                <CallerAvatarText>
                  {callerName?.charAt(0)?.toUpperCase() || '?'}
                </CallerAvatarText>
                <PulseRing style={{ opacity: glowAnim }} color={callerColor} />
              </CallerAvatar>
            </Animated.View>
          </AvatarSection>

          <InfoSection>
            <CallerName>{callerName}</CallerName>
            <CallingText>Incoming call...</CallingText>
          </InfoSection>

          <ButtonsSection>
            <ActionButtonContainer>
              <ActionButton onPress={handleReject} color="#ef4444">
                <Ionicons name="close" size={32} color="#fff" />
              </ActionButton>
              <ActionButtonLabel decline>Decline</ActionButtonLabel>
            </ActionButtonContainer>

            <ActionButtonContainer>
              <ActionButton onPress={handleAccept} color="#10b981">
                <Ionicons name="call" size={32} color="#fff" />
              </ActionButton>
              <ActionButtonLabel>Accept</ActionButtonLabel>
            </ActionButtonContainer>
          </ButtonsSection>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  )
}

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.95);
  justify-content: center;
  align-items: center;
`

const ModalContent = styled.View`
  align-items: center;
  padding: 40px 20px;
  width: 100%;
  max-width: 400px;
`

const TopSection = styled.View`
  margin-bottom: 40px;
`

const CallTypeBadge = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: ${(props) =>
    props.color === '#10b981' ? '#dcfce7' : '#dbeafe'};
  padding: 10px 20px;
  border-radius: 20px;
  gap: 8px;
`

const CallTypeBadgeText = styled.Text`
  font-size: 15px;
  font-weight: 700;
  color: ${(props) => props.color};
`

const AvatarSection = styled.View`
  margin-bottom: 32px;
  align-items: center;
  justify-content: center;
`

const CallerAvatar = styled.View`
  width: 130px;
  height: 130px;
  border-radius: 65px;
  background-color: ${(props) => props.color || '#3b82f6'};
  justify-content: center;
  align-items: center;
  shadow-color: ${(props) => props.color || '#3b82f6'};
  shadow-offset: 0px 8px;
  shadow-opacity: 0.4;
  shadow-radius: 16px;
  elevation: 8;
  border-width: 4px;
  border-color: rgba(255, 255, 255, 0.2);
`

const CallerAvatarText = styled.Text`
  color: white;
  font-size: 48px;
  font-weight: 700;
`

const PulseRing = styled(Animated.View)`
  position: absolute;
  width: 160px;
  height: 160px;
  border-radius: 80px;
  border-width: 3px;
  border-color: ${(props) => props.color || '#3b82f6'};
`

const InfoSection = styled.View`
  align-items: center;
  margin-bottom: 60px;
`

const CallerName = styled.Text`
  color: #fff;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  text-align: center;
`

const CallingText = styled.Text`
  color: #94a3b8;
  font-size: 16px;
  font-weight: 500;
`

const ButtonsSection = styled.View`
  flex-direction: row;
  justify-content: space-around;
  width: 100%;
  max-width: 320px;
  gap: 40px;
`

const ActionButtonContainer = styled.View`
  align-items: center;
  gap: 12px;
`

const ActionButton = styled.TouchableOpacity`
  width: 72px;
  height: 72px;
  border-radius: 36px;
  background-color: ${(props) => props.color};
  justify-content: center;
  align-items: center;
  shadow-color: ${(props) => props.color};
  shadow-offset: 0px 6px;
  shadow-opacity: 0.5;
  shadow-radius: 12px;
  elevation: 10;
`

const ActionButtonLabel = styled.Text`
  color: ${(props) => (props.decline ? '#ef4444' : '#10b981')};
  font-size: 15px;
  font-weight: 700;
`
