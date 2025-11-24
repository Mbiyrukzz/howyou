import { Alert, Platform } from 'react-native'
import { Audio } from 'expo-av'
import { useRef, useState } from 'react'

export const useAudioRecorder = () => {
  const [recording, setRecording] = useState(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [showRecordingUI, setShowRecordingUI] = useState(false)
  const recordingIntervalRef = useRef(null)

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
        const { status } = await Audio.requestPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Microphone permission is required')
          return
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        })

        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        )

        setRecording(newRecording)
        setShowRecordingUI(true)
        setRecordingDuration(0)

        recordingIntervalRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1)
        }, 1000)
      }
    } catch (err) {
      console.error('Failed to start recording:', err)
      Alert.alert('Error', 'Failed to start recording')
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
            resolve(null)
          }
        })
      } else {
        await recording.stopAndUnloadAsync()
        const uri = recording.getURI()

        await Audio.setAudioModeAsync({ allowsRecordingIOS: false })

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
      Alert.alert('Error', 'Failed to stop recording')
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
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false })
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
