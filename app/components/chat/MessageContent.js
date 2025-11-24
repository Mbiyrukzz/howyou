import { AudioPlayer } from '../media/AudioPlayer'
import { FileAttachment } from '../media/FileAttachment'
import { ImageAttachment } from '../media/ImageAttachment'
import { VideoAttachment } from '../media/VideoAttachment'

export const MessageContent = ({
  message,
  isOwn,
  onImagePress,
  navigation,
}) => {
  if (!message.files || message.files.length === 0) return null

  return message.files
    .map((file, index) => {
      // Audio
      if (message.type === 'audio' || file.type === 'audio') {
        return (
          <AudioPlayer
            key={`audio-${index}`}
            audioUrl={file.url}
            isOwn={isOwn}
          />
        )
      }

      // Video
      if (message.type === 'video' && file.url) {
        return (
          <VideoAttachment
            key={`video-${index}`}
            videoUrl={file.url}
            hasText={!!(message.content && message.content.trim())}
            onPress={() =>
              navigation.navigate('VideoPlayer', { videoUrl: file.url })
            }
          />
        )
      }

      // Image
      if (message.type === 'image' && file.url) {
        return (
          <ImageAttachment
            key={`image-${index}`}
            imageUrl={file.url}
            hasText={!!(message.content && message.content.trim())}
            onPress={onImagePress}
          />
        )
      }

      // File
      if (message.type === 'file' && file.url) {
        return (
          <FileAttachment
            key={`file-${index}`}
            fileName={file.originalname || `File ${index + 1}`}
            isOwn={isOwn}
          />
        )
      }

      return null
    })
    .filter(Boolean)
}
