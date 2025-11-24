import React, { useState, useEffect } from 'react'
import { Animated } from 'react-native'
import { SoundWaveContainer, SoundWaveBar } from '../../styles/chatStyles'

export const SoundWaveAnimation = () => {
  const [animations] = useState(() =>
    Array.from({ length: 20 }, () => new Animated.Value(0.3))
  )

  useEffect(() => {
    const animateBars = () => {
      const animationArray = animations.map((anim, index) => {
        return Animated.sequence([
          Animated.delay(index * 50),
          Animated.loop(
            Animated.sequence([
              Animated.timing(anim, {
                toValue: Math.random() * 0.7 + 0.3,
                duration: 300 + Math.random() * 200,
                useNativeDriver: false,
              }),
              Animated.timing(anim, {
                toValue: 0.3,
                duration: 300 + Math.random() * 200,
                useNativeDriver: false,
              }),
            ])
          ),
        ])
      })

      Animated.parallel(animationArray).start()
    }

    animateBars()
  }, [animations])

  return (
    <SoundWaveContainer>
      {animations.map((anim, index) => (
        <SoundWaveBar
          key={index}
          style={{
            height: anim.interpolate({
              inputRange: [0.3, 1],
              outputRange: [10, 40],
            }),
          }}
        />
      ))}
    </SoundWaveContainer>
  )
}
