import { Alert, Platform, PermissionsAndroid } from 'react-native'
import { Audio } from 'expo-av'
import { useRef, useState } from 'react'

export const useAudioRecorder = () => {
  const [recording, setRecording] = useState(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [showRecordingUI, setShowRecordingUI] = useState(false)
  const recordingIntervalRef = useRef(null)

  const requestAndroidPermissions = async () => {
    try {
      console.log('Requesting Android permissions using PermissionsAndroid...')
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone to record audio.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      )
      console.log('Android permission result:', granted)
      return granted === PermissionsAndroid.RESULTS.GRANTED
    } catch (err) {
      console.error('Android permission error:', err)
      return false
    }
  }

  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          Alert.alert(
            'Not Supported',
            'Audio recording is not supported in this browser.'
          )
          return
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        })
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
        })
        const audioChunks = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunks.push(event.data)
        }

        mediaRecorder.start()
        setRecording({ mediaRecorder, stream, chunks: audioChunks })
        setShowRecordingUI(true)
        setRecordingDuration(0)

        recordingIntervalRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1)
        }, 1000)
      } else {
        console.log('=== STARTING RECORDING DEBUG ===')
        console.log('Platform:', Platform.OS)

        // Step 1: Request permissions using both methods
        console.log('Step 1: Requesting permissions...')

        let hasPermission = false

        // Try native Android permissions first (more reliable on some devices)
        if (Platform.OS === 'android') {
          hasPermission = await requestAndroidPermissions()
          console.log('Native Android permission granted:', hasPermission)
        }

        // Also try Expo Audio permissions
        if (!hasPermission) {
          console.log('Trying Expo Audio permissions...')
          const { status, canAskAgain, granted, expires } =
            await Audio.requestPermissionsAsync()
          console.log('Expo permission result:', {
            status,
            canAskAgain,
            granted,
            expires,
          })
          hasPermission = status === 'granted'
        }

        if (!hasPermission) {
          console.log('Permission DENIED - showing alert')
          Alert.alert(
            'Permission Required',
            'Microphone permission is required to record audio. Please enable it in your device settings.',
            [{ text: 'OK', onPress: () => console.log('Alert dismissed') }]
          )
          return
        }

        console.log('Permission GRANTED - proceeding...')

        // Step 2: Wait for permission to settle
        console.log('Step 2: Waiting 300ms for permission to settle...')
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Step 3: Configure audio mode with try-catch
        console.log('Step 3: Configuring audio mode...')

        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          })
          console.log('Audio mode configured successfully')
        } catch (audioModeError) {
          console.log(
            'Audio mode config failed (continuing anyway):',
            audioModeError.message
          )
        }

        // Step 4: Create recording with fallback configs
        console.log('Step 4: Creating recording...')

        const recordingConfigs = [
          // Config 1: Simple, reliable config
          {
            name: 'Simple Config',
            android: {
              extension: '.m4a',
              outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
              audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
              sampleRate: 44100,
              numberOfChannels: 1,
              bitRate: 96000,
            },
            ios: {
              extension: '.m4a',
              audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
              sampleRate: 44100,
              numberOfChannels: 1,
              bitRate: 96000,
            },
          },
          // Config 2: Lower quality
          {
            name: 'Low Quality Config',
            android: {
              extension: '.m4a',
              outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
              audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
              sampleRate: 16000,
              numberOfChannels: 1,
              bitRate: 32000,
            },
            ios: {
              extension: '.m4a',
              audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_LOW,
              sampleRate: 16000,
              numberOfChannels: 1,
              bitRate: 32000,
            },
          },
        ]

        let newRecording = null
        for (const config of recordingConfigs) {
          try {
            console.log(`Trying: ${config.name}`)
            const result = await Audio.Recording.createAsync(config)
            newRecording = result.recording
            console.log(`✓ SUCCESS with ${config.name}`)
            break
          } catch (configError) {
            console.log(`✗ Failed with ${config.name}:`, configError.message)
          }
        }

        if (!newRecording) {
          throw new Error(
            'All recording configurations failed. Check console logs.'
          )
        }

        console.log('Recording object created successfully!')
        console.log('=== RECORDING STARTED ===')

        setRecording(newRecording)
        setShowRecordingUI(true)
        setRecordingDuration(0)

        recordingIntervalRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1)
        }, 1000)

        console.log('UI updated, timer started')
      }
    } catch (err) {
      console.error('=== RECORDING FAILED ===')
      console.error('Error type:', err.constructor.name)
      console.error('Error message:', err.message)
      console.error('Error stack:', err.stack)
      Alert.alert(
        'Recording Error',
        `Failed to start recording:\n\n${err.message}\n\nCheck console logs for details.`,
        [{ text: 'OK' }]
      )
    }
  }

  const stopRecording = async () => {
    if (!recording) return null

    try {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }

      if (Platform.OS === 'web') {
        return new Promise((resolve) => {
          if (
            recording.mediaRecorder &&
            recording.mediaRecorder.state !== 'inactive'
          ) {
            recording.mediaRecorder.addEventListener('stop', () => {
              const audioBlob = new Blob(recording.chunks, {
                type: 'audio/webm',
              })
              const audioUrl = URL.createObjectURL(audioBlob)

              if (recording.stream) {
                recording.stream.getTracks().forEach((track) => track.stop())
              }

              setRecording(null)
              setShowRecordingUI(false)
              setRecordingDuration(0)

              resolve({
                blob: audioBlob,
                url: audioUrl,
                name: `recording_${Date.now()}.webm`,
                type: 'audio/webm',
              })
            })

            recording.mediaRecorder.stop()
          } else {
            setRecording(null)
            setShowRecordingUI(false)
            setRecordingDuration(0)
            resolve(null)
          }
        })
      } else {
        console.log('Stopping recording...')
        await recording.stopAndUnloadAsync()
        const uri = recording.getURI()
        console.log('Recording stopped, URI:', uri)

        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            shouldDuckAndroid: false,
          })
        } catch (e) {
          console.log('Audio mode reset skipped:', e.message)
        }

        setRecording(null)
        setShowRecordingUI(false)
        setRecordingDuration(0)

        return {
          uri,
          name: `recording_${Date.now()}.m4a`,
          type: 'audio/m4a',
        }
      }
    } catch (err) {
      console.error('Failed to stop recording:', err)
      Alert.alert('Error', `Failed to stop recording: ${err.message}`)
      return null
    }
  }

  const cancelRecording = async () => {
    if (!recording) return

    try {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }

      if (Platform.OS === 'web') {
        if (
          recording.mediaRecorder &&
          recording.mediaRecorder.state !== 'inactive'
        ) {
          recording.mediaRecorder.stop()
        }
        if (recording.stream) {
          recording.stream.getTracks().forEach((track) => track.stop())
        }
        if (recording.url) {
          URL.revokeObjectURL(recording.url)
        }
      } else {
        await recording.stopAndUnloadAsync()
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            shouldDuckAndroid: false,
          })
        } catch (e) {
          console.log('Audio mode reset skipped:', e.message)
        }
      }

      setRecording(null)
      setShowRecordingUI(false)
      setRecordingDuration(0)
    } catch (err) {
      console.error('Failed to cancel recording:', err)
    }
  }

  return {
    recording,
    recordingDuration,
    showRecordingUI,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}
