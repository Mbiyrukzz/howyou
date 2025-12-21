import React, { useState, useEffect, useRef } from 'react'
import { Platform, Animated, Alert } from 'react-native'
import { Audio } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'
import { File, Paths } from 'expo-file-system'
import styled from 'styled-components/native'
import {
  MessageAudioPlayer,
  PlayButton,
  AudioWaveform,
  WaveBar,
  AudioInfo,
  AudioDuration,
} from '../../styles/chatStyles'

const DownloadButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: ${(props) =>
    props.isOwn ? 'rgba(255, 255, 255, 0.2)' : 'rgba(59, 130, 246, 0.15)'};
  justify-content: center;
  align-items: center;
  margin-left: 8px;
`

export const AudioPlayer = ({ audioUrl, isOwn }) => {
  const [sound, setSound] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [downloading, setDownloading] = useState(false)

  // Authentic ECG heartbeat pattern: flat baseline → P wave → QRS complex (sharp spike) → T wave → baseline
  const ecgHeartbeat = [
    // Baseline
    18, 18, 18, 18, 18,
    // P wave (small bump)
    18, 19, 21, 20, 18,
    // PR segment (flat)
    18, 18, 18,
    // QRS complex (dramatic spike - the main heartbeat!)
    18, 17, 14, 10, 5, 2, 8, 18, 28, 36, 32, 24, 18, 15, 18,
    // ST segment
    18, 18, 18,
    // T wave (gentle curve)
    18, 20, 23, 24, 23, 20, 18,
    // Return to baseline
    18, 18, 18, 18, 18, 18, 18, 18,
  ]

  const scrollX = useRef(new Animated.Value(0)).current
  const animationRef = useRef(null)

  useEffect(() => {
    if (isPlaying) {
      // Smooth continuous scrolling animation - adjusted for realistic ECG speed
      animationRef.current = Animated.loop(
        Animated.timing(scrollX, {
          toValue: -ecgHeartbeat.length * 6,
          duration: 1800, // Realistic heart rate timing (~67 bpm)
          useNativeDriver: true,
        })
      )
      animationRef.current.start()
    } else {
      if (animationRef.current) {
        animationRef.current.stop()
      }
      scrollX.setValue(0)
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop()
      }
    }
  }, [isPlaying])

  useEffect(() => {
    return () => {
      if (sound) {
        if (Platform.OS === 'web') {
          sound.pause()
          sound.src = ''
          sound.currentTime = 0
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

  const downloadAudio = async () => {
    if (!audioUrl) {
      Alert.alert('Error', 'Audio URL is missing')
      return
    }

    setDownloading(true)

    try {
      // Extract extension from URL or default to mp3
      const urlParts = audioUrl.split('.')
      const extension = urlParts[urlParts.length - 1].split('?')[0] || 'mp3'
      const fileName = `audio_${Date.now()}.${extension}`

      console.log('📥 Starting audio download:', {
        from: audioUrl,
        fileName: fileName,
      })

      if (Platform.OS === 'web') {
        // Web: Create download link
        const link = document.createElement('a')
        link.href = audioUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        Alert.alert('Success', 'Audio download started')
      } else {
        // iOS/Android: Use new File API
        const downloadPath = Paths.document + '/' + fileName
        const file = new File(downloadPath)

        console.log('Downloading to:', downloadPath)

        await file.create()
        const response = await fetch(audioUrl)

        if (!response.ok) {
          throw new Error(`Download failed with status: ${response.status}`)
        }

        const blob = await response.blob()
        await file.write(blob)

        console.log('✅ Download completed:', downloadPath)

        Alert.alert('Download Complete', `Audio saved: ${fileName}`)
      }
    } catch (error) {
      console.error('❌ Download error:', error)
      Alert.alert(
        'Download Failed',
        error.message || 'Failed to download audio'
      )
    } finally {
      setDownloading(false)
    }
  }

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
        setDuration(0)
        return
      }

      if (Platform.OS === 'web') {
        if (sound) {
          sound.pause()
          sound.src = ''
          sound.removeEventListener('loadedmetadata', () => {})
          sound.removeEventListener('ended', () => {})
        }

        const audio = new window.Audio()
        audio.src = audioUrl
        audio.preload = 'metadata'
        audio.crossOrigin = 'anonymous'

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

  // Triple the pattern for seamless infinite loop
  const extendedPattern = [...ecgHeartbeat, ...ecgHeartbeat, ...ecgHeartbeat]

  return (
    <MessageAudioPlayer isOwn={isOwn}>
      <PlayButton isOwn={isOwn} onPress={playAudio} activeOpacity={0.7}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color="#fff" />
      </PlayButton>

      <AudioWaveform style={{ overflow: 'hidden' }}>
        <Animated.View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
            transform: [{ translateX: scrollX }],
          }}
        >
          {extendedPattern.map((height, i) => (
            <WaveBar
              key={i}
              height={isPlaying ? height : 18}
              isOwn={isOwn}
              isPlaying={isPlaying}
              style={{
                opacity: isPlaying ? 1 : 0.3,
              }}
            />
          ))}
        </Animated.View>
      </AudioWaveform>

      <AudioInfo>
        <AudioDuration isOwn={isOwn}>
          {duration > 0 ? formatDuration(duration) : '0:00'}
        </AudioDuration>

        <DownloadButton
          isOwn={isOwn}
          onPress={downloadAudio}
          disabled={downloading}
          activeOpacity={0.7}
        >
          {downloading ? (
            <Ionicons
              name="refresh"
              size={18}
              color={isOwn ? '#fff' : '#3b82f6'}
            />
          ) : (
            <Ionicons
              name="download-outline"
              size={18}
              color={isOwn ? '#fff' : '#3b82f6'}
            />
          )}
        </DownloadButton>
      </AudioInfo>
    </MessageAudioPlayer>
  )
}
