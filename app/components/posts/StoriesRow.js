import React from 'react'
import styled from 'styled-components/native'
import { FlatList, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getInitials } from '../../utils/posts'
import { useStatusViews } from '../../hooks/useStatusViews'

const StoriesContainer = styled.View`
  height: 110px;
  margin-bottom: 8px;
  padding: 0 20px;
`

const StoryItem = styled.TouchableOpacity`
  align-items: center;
  margin-right: 16px;
  width: 70px;
`

const StoryAvatarContainer = styled.View`
  position: relative;
  margin-bottom: 6px;
`

const StoryAvatar = styled.View`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background-color: ${(props) => props.color || '#3b82f6'};
  justify-content: center;
  align-items: center;
  border-width: ${(props) => (props.hasStory ? '3px' : '2px')};
  border-color: ${(props) => {
    if (props.isViewed) return '#94a3b8'
    if (props.hasStory) return '#0f4ce8'
    return '#e2e8f0'
  }};
`

const StoryImageContainer = styled.View`
  width: 58px;
  height: 58px;
  border-radius: 29px;
  overflow: hidden;
  background-color: #f1f5f9;
`

const AddStoryButton = styled.View`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: #3b82f6;
  justify-content: center;
  align-items: center;
  border-width: 3px;
  border-color: #fff;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.2;
  shadow-radius: 2px;
  elevation: 3;
`

const StoryAvatarText = styled.Text`
  color: #fff;
  font-size: 20px;
  font-weight: 700;
`

const StoryName = styled.Text`
  font-size: 12px;
  color: ${(props) => (props.isYou ? '#3b82f6' : '#64748b')};
  font-weight: ${(props) => (props.isYou ? '700' : '500')};
  text-align: center;
`

const StatusBadge = styled.View`
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #dc2626;
  border-radius: 10px;
  min-width: 20px;
  height: 20px;
  justify-content: center;
  align-items: center;
  padding: 0 6px;
  border-width: 2px;
  border-color: #fff;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.2;
  shadow-radius: 2px;
  elevation: 3;
`

const StatusBadgeText = styled.Text`
  color: #fff;
  font-size: 11px;
  font-weight: 700;
`

export const StoriesRow = ({ stories, onStoryPress, onAddStatus }) => {
  return (
    <StoriesContainer>
      <FlatList
        data={stories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <StoryItem onPress={() => onStoryPress(item)}>
            <StoryAvatarContainer>
              {item.fileUrl ? (
                <StoryAvatar
                  hasStory={item.statusCount > 0}
                  color={item.userAvatarColor}
                >
                  <StoryImageContainer>
                    <Image
                      source={{ uri: item.fileUrl }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </StoryImageContainer>
                </StoryAvatar>
              ) : (
                <StoryAvatar
                  hasStory={item.statusCount > 0}
                  color={item.userAvatarColor}
                >
                  <StoryAvatarText>
                    {getInitials(item.userName || item.name)}
                  </StoryAvatarText>
                </StoryAvatar>
              )}

              {item._id === 'your-story' && (
                <AddStoryButton>
                  <Ionicons name="add" size={14} color="#fff" />
                </AddStoryButton>
              )}

              {item.statusCount > 1 && (
                <StatusBadge>
                  <StatusBadgeText>{item.statusCount}</StatusBadgeText>
                </StatusBadge>
              )}
            </StoryAvatarContainer>

            <StoryName isYou={item._id === 'your-story'}>
              {item._id === 'your-story'
                ? 'Your Story'
                : item.userName || item.name}
            </StoryName>
          </StoryItem>
        )}
      />
    </StoriesContainer>
  )
}
