import React, { useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components/native'
import { Animated, Easing } from 'react-native'

// Animation keyframes
const pulseAnimation = keyframes`
  0% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.3; transform: scale(1); }
`

const spinAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const waveAnimation = keyframes`
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
`

// Container Components
const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: ${(props) =>
    props.overlay ? 'rgba(26, 26, 46, 0.95)' : '#1a1a2e'};
  position: ${(props) => (props.overlay ? 'absolute' : 'relative')};
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: ${(props) => (props.overlay ? 1000 : 1)};
`

const LoadingCard = styled.View`
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 40px 30px;
  align-items: center;
  backdrop-filter: blur(20px);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.2);
  shadow-color: #000;
  shadow-offset: 0px 10px;
  shadow-opacity: 0.3;
  shadow-radius: 20px;
  elevation: 15;
`

const InlineContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: ${(props) => props.padding || '0px'};
`

// Spinner Components
const SpinnerContainer = styled.View`
  position: relative;
  width: ${(props) => props.size || 60}px;
  height: ${(props) => props.size || 60}px;
  margin-bottom: ${(props) => (props.showText ? '20px' : '0px')};
`

const SpinnerRing = styled.View`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: ${(props) => (props.size || 60) / 2}px;
  border-width: 4px;
  border-color: transparent;
  border-top-color: #0046ff;
  border-right-color: rgba(102, 126, 234, 0.3);
`

const AnimatedSpinnerRing = styled(Animated.View)`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: ${(props) => (props.size || 60) / 2}px;
  border-width: 4px;
  border-color: transparent;
  border-top-color: #0046ff;
  border-right-color: rgba(102, 126, 234, 0.3);
`

// Dots Components
const DotsContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${(props) => (props.showText ? '20px' : '0px')};
`

const Dot = styled(Animated.View)`
  width: ${(props) => props.size || 12}px;
  height: ${(props) => props.size || 12}px;
  border-radius: ${(props) => (props.size || 12) / 2}px;
  background-color: #0046ff;
  margin: 0 4px;
`

// Pulse Components
const PulseContainer = styled.View`
  align-items: center;
  margin-bottom: ${(props) => (props.showText ? '20px' : '0px')};
`

const PulseCircle = styled(Animated.View)`
  width: ${(props) => props.size || 60}px;
  height: ${(props) => props.size || 60}px;
  border-radius: ${(props) => (props.size || 60) / 2}px;
  background-color: #0046ff;
`

const PulseRing = styled(Animated.View)`
  position: absolute;
  width: ${(props) => props.size || 60}px;
  height: ${(props) => props.size || 60}px;
  border-radius: ${(props) => (props.size || 60) / 2}px;
  border-width: 2px;
  border-color: rgba(102, 126, 234, 0.5);
`

// Wave Components
const WaveContainer = styled.View`
  flex-direction: row;
  align-items: flex-end;
  height: 40px;
  margin-bottom: ${(props) => (props.showText ? '20px' : '0px')};
`

const WaveBar = styled(Animated.View)`
  width: 4px;
  background-color: #0046ff;
  margin: 0 2px;
  border-radius: 2px;
`

// Text Components
const LoadingText = styled.Text`
  color: white;
  font-size: ${(props) =>
    props.size === 'small' ? '14px' : props.size === 'large' ? '18px' : '16px'};
  font-weight: 600;
  text-align: center;
  margin-top: ${(props) => props.marginTop || '0px'};
`

const LoadingSubtext = styled.Text`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 400;
  text-align: center;
  margin-top: 8px;
  line-height: 20px;
`

// Loading Components
const SpinnerLoader = ({ size, showText, text }) => {
  const spinValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    )
    spinAnimation.start()
    return () => spinAnimation.stop()
  }, [])

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <>
      <SpinnerContainer size={size} showText={showText}>
        <AnimatedSpinnerRing
          size={size}
          style={{ transform: [{ rotate: spin }] }}
        />
      </SpinnerContainer>
      {showText && <LoadingText>{text}</LoadingText>}
    </>
  )
}

const DotsLoader = ({ size, showText, text }) => {
  const dot1 = useRef(new Animated.Value(0)).current
  const dot2 = useRef(new Animated.Value(0)).current
  const dot3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const createDotAnimation = (dot, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      )
    }

    const animation1 = createDotAnimation(dot1, 0)
    const animation2 = createDotAnimation(dot2, 200)
    const animation3 = createDotAnimation(dot3, 400)

    animation1.start()
    animation2.start()
    animation3.start()

    return () => {
      animation1.stop()
      animation2.stop()
      animation3.stop()
    }
  }, [])

  const getDotStyle = (dot) => ({
    opacity: dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        scale: dot.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.3],
        }),
      },
    ],
  })

  return (
    <>
      <DotsContainer showText={showText}>
        <Dot size={size} style={getDotStyle(dot1)} />
        <Dot size={size} style={getDotStyle(dot2)} />
        <Dot size={size} style={getDotStyle(dot3)} />
      </DotsContainer>
      {showText && <LoadingText>{text}</LoadingText>}
    </>
  )
}

const PulseLoader = ({ size, showText, text }) => {
  const pulseValue = useRef(new Animated.Value(0)).current
  const ringValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    )

    const ringAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(ringValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(ringValue, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    )

    pulseAnimation.start()
    ringAnimation.start()

    return () => {
      pulseAnimation.stop()
      ringAnimation.stop()
    }
  }, [])

  const pulseStyle = {
    opacity: pulseValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 1],
    }),
    transform: [
      {
        scale: pulseValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.1],
        }),
      },
    ],
  }

  const ringStyle = {
    opacity: ringValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.7, 0],
    }),
    transform: [
      {
        scale: ringValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 2],
        }),
      },
    ],
  }

  return (
    <>
      <PulseContainer showText={showText}>
        <PulseRing size={size} style={ringStyle} />
        <PulseCircle size={size} style={pulseStyle} />
      </PulseContainer>
      {showText && <LoadingText>{text}</LoadingText>}
    </>
  )
}

const WaveLoader = ({ showText, text }) => {
  const wave1 = useRef(new Animated.Value(20)).current
  const wave2 = useRef(new Animated.Value(20)).current
  const wave3 = useRef(new Animated.Value(20)).current
  const wave4 = useRef(new Animated.Value(20)).current

  useEffect(() => {
    const createWaveAnimation = (wave, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(wave, {
            toValue: 5,
            duration: 400,
            useNativeDriver: false,
          }),
          Animated.timing(wave, {
            toValue: 20,
            duration: 400,
            useNativeDriver: false,
          }),
        ])
      )
    }

    const animation1 = createWaveAnimation(wave1, 0)
    const animation2 = createWaveAnimation(wave2, 100)
    const animation3 = createWaveAnimation(wave3, 200)
    const animation4 = createWaveAnimation(wave4, 300)

    animation1.start()
    animation2.start()
    animation3.start()
    animation4.start()

    return () => {
      animation1.stop()
      animation2.stop()
      animation3.stop()
      animation4.stop()
    }
  }, [])

  return (
    <>
      <WaveContainer showText={showText}>
        <WaveBar style={{ height: wave1 }} />
        <WaveBar style={{ height: wave2 }} />
        <WaveBar style={{ height: wave3 }} />
        <WaveBar style={{ height: wave4 }} />
      </WaveContainer>
      {showText && <LoadingText>{text}</LoadingText>}
    </>
  )
}

// Main LoadingIndicator Component
const LoadingIndicator = ({
  type = 'spinner',
  size = 'medium',
  overlay = false,
  showCard = false,
  text = 'Loading...',
  subtext = '',
  showText = false,
  inline = false,
  padding = '20px',
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return 30
      case 'large':
        return 80
      default:
        return 60
    }
  }

  const renderLoader = () => {
    const loaderSize = getSize()

    switch (type) {
      case 'dots':
        return (
          <DotsLoader size={loaderSize / 5} showText={showText} text={text} />
        )
      case 'pulse':
        return <PulseLoader size={loaderSize} showText={showText} text={text} />
      case 'wave':
        return <WaveLoader showText={showText} text={text} />
      default:
        return (
          <SpinnerLoader size={loaderSize} showText={showText} text={text} />
        )
    }
  }

  if (inline) {
    return <InlineContainer padding={padding}>{renderLoader()}</InlineContainer>
  }

  return (
    <LoadingContainer overlay={overlay}>
      {showCard ? (
        <LoadingCard>
          {renderLoader()}
          {subtext && <LoadingSubtext>{subtext}</LoadingSubtext>}
        </LoadingCard>
      ) : (
        <>
          {renderLoader()}
          {subtext && <LoadingSubtext>{subtext}</LoadingSubtext>}
        </>
      )}
    </LoadingContainer>
  )
}

// Export all components
export default LoadingIndicator

// export const LoadingExamples = () => {
//   return (
//     <LoadingContainer>
//       <LoadingText size="large" marginTop="20px">Loading Indicator Examples</LoadingText>

//       {/* Full Screen Spinner */}
//       <LoadingIndicator
//         type="spinner"
//         size="large"
//         showText={true}
//         text="Loading your messages..."
//         showCard={true}
//         subtext="Please wait while we sync your conversations"
//       />

//       {/* Inline Examples */}
//       <InlineContainer padding="20px">
//         <LoadingIndicator type="dots" size="small" inline={true} />
//         <LoadingText marginTop="10px">Sending message...</LoadingText>
//       </InlineContainer>

//       {/* Different Types */}
//       <LoadingIndicator type="pulse" size="medium" showText={true} text="Connecting..." />
//       <LoadingIndicator type="wave" showText={true} text="Processing..." />
//     </LoadingContainer>
//   )
// }
