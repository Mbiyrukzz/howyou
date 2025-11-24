import styled from 'styled-components/native'
import { Animated, Dimensions, Platform } from 'react-native'

const { width: screenWidth } = Dimensions.get('window')

// =================== Sound Wave ===================
export const SoundWaveContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 40px;
  margin-bottom: 16px;
`

export const SoundWaveBar = styled(Animated.View)`
  width: 4px;
  background-color: #e74c3c;
  border-radius: 2px;
  margin: 0 2px;
`

// =================== Container ===================
export const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`

// =================== Header ===================
export const Header = styled.View`
  background-color: #fff;
  padding: 50px 16px 16px 16px;
  flex-direction: row;
  align-items: center;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 5;
`

export const BackButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

export const HeaderAvatar = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${(props) => props.color || '#3498db'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

export const HeaderAvatarText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: bold;
`

export const HeaderInfo = styled.View`
  flex: 1;
`

export const HeaderName = styled.Text`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
`

export const HeaderStatus = styled.Text`
  font-size: 14px;
  color: #27ae60;
  margin-top: 2px;
`

export const HeaderActions = styled.View`
  flex-direction: row;
`

export const HeaderActionButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  justify-content: center;
  align-items: center;
  margin-left: 8px;
  background-color: ${(props) => props.bgColor || 'transparent'};
`

// =================== Messages ===================
export const MessagesContainer = styled.View`
  flex: 1;
  padding: 16px;
`

export const MessageBubble = styled.View`
  max-width: ${screenWidth * 0.75}px;
  margin-vertical: 4px;
  padding: 12px 16px;
  border-radius: 20px;
  align-self: ${(props) => (props.isOwn ? 'flex-end' : 'flex-start')};
  background-color: ${(props) => (props.isOwn ? '#3498db' : '#fff')};
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
`

export const MessageText = styled.Text`
  font-size: 16px;
  line-height: 20px;
  color: ${(props) => (props.isOwn ? '#fff' : '#2c3e50')};
`

export const MessageTime = styled.Text`
  font-size: 12px;
  color: ${(props) => (props.isOwn ? 'rgba(255, 255, 255, 0.8)' : '#95a5a6')};
  margin-top: 4px;
  align-self: ${(props) => (props.isOwn ? 'flex-end' : 'flex-start')};
`

// =================== Date Separator ===================
export const DateSeparator = styled.View`
  align-items: center;
  margin: 20px 0;
`

export const DateText = styled.Text`
  background-color: #e9ecef;
  color: #7f8c8d;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 16px;
  overflow: hidden;
`

// =================== Images ===================
export const MessageImage = styled.Image`
  width: ${screenWidth * 0.6}px;
  height: 200px;
  border-radius: 10px;
  margin-top: ${(props) => (props.hasText ? '8px' : '0px')};
  background-color: #f0f0f0;
`

export const MessageImageContainer = styled.TouchableOpacity`
  position: relative;
`

export const ImageLoadingOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  justify-content: center;
  align-items: center;
  border-radius: 10px;
`

export const LoadingText = styled.Text`
  color: white;
  font-size: 12px;
  margin-top: 4px;
`

// =================== Video ===================
export const MessageVideoContainer = styled.TouchableOpacity`
  width: ${screenWidth * 0.6}px;
  height: 200px;
  border-radius: 10px;
  margin-top: ${(props) => (props.hasText ? '8px' : '0px')};
  background-color: #000;
  overflow: hidden;
  position: relative;
`

export const VideoPlayerOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.3);
`

export const VideoPlayButton = styled.TouchableOpacity`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: rgba(255, 255, 255, 0.9);
  justify-content: center;
  align-items: center;
`

// =================== Files ===================
export const MessageFile = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  margin-top: 8px;
  background-color: ${(props) =>
    props.isOwn ? 'rgba(255, 255, 255, 0.2)' : '#f0f0f0'};
  padding: 10px;
  border-radius: 8px;
`

export const FileIcon = styled.View``

export const FileText = styled.Text`
  font-size: 14px;
  color: ${(props) => (props.isOwn ? '#fff' : '#2c3e50')};
  flex: 1;
`

// =================== Audio Player ===================
export const MessageAudioPlayer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 8px;
  background-color: ${(props) =>
    props.isOwn ? 'rgba(255, 255, 255, 0.15)' : '#f0f0f0'};
  padding: 12px;
  border-radius: 20px;
  min-width: 220px;
`

export const PlayButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${(props) =>
    props.isOwn ? 'rgba(255, 255, 255, 0.3)' : '#3498db'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

export const AudioWaveform = styled.View`
  flex: 1;
  height: 30px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-right: 12px;
`

export const WaveBar = styled.View`
  width: 3px;
  background-color: ${(props) =>
    props.isOwn ? 'rgba(255, 255, 255, 0.6)' : '#3498db'};
  border-radius: 2px;
  height: ${(props) => props.height || 10}px;
`

export const AudioInfo = styled.View`
  justify-content: center;
`

export const AudioDuration = styled.Text`
  font-size: 13px;
  font-weight: 600;
  color: ${(props) => (props.isOwn ? '#fff' : '#2c3e50')};
`

// =================== Input ===================
export const InputContainer = styled.View`
  background-color: #fff;
  padding: 16px;
  flex-direction: row;
  align-items: flex-end;
  border-top-width: 1px;
  border-top-color: #e9ecef;
`

export const InputWrapper = styled.View`
  flex: 1;
  max-height: 100px;
  margin-right: 12px;
  background-color: #f8f9fa;
  border-radius: 25px;
  padding: 12px 16px;
  border-width: 1px;
  border-color: #e9ecef;
`

export const TextInput = styled.TextInput`
  font-size: 16px;
  color: #2c3e50;
  min-height: 20px;
`

export const SendButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${(props) => (props.disabled ? '#bdc3c7' : '#3498db')};
  justify-content: center;
  align-items: center;
`

export const AttachmentButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  justify-content: center;
  align-items: center;
  margin-right: 8px;
  background-color: #f8f9fa;
`

export const CameraButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  justify-content: center;
  align-items: center;
  margin-right: 8px;
  background-color: #f8f9fa;
`

// =================== Loading & Error ===================
export const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`

export const ErrorContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
`

export const ErrorText = styled.Text`
  color: #e74c3c;
  font-size: 16px;
  text-align: center;
  margin-bottom: 16px;
`

export const RetryButton = styled.TouchableOpacity`
  background-color: #3498db;
  padding: 12px 24px;
  border-radius: 8px;
`

export const RetryButtonText = styled.Text`
  color: white;
  font-weight: 600;
`

// =================== Image Preview Modal ===================
export const ImagePreviewModal = styled.Modal``

export const ImagePreviewContainer = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.9);
  justify-content: center;
  align-items: center;
`

export const ImagePreviewHeader = styled.View`
  position: absolute;
  top: ${Platform.OS === 'ios' ? '50px' : '30px'};
  left: 0;
  right: 0;
  flex-direction: row;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 1;
`

export const CloseButton = styled.TouchableOpacity`
  background-color: rgba(255, 255, 255, 0.2);
  padding: 10px;
  border-radius: 20px;
`

export const FullScreenImage = styled.Image`
  width: 100%;
  height: 70%;
`

// =================== Audio Recording ===================
export const AudioRecordingContainer = styled.View`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20px;
  border-top-width: 1px;
  border-top-color: #e9ecef;
  elevation: 10;
  shadow-color: #000;
  shadow-offset: 0px -2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
`

export const RecordingIndicator = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`

export const RecordingDot = styled.View`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: #e74c3c;
  margin-right: 8px;
`

export const RecordingText = styled.Text`
  font-size: 16px;
  color: #2c3e50;
  font-weight: 600;
`

export const RecordingTime = styled.Text`
  font-size: 14px;
  color: #7f8c8d;
  margin-left: 8px;
`

export const RecordingActions = styled.View`
  flex-direction: row;
  justify-content: space-around;
`

export const RecordButton = styled.TouchableOpacity`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: ${(props) => (props.recording ? '#e74c3c' : '#27ae60')};
  justify-content: center;
  align-items: center;
  elevation: 3;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 3px;
`

export const CancelRecordButton = styled.TouchableOpacity`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: #95a5a6;
  justify-content: center;
  align-items: center;
`

export const SendRecordButton = styled.TouchableOpacity`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: #3498db;
  justify-content: center;
  align-items: center;
`

// =================== Selected Files ===================
export const SelectedFilesContainer = styled.View`
  flex-direction: row;
  padding: 8px;
  background-color: #f8f9fa;
  border-top-width: 1px;
  border-top-color: #e9ecef;
  flex-wrap: wrap;
`

export const SelectedFileChip = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #3498db;
  border-radius: 16px;
  padding: 6px 12px;
  margin: 4px;
`

export const SelectedFileText = styled.Text`
  color: white;
  font-size: 12px;
  margin-right: 8px;
  max-width: 100px;
`

export const RemoveFileButton = styled.TouchableOpacity`
  width: 16px;
  height: 16px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.3);
  justify-content: center;
  align-items: center;
`
