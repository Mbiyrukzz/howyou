import React, { useEffect, useRef } from 'react'
import styled from 'styled-components/native'
import { Animated, Easing, View } from 'react-native'

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: ${(props) =>
    props.overlay ? 'rgba(0, 0, 0, 0.5)' : 'transparent'};
`

const DotsContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
`

const Dot = styled(Animated.View)`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: #3396d3;
  margin: 0 6px;
`

const LoadingText = styled.Text`
  color: ${(props) => props.color || '#64748b'};
  font-size: 16px;
  font-weight: 600;
  margin-top: 20px;
  text-align: center;
`

const LoadingIndicator = ({
  text = '',
  overlay = false,
  color = '#3396d3',
}) => {
  const dot1 = useRef(new Animated.Value(0)).current
  const dot2 = useRef(new Animated.Value(0)).current
  const dot3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const createAnimation = (animatedValue, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      )
    }

    const anim1 = createAnimation(dot1, 0)
    const anim2 = createAnimation(dot2, 150)
    const anim3 = createAnimation(dot3, 300)

    anim1.start()
    anim2.start()
    anim3.start()

    return () => {
      anim1.stop()
      anim2.stop()
      anim3.stop()
    }
  }, [])

  const animateStyle = (animatedValue) => ({
    opacity: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2],
        }),
      },
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
    ],
  })

  return (
    <LoadingContainer overlay={overlay}>
      <DotsContainer>
        <Dot style={animateStyle(dot1)} />
        <Dot style={animateStyle(dot2)} />
        <Dot style={animateStyle(dot3)} />
      </DotsContainer>
      {text ? <LoadingText color={color}>{text}</LoadingText> : null}
    </LoadingContainer>
  )
}

export default LoadingIndicator
