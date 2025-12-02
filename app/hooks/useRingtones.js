import { useEffect, useRef } from 'react'
import { Audio } from 'expo-av'

export function useRingtones(isIncoming, callAnswered) {
  const ringtoneRef = useRef(null)
  const ringbackToneRef = useRef(null)
  const isStoppingRingtones = useRef(false)
  const isRingtonesSetup = useRef(false)

  useEffect(() => {
    setupRingtones()

    if (isIncoming && !callAnswered) {
      playRingtone()
    } else if (!isIncoming && !callAnswered) {
      playRingbackTone()
    }

    return () => {
      stopRingtones()
    }
  }, [isIncoming, callAnswered])

  const setupRingtones = async () => {
    if (isRingtonesSetup.current) return
    isRingtonesSetup.current = true

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      })

      const { sound: ringtone } = await Audio.Sound.createAsync(
        require('../assets/ringtone.mp3'),
        { isLooping: true, volume: 1.0 }
      )
      ringtoneRef.current = ringtone

      const { sound: ringback } = await Audio.Sound.createAsync(
        require('../assets/ringbacktone.mp3'),
        { isLooping: true, volume: 0.8 }
      )
      ringbackToneRef.current = ringback
    } catch (error) {
      console.error('Setup ringtones error:', error)
      isRingtonesSetup.current = false
    }
  }

  const playRingtone = async () => {
    try {
      if (ringtoneRef.current) {
        await ringtoneRef.current.playAsync()
      }
    } catch (error) {
      console.error('❌ Play ringtone error:', error)
    }
  }

  const playRingbackTone = async () => {
    try {
      if (ringbackToneRef.current) {
        await ringbackToneRef.current.playAsync()
      }
    } catch (error) {
      console.error('❌ Play ringback tone error:', error)
    }
  }

  const stopRingtones = async () => {
    if (isStoppingRingtones.current) return
    isStoppingRingtones.current = true

    try {
      if (ringtoneRef.current) {
        await ringtoneRef.current.stopAsync().catch(() => {})
        await ringtoneRef.current.unloadAsync().catch(() => {})
        ringtoneRef.current = null
      }
      if (ringbackToneRef.current) {
        await ringbackToneRef.current.stopAsync().catch(() => {})
        await ringbackToneRef.current.unloadAsync().catch(() => {})
        ringbackToneRef.current = null
      }
    } catch (error) {
      console.warn('Stop ringtones error:', error)
    } finally {
      isStoppingRingtones.current = false
    }
  }

  return { stopRingtones }
}
