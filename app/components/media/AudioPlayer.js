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

  const waveHeights = [8, 15, 20, 12, 18, 25, 15, 10, 20, 15]

  useEffect(() => {
    return () => {
      if (sound) {
        if (Platform.OS === 'web') {
          sound.pause()
          sound.currentTime = 0
        } else {
          sound.unloadAsync().catch(console.error)
        }
      }
    }
  }, [sound])

  const playAudio = async () => {
    try {
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
        return
      }

      if (Platform.OS === 'web') {
        const audio = new window.Audio(audioUrl)
        audio.addEventListener('loadedmetadata', () => {
          setDuration(Math.floor(audio.duration))
        })
        audio.addEventListener('ended', () => {
          setIsPlaying(false)
          setSound(null)
        })
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
      <PlayButton isOwn={isOwn} onPress={playAudio}>
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={20}
          color={isOwn ? '#fff' : '#fff'}
        />
      </PlayButton>

      <AudioWaveform>
        {waveHeights.map((height, i) => (
          <WaveBar key={i} height={height} isOwn={isOwn} />
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
