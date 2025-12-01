import React, { useEffect, useRef } from 'react'
import styled from 'styled-components/native'
import { Animated, Easing } from 'react-native'

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: ${(props) =>
    props.overlay ? 'rgba(0, 0, 0, 0.6)' : 'transparent'};
`

const LoadingCard = styled.View`
  background-color: #fff;
  border-radius: 20px;
  padding: 32px 40px;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 10px;
  shadow-opacity: 0.15;
  shadow-radius: 20px;
  elevation: 10;
  min-width: ${(props) => (props.compact ? '0px' : '200px')};
`

const DotsContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 40px;
`
const Dot = styled(Animated.View)`
  width: 14px;
  height: 14px;
  border-radius: 7px;
  background-color: ${(props) => props.color || '#3b82f6'};
  margin: 0 7px;
  shadow-color: ${(props) => props.color || '#3b82f6'};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.4;
  shadow-radius: 4px;
  elevation: 3;

  ${(props) =>
    props.size &&
    !isNaN(props.size) &&
    props.size > 0 &&
    `
    width: ${props.size}px;
    height: ${props.size}px;
    border-radius: ${props.size / 2}px;
    margin: 0 ${props.size / 2}px;
  `}
`
const LoadingText = styled.Text`
  color: ${(props) => props.textColor || '#1e293b'};
  font-size: ${(props) => props.fontSize || 16}px;
  font-weight: 700;
  margin-top: 20px;
  text-align: center;
  letter-spacing: 0.3px;
`

const LoadingSubtext = styled.Text`
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  margin-top: 8px;
  text-align: center;
`

const LoadingIndicator = ({
  text = '',
  subtext = '',
  overlay = false,
  color = '#3b82f6',
  textColor,
  size = 14,
  fontSize,
  showCard = true,
  compact = false,
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
            duration: 500,
            easing: Easing.bezier(0.42, 0, 0.58, 1),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 500,
            easing: Easing.bezier(0.42, 0, 0.58, 1),
            useNativeDriver: true,
          }),
        ])
      )
    }

    const anim1 = createAnimation(dot1, 0)
    const anim2 = createAnimation(dot2, 180)
    const anim3 = createAnimation(dot3, 360)

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
          outputRange: [0.7, 1.3],
        }),
      },
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -10],
        }),
      },
    ],
  })

  const content = (
    <>
      <DotsContainer>
        <Dot style={animateStyle(dot1)} color={color} size={size} />
        <Dot style={animateStyle(dot2)} color={color} size={size} />
        <Dot style={animateStyle(dot3)} color={color} size={size} />
      </DotsContainer>
      {text ? (
        <LoadingText textColor={textColor} fontSize={fontSize}>
          {text}
        </LoadingText>
      ) : null}
      {subtext ? <LoadingSubtext>{subtext}</LoadingSubtext> : null}
    </>
  )

  return (
    <LoadingContainer overlay={overlay}>
      {showCard ? (
        <LoadingCard compact={compact}>{content}</LoadingCard>
      ) : (
        content
      )}
    </LoadingContainer>
  )
}

export default LoadingIndicator

// Usage Examples:
//
// Basic:
// <LoadingIndicator text="Loading..." />
//
// With overlay:
// <LoadingIndicator text="Please wait..." overlay={true} />
//
// Custom color:
// <LoadingIndicator text="Sending..." color="#10b981" />
//
// With subtext:
// <LoadingIndicator
//   text="Processing"
//   subtext="This may take a moment"
// />
//
// No card (transparent):
// <LoadingIndicator text="Loading..." showCard={false} />
//
// Compact size:
// <LoadingIndicator text="Loading..." compact={true} size={10} />
