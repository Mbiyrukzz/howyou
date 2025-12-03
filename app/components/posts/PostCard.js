import React from 'react'
import styled from 'styled-components/native'
import { TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getInitials, formatPostTime } from '../../utils/posts'
import { PostHeader } from './PostHeader'
import { PostActions } from './PostActions'
import { CommentsPreview } from './CommentsPreview'

const PostCardContainer = styled.TouchableOpacity`
  background-color: #fff;
  border-radius: 16px;
  padding: 0;
  margin: 12px 20px;
  border-width: 1px;
  border-color: #e2e8f0;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  elevation: 3;
  position: relative;
  overflow: hidden;
`

const PostImageContainer = styled.View`
  width: 100%;
  height: 250px;
  background-color: #ecf0f1;
  margin: 0;
  overflow: hidden;
`

const PostImage = styled.Image`
  width: 100%;
  height: 100%;
`

const PostContent = styled.Text`
  font-size: 16px;
  line-height: 22px;
  color: #1e293b;
  padding: 16px;
  padding-bottom: ${(props) => (props.hasImage ? '12px' : '16px')};
`

const PostMeta = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 0 16px 16px 16px;
  gap: 12px;
`

const MetaBadge = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #f1f5f9;
  padding: 4px 10px;
  border-radius: 12px;
`

const MetaText = styled.Text`
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-left: 4px;
`

const HighlightedCard = styled(PostCardContainer)`
  background-color: #e3f2fd;
  border-left-width: 4px;
  border-left-color: #3b82f6;
  border-color: #bbdefb;
`

export const PostCard = ({
  post,
  onPress,
  onMenuPress,
  onLikePress,
  onCommentPress,
  onSharePress,
  isSelected = false,
  isOwner = false,
}) => {
  const hasImage = post.files?.[0]
  const CardComponent = isSelected ? HighlightedCard : PostCardContainer

  return (
    <CardComponent onPress={onPress} activeOpacity={0.9}>
      <PostHeader
        avatarColor={post.avatarColor}
        initials={getInitials(post.username)}
        username={post.username}
        timestamp={formatPostTime(post.createdAt)}
        onMenuPress={() => onMenuPress(post)}
        showMenu={isOwner}
      />

      <PostContent hasImage={hasImage}>{post.content}</PostContent>

      {hasImage && (
        <PostImageContainer>
          <PostImage source={{ uri: post.files[0].url }} resizeMode="cover" />
        </PostImageContainer>
      )}

      <PostMeta>
        <MetaBadge>
          <Ionicons name="time-outline" size={12} color="#64748b" />
          <MetaText>{formatPostTime(post.createdAt)}</MetaText>
        </MetaBadge>

        {post.shares > 0 && (
          <MetaBadge>
            <Ionicons name="share-outline" size={12} color="#64748b" />
            <MetaText>{post.shares} shares</MetaText>
          </MetaBadge>
        )}
      </PostMeta>

      <PostActions
        likes={post.likes}
        commentsCount={post.comments?.length || 0}
        shares={post.shares || 0}
        isLiked={post.isLiked}
        onLikePress={() => onLikePress(post._id, post.isLiked)}
        onCommentPress={() => onCommentPress(post)}
        onSharePress={() => onSharePress(post)}
      />

      <CommentsPreview
        postId={post._id}
        onViewAll={() => onCommentPress(post)}
      />
    </CardComponent>
  )
}
