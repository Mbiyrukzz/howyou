import React, { useState, useEffect, useRef } from 'react'
import { Animated, Easing } from 'react-native'
import { SoundWaveContainer, SoundWaveBar } from '../../styles/chatStyles'

export const SoundWaveAnimation = ({
  isRecording = true,
  barCount = 15,
  animationSpeed = 1,
  volume = 0.5, // 0 to 1, can be connected to actual audio levels
  responsive = false, // Enable volume-responsive animation
}) => {
  // Predefined heights for realistic wave pattern
  const waveHeights = [
    { min: 8, max: 20 }, // Bar 1
    { min: 10, max: 35 }, // Bar 2
    { min: 8, max: 28 }, // Bar 3
    { min: 12, max: 40 }, // Bar 4
    { min: 10, max: 32 }, // Bar 5
    { min: 14, max: 45 }, // Bar 6 (tallest)
    { min: 12, max: 38 }, // Bar 7
    { min: 14, max: 42 }, // Bar 8
    { min: 10, max: 30 }, // Bar 9
    { min: 12, max: 38 }, // Bar 10
    { min: 10, max: 35 }, // Bar 11
    { min: 12, max: 40 }, // Bar 12
    { min: 10, max: 32 }, // Bar 13
    { min: 10, max: 35 }, // Bar 14
    { min: 8, max: 25 }, // Bar 15
  ]

  // Create animated values for each bar
  const animatedValues = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0))
  ).current

  // Volume animated value for responsive mode
  const volumeAnim = useRef(new Animated.Value(0.5)).current

  // Update volume animation when volume prop changes
  useEffect(() => {
    if (responsive && isRecording) {
      Animated.timing(volumeAnim, {
        toValue: volume,
        duration: 100,
        useNativeDriver: false,
      }).start()
    }
  }, [volume, responsive, isRecording, volumeAnim])

  useEffect(() => {
    if (!isRecording) {
      // Stop all animations and return to minimum height
      animatedValues.forEach((value) => {
        value.stopAnimation()
        Animated.timing(value, {
          toValue: 0,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: false,
        }).start()
      })
      return
    }

    // Create wave animations for each bar
    const animations = animatedValues.map((animatedValue, index) => {
      // Randomize duration for more natural effect
      const baseDuration = 400 / animationSpeed
      const randomDuration = baseDuration + Math.random() * 300

      return Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: randomDuration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: randomDuration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      )
    })

    // Start all animations with staggered delay
    animations.forEach((animation, index) => {
      setTimeout(() => {
        animation.start()
      }, index * 60) // 60ms stagger for smooth wave effect
    })

    // Cleanup
    return () => {
      animations.forEach((animation) => animation.stop())
    }
  }, [isRecording, animatedValues, animationSpeed, barCount])

  return (
    <SoundWaveContainer>
      {animatedValues.map((animatedValue, index) => {
        // Get height range for this bar (cycle through if more bars than heights)
        const heightRange = waveHeights[index % waveHeights.length]

        // Interpolate between min and max height
        let height = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [heightRange.min, heightRange.max],
        })

        // If responsive mode, multiply by volume
        if (responsive) {
          height = Animated.multiply(
            height,
            volumeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1], // Min 30% height, max 100%
            })
          )
        }

        // Calculate opacity based on position (center bars brighter)
        const centerPosition = Math.abs(index - barCount / 2) / (barCount / 2)
        const baseOpacity = 1 - centerPosition * 0.3 // Center: 1, edges: 0.7

        return (
          <SoundWaveBar
            key={index}
            style={{
              height,
              opacity: isRecording ? baseOpacity : 0.3,
            }}
          />
        )
      })}
    </SoundWaveContainer>
  )
}

// Helper hook for getting audio volume (optional, for responsive mode)
// You can use this with expo-av Audio.Recording.setOnRecordingStatusUpdate
export const useAudioVolume = (recording) => {
  const [volume, setVolume] = useState(0.5)

  useEffect(() => {
    if (!recording) return

    // Set up recording status listener
    const subscription = recording.setOnRecordingStatusUpdate((status) => {
      if (status.metering !== undefined) {
        // metering is typically in dB, normalize to 0-1
        // This is a rough conversion, adjust based on your needs
        const normalized = Math.min(
          1,
          Math.max(0, (status.metering + 160) / 160)
        )
        setVolume(normalized)
      }
    })

    return () => {
      if (subscription) {
        subscription.remove()
      }
    }
  }, [recording])

  return volume
}
