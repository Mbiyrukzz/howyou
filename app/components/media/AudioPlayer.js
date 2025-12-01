import React, { useState, useEffect } from 'react'
import { Platform } from 'react-native'
import { Audio } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'
import {
  MessageAudioPlayer,
  PlayButton,
  AudioWaveform,
  WaveBar,
  AudioInfo,
  AudioDuration,
} from '../../styles/chatStyles'

export const AudioPlayer = ({ audioUrl, isOwn }) => {
  const [sound, setSound] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)

  const waveHeights = [12, 20, 16, 24, 18, 28, 22, 16, 20, 14, 18, 24]

  useEffect(() => {
    return () => {
      if (sound) {
        if (Platform.OS === 'web') {
          sound.pause()
          sound.src = ''
          sound.currentTime = 0
          // Remove listeners to prevent memory leaks
          sound.removeEventListener('ended', () => {})
          sound.removeEventListener('canplaythrough', () => {})
          sound.removeEventListener('error', () => {})
        } else {
          sound.unloadAsync().catch(() => {})
        }
        setSound(null)
      }
    }
  }, [sound])

  const playAudio = async () => {
    try {
      // === PAUSE / STOP CURRENT ===
      if (sound && isPlaying) {
        if (Platform.OS === 'web') {
          sound.pause()
          sound.currentTime = 0
        } else {
          await sound.stopAsync()
          await sound.unloadAsync()
        }
        setSound(null)
        setIsPlaying(false)
        setDuration(0)
        return
      }

      // === WEB: PROPER WAY (Keep reference + event listeners) ===
      if (Platform.OS === 'web') {
        // Kill any previous sound
        if (sound) {
          sound.pause()
          sound.src = ''
          sound.removeEventListener('loadedmetadata', () => {})
          sound.removeEventListener('ended', () => {})
        }

        const audio = new window.Audio()
        audio.src = audioUrl

        // Critical: These must be set BEFORE calling play()
        audio.preload = 'metadata'
        audio.crossOrigin = 'anonymous'

        // Wait for canplaythrough to avoid choppy start
        const playPromise = new Promise((resolve, reject) => {
          audio.addEventListener('canplaythrough', resolve, { once: true })
          audio.addEventListener('error', (e) => reject(e.error), {
            once: true,
          })
          audio.addEventListener(
            'loadedmetadata',
            () => {
              setDuration(Math.floor(audio.duration) || 0)
            },
            { once: true }
          )

          audio.addEventListener(
            'ended',
            () => {
              setIsPlaying(false)
              setSound(null)
            },
            { once: true }
          )
        })

        // Load and play
        await audio.load()
        await playPromise
        await audio.play()

        setSound(audio)
        setIsPlaying(true)
      } else {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        })

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, volume: 1.0 },
          (status) => {
            if (status.isLoaded) {
              if (status.durationMillis) {
                setDuration(Math.floor(status.durationMillis / 1000))
              }
              if (status.didJustFinish) {
                setIsPlaying(false)
                newSound.unloadAsync()
                setSound(null)
              }
            }
          }
        )
        setSound(newSound)
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Error playing audio:', error)
      setIsPlaying(false)
    }
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <MessageAudioPlayer isOwn={isOwn}>
      <PlayButton isOwn={isOwn} onPress={playAudio} activeOpacity={0.7}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color="#fff" />
      </PlayButton>

      <AudioWaveform>
        {waveHeights.map((height, i) => (
          <WaveBar
            key={i}
            height={isPlaying ? height : height * 0.6}
            isOwn={isOwn}
            style={{
              opacity: isPlaying && i % 2 === 0 ? 1 : 0.6,
            }}
          />
        ))}
      </AudioWaveform>

      <AudioInfo>
        <AudioDuration isOwn={isOwn}>
          {duration > 0 ? formatDuration(duration) : '0:00'}
        </AudioDuration>
      </AudioInfo>
    </MessageAudioPlayer>
  )
}
