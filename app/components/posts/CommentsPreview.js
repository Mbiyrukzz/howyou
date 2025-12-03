import React from 'react'
import styled from 'styled-components/native'
import { useComments } from '../../hooks/useComments'

const Container = styled.View`
  padding: 12px 16px;
  border-top-width: 1px;
  border-top-color: #f1f5f9;
  background-color: #fafbfc;
`

const CommentPreviewItem = styled.View`
  margin-bottom: 8px;
`

const CommentPreviewText = styled.Text`
  font-size: 13px;
  color: #1e293b;
  line-height: 18px;
`

const CommentUsername = styled.Text`
  font-weight: 700;
  color: #3b82f6;
`

const ViewAllButton = styled.TouchableOpacity`
  padding: 8px 0;
  align-items: center;
`

const ViewAllText = styled.Text`
  font-size: 13px;
  font-weight: 700;
  color: #3b82f6;
`

export const CommentsPreview = ({ postId, onViewAll }) => {
  const { getCommentsForPost } = useComments()
  const comments = getCommentsForPost(postId) || []

  if (comments.length === 0) return null

  const previewComments = comments.slice(0, 2)
  const hasMore = comments.length > 2

  return (
    <Container>
      {previewComments.map((comment) => (
        <CommentPreviewItem key={comment._id}>
          <CommentPreviewText>
            <CommentUsername>{comment.username}</CommentUsername>{' '}
            {comment.content}
          </CommentPreviewText>
        </CommentPreviewItem>
      ))}

      {hasMore && (
        <ViewAllButton onPress={onViewAll}>
          <ViewAllText>View all {comments.length} comments</ViewAllText>
        </ViewAllButton>
      )}
    </Container>
  )
}
