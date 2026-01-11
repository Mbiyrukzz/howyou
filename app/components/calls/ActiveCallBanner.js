// components/calls/ActiveCallBanner.js
import React, { useState, useEffect } from 'react'
import { TouchableOpacity, Animated, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import { useChats } from '../../hooks/useChats'

const BannerContainer = styled(Animated.View)`
  position: absolute;
  top: ${Platform.OS === 'ios' ? '50px' : '10px'};
  left: 16px;
  right: 16px;
  z-index: 9999;
  elevation: 10;
`

const Banner = styled.View`
  background-color: #10b981;
  border-radius: 12px;
  padding: 12px 16px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 8;
`

const BannerContent = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`

const IconContainer = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: rgba(255, 255, 255, 0.2);
  align-items: center;
  justify-content: center;
  margin-right: 12px;
`

const TextContainer = styled.View`
  flex: 1;
`

const CallerName = styled.Text`
  color: white;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 2px;
`

const CallDuration = styled.Text`
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
`

const ActionButton = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.2);
  align-items: center;
  justify-content: center;
  margin-left: 8px;
`

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const ActiveCallBanner = () => {
  const navigation = useNavigation()
  const { activeCall, endActiveCall } = useChats()
  const [duration, setDuration] = useState(0)
  const [slideAnim] = useState(new Animated.Value(-100))

  console.log('🎨 ActiveCallBanner render:', { hasActiveCall: !!activeCall })

  useEffect(() => {
    if (activeCall) {
      console.log('✅ Active call detected, showing banner:', activeCall)

      // Slide in animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start()

      // Update duration every second
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - activeCall.startTime) / 1000)
        setDuration(elapsed)
      }, 1000)

      return () => clearInterval(interval)
    } else {
      console.log('❌ No active call, hiding banner')

      // Slide out animation
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }, [activeCall, slideAnim])

  if (!activeCall) {
    console.log('⏭️ No active call, returning null')
    return null
  }

  const handleBannerPress = () => {
    console.log('📱 Banner pressed, navigating to call screen')
    navigation.navigate('Chats', {
      screen: 'CallScreen',
      params: {
        chatId: activeCall.chatId,
        remoteUserId: activeCall.remoteUserId,
        remoteUserName: activeCall.remoteUserName,
        callType: activeCall.callType,
        callId: activeCall.callId,
        livekitUrl: activeCall.livekitUrl,
        token: activeCall.token,
        isReturning: true,
      },
    })
  }

  const handleEndCall = () => {
    console.log('🔴 End call button pressed on banner')
    endActiveCall()
  }

  const CallIcon = activeCall.callType === 'video' ? 'videocam' : 'call'

  return (
    <BannerContainer style={{ transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity activeOpacity={0.9} onPress={handleBannerPress}>
        <Banner>
          <BannerContent>
            <IconContainer>
              <Ionicons name={CallIcon} size={20} color="white" />
            </IconContainer>
            <TextContainer>
              <CallerName numberOfLines={1}>
                {activeCall.remoteUserName}
              </CallerName>
              <CallDuration>
                {activeCall.status === 'connected'
                  ? formatDuration(duration)
                  : 'Connecting...'}
              </CallDuration>
            </TextContainer>
          </BannerContent>
          <ActionButton onPress={handleEndCall}>
            <Ionicons name="close" size={18} color="white" />
          </ActionButton>
        </Banner>
      </TouchableOpacity>
    </BannerContainer>
  )
}
