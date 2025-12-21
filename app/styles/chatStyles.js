import styled from 'styled-components/native'
import { Animated, Dimensions, Platform } from 'react-native'

const { width: screenWidth } = Dimensions.get('window')

// =================== Container ===================
export const Container = styled.View`
  flex: 1;
  background-color: #f8fafc;
`

// =================== Header (Enhanced) ===================
export const Header = styled.View`
  background-color: #fff;
  padding: 50px 20px 16px 20px;
  flex-direction: row;
  align-items: center;
  border-bottom-width: 1px;
  border-bottom-color: #e2e8f0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 3;
`

export const BackButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: #f1f5f9;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`

export const HeaderAvatar = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: ${(props) => props.color || '#3b82f6'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
  position: relative;
  shadow-color: ${(props) => props.color || '#3b82f6'};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
  elevation: 3;
`

export const HeaderAvatarText = styled.Text`
  color: #fff;
  font-size: 20px;
  font-weight: 700;
`

export const HeaderInfo = styled.View`
  flex: 1;
`

export const HeaderName = styled.Text`
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
`

export const HeaderStatus = styled.Text`
  font-size: 13px;
  color: ${(props) => (props.online ? '#16a34a' : '#64748b')};
  font-weight: 500;
`

export const HeaderActions = styled.View`
  flex-direction: row;
  gap: 8px;
  align-items: center;
`

export const HeaderActionButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${(props) => props.bgColor || '#f1f5f9'};
  justify-content: center;
  align-items: center;
  shadow-color: ${(props) => props.shadowColor || '#000'};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 2;
`

// =================== Messages (Enhanced) ===================
export const MessagesContainer = styled.View`
  flex: 1;
  background-color: #f8fafc;
`

export const MessageBubble = styled.View`
  max-width: ${screenWidth * 0.75}px;
  margin-vertical: 8px;
  margin-horizontal: 16px;
  padding: 14px 16px;
  border-radius: ${(props) =>
    props.isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px'};
  align-self: ${(props) => (props.isOwn ? 'flex-end' : 'flex-start')};
  background-color: ${(props) => (props.isOwn ? '#3b82f6' : '#fff')};
  border-width: ${(props) => (props.isOwn ? '0' : '1px')};
  border-color: #e2e8f0;
  shadow-color: ${(props) => (props.isOwn ? '#3b82f6' : '#000')};
  shadow-offset: 0px 2px;
  shadow-opacity: ${(props) => (props.isOwn ? '0.2' : '0.08')};
  shadow-radius: 8px;
  elevation: 3;
`

export const MessageText = styled.Text`
  font-size: 15px;
  line-height: 22px;
  color: ${(props) => (props.isOwn ? '#fff' : '#1e293b')};
  font-weight: 400;
`

export const MessageTime = styled.Text`
  font-size: 11px;
  color: ${(props) => (props.isOwn ? 'rgba(255, 255, 255, 0.75)' : '#94a3b8')};
  margin-top: 6px;
  font-weight: 600;
  align-self: ${(props) => (props.isOwn ? 'flex-end' : 'flex-start')};
`

// =================== Date Separator (Enhanced) ===================
export const DateSeparator = styled.View`
  align-items: center;
  margin: 20px 0;
`

export const DateText = styled.Text`
  background-color: #fff;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 16px;
  overflow: hidden;
  border-width: 1px;
  border-color: #e2e8f0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`

// =================== Images (Enhanced) ===================
export const MessageImage = styled.Image`
  width: ${screenWidth * 0.65}px;
  height: 220px;
  border-radius: 12px;
  margin-top: ${(props) => (props.hasText ? '10px' : '0px')};
  background-color: #f1f5f9;
`

export const MessageImageContainer = styled.TouchableOpacity`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 6px;
  elevation: 3;
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
  border-radius: 12px;
`

export const LoadingText = styled.Text`
  color: white;
  font-size: 12px;
  font-weight: 700;
  margin-top: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

// =================== Video (Enhanced) ===================
export const MessageVideoContainer = styled.TouchableOpacity`
  width: ${screenWidth * 0.65}px;
  height: 220px;
  border-radius: 12px;
  margin-top: ${(props) => (props.hasText ? '10px' : '0px')};
  background-color: #000;
  overflow: hidden;
  position: relative;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 6px;
  elevation: 3;
`

export const VideoPlayerOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.4);
`

export const VideoPlayButton = styled.TouchableOpacity`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background-color: rgba(255, 255, 255, 0.95);
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 6;
`

// =================== Files (Enhanced) ===================
export const MessageFile = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  margin-top: 10px;
  background-color: ${(props) =>
    props.isOwn ? 'rgba(255, 255, 255, 0.15)' : '#f8fafc'};
  padding: 14px;
  border-radius: 12px;
  border-width: ${(props) => (props.isOwn ? '0' : '1px')};
  border-color: #e2e8f0;
  min-width: 220px;
  shadow-color: ${(props) => (props.isOwn ? '#3b82f6' : '#000')};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.08;
  shadow-radius: 6px;
  elevation: 2;
`

export const FileIcon = styled.View`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${(props) =>
    props.isOwn ? 'rgba(255, 255, 255, 0.25)' : '#dbeafe'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
  shadow-color: ${(props) => (props.isOwn ? '#fff' : '#3b82f6')};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 4px;
  elevation: 2;
`

export const FileText = styled.Text`
  font-size: 14px;
  font-weight: 700;
  color: ${(props) => (props.isOwn ? '#fff' : '#1e293b')};
  flex: 1;
`

// =================== Audio Player (Enhanced) ===================
export const MessageAudioPlayer = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 10px;
  background-color: ${(props) =>
    props.isOwn ? 'rgba(255, 255, 255, 0.15)' : '#f8fafc'};
  padding: 14px;
  border-radius: 20px;
  min-width: 260px;
  border-width: ${(props) => (props.isOwn ? '0' : '1px')};
  border-color: #e2e8f0;
`

export const PlayButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${(props) =>
    props.isOwn ? 'rgba(255, 255, 255, 0.3)' : '#3b82f6'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
  shadow-color: ${(props) => (props.isOwn ? '#fff' : '#3b82f6')};
  shadow-offset: 0px 3px;
  shadow-opacity: 0.3;
  shadow-radius: 6px;
  elevation: 4;
`

export const AudioWaveform = styled.View`
  flex: 1;
  height: 36px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-right: 12px;
  gap: 3px;
`

export const WaveBar = styled.View`
  width: 3px;
  background-color: ${(props) =>
    props.isPlaying
      ? props.isOwn
        ? '#4ade80'
        : '#10b981'
      : props.isOwn
      ? 'rgba(255, 255, 255, 0.6)'
      : '#3b82f6'};
  border-radius: 2px;
  height: ${(props) => props.height || 12}px;
`

export const AudioInfo = styled.View`
  justify-content: center;
`

export const AudioDuration = styled.Text`
  font-size: 13px;
  font-weight: 700;
  color: ${(props) => (props.isOwn ? '#fff' : '#1e293b')};
`

// =================== Input (Already good, minor tweaks) ===================
export const InputContainer = styled.View`
  background-color: #fff;
  padding: 12px 16px;
  flex-direction: row;
  align-items: flex-end;
  border-top-width: 1px;
  border-top-color: #e2e8f0;
  shadow-color: #000;
  shadow-offset: 0px -2px;
  shadow-opacity: 0.05;
  shadow-radius: 8px;
  elevation: 4;
`

export const InputWrapper = styled.View`
  flex: 1;
  max-height: 100px;
  margin: 0 8px;
  background-color: #f8fafc;
  border-radius: 24px;
  padding: 12px 16px;
  border-width: 1px;
  border-color: #e2e8f0;
`

export const TextInput = styled.TextInput`
  font-size: 15px;
  color: #1e293b;
  min-height: 20px;
`

export const SendButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${(props) => (props.disabled ? '#cbd5e1' : '#3b82f6')};
  justify-content: center;
  align-items: center;
  shadow-color: ${(props) => (props.disabled ? '#000' : '#3b82f6')};
  shadow-offset: 0px 3px;
  shadow-opacity: ${(props) => (props.disabled ? '0.1' : '0.3')};
  shadow-radius: 6px;
  elevation: ${(props) => (props.disabled ? '2' : '4')};
`

export const AttachmentButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  justify-content: center;
  align-items: center;
  background-color: #f1f5f9;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`

export const CameraButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  justify-content: center;
  align-items: center;
  background-color: #f1f5f9;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`

export const MicrophoneButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  justify-content: center;
  align-items: center;
  background-color: #f1f5f9;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`

// =================== Loading & Error ===================
export const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: #f8fafc;
`

export const ErrorContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 40px;
  background-color: transparent;
`

export const ErrorText = styled.Text`
  color: #64748b;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 16px;
`

export const RetryButton = styled.TouchableOpacity`
  background-color: #3b82f6;
  padding: 12px 24px;
  border-radius: 12px;
  shadow-color: #3b82f6;
  shadow-offset: 0px 3px;
  shadow-opacity: 0.3;
  shadow-radius: 6px;
  elevation: 4;
`

export const RetryButtonText = styled.Text`
  color: white;
  font-weight: 700;
  font-size: 15px;
`

// =================== Rest remains the same ===================
export const ImagePreviewModal = styled.Modal``
export const ImagePreviewContainer = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.95);
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
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: rgba(255, 255, 255, 0.2);
  justify-content: center;
  align-items: center;
`
export const FullScreenImage = styled.Image`
  width: 100%;
  height: 70%;
`
export const AudioRecordingContainer = styled.View`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20px;
  border-top-width: 1px;
  border-top-color: #e2e8f0;
  elevation: 10;
  shadow-color: #000;
  shadow-offset: 0px -3px;
  shadow-opacity: 0.1;
  shadow-radius: 8px;
`
export const RecordingIndicator = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`
export const RecordingDot = styled.View`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: #ef4444;
  margin-right: 8px;
`
export const RecordingText = styled.Text`
  font-size: 16px;
  color: #1e293b;
  font-weight: 700;
`
export const RecordingTime = styled.Text`
  font-size: 14px;
  color: #64748b;
  font-weight: 600;
  margin-left: 8px;
`
export const RecordingActions = styled.View`
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
`
export const RecordButton = styled.TouchableOpacity`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background-color: ${(props) => (props.recording ? '#ef4444' : '#10b981')};
  justify-content: center;
  align-items: center;
  shadow-color: ${(props) => (props.recording ? '#ef4444' : '#10b981')};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 6;
`
export const CancelRecordButton = styled.TouchableOpacity`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: #94a3b8;
  justify-content: center;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 4px;
  elevation: 3;
`
export const SendRecordButton = styled.TouchableOpacity`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: #3b82f6;
  justify-content: center;
  align-items: center;
  shadow-color: #3b82f6;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 6px;
  elevation: 4;
`
export const SoundWaveContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 40px;
  margin-bottom: 16px;
`
export const SoundWaveBar = styled(Animated.View)`
  width: 4px;
  background-color: #ef4444;
  border-radius: 2px;
  margin: 0 3px;
`
export const SelectedFilesContainer = styled.View`
  flex-direction: row;
  padding: 8px 16px;
  background-color: #f8fafc;
  border-top-width: 1px;
  border-top-color: #e2e8f0;
  flex-wrap: wrap;
`
export const SelectedFileChip = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #3b82f6;
  border-radius: 16px;
  padding: 8px 12px;
  margin: 4px;
  shadow-color: #3b82f6;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 4px;
  elevation: 2;
`
export const SelectedFileText = styled.Text`
  color: white;
  font-size: 12px;
  font-weight: 600;
  margin-right: 8px;
  max-width: 100px;
`
export const RemoveFileButton = styled.TouchableOpacity`
  width: 18px;
  height: 18px;
  border-radius: 9px;
  background-color: rgba(255, 255, 255, 0.3);
  justify-content: center;
  align-items: center;
`
