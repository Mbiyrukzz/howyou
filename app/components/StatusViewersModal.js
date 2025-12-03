import React, { useEffect, useState } from 'react'
import {
  View,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import { useStatusViews } from '../hooks/useStatusViews'

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.6);
  justify-content: flex-end;
`

const ModalContent = styled.View`
  background-color: #fff;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  max-height: 70%;
  shadow-color: #000;
  shadow-offset: 0px -4px;
  shadow-opacity: 0.15;
  shadow-radius: 8px;
  elevation: 10;
`

const ModalHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
`

const ModalTitle = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
`

const ViewCount = styled.Text`
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
`

const CloseButton = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: #f8f9fa;
  justify-content: center;
  align-items: center;
`

const ViewerItem = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 16px 20px;
  border-bottom-width: 1px;
  border-bottom-color: #f8f9fa;
`

const ViewerAvatar = styled.View`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${(props) => props.color || '#3b82f6'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const ViewerAvatarText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: bold;
`

const ViewerInfo = styled.View`
  flex: 1;
`

const ViewerName = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 2px;
`

const ViewTime = styled.Text`
  font-size: 13px;
  color: #95a5a6;
`

const EmptyContainer = styled.View`
  padding: 40px 20px;
  align-items: center;
`

const EmptyText = styled.Text`
  font-size: 16px;
  color: #95a5a6;
  text-align: center;
  margin-top: 12px;
`

const LoadingContainer = styled.View`
  padding: 40px 20px;
  align-items: center;
`

const getInitials = (name) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

const formatViewTime = (date) => {
  const now = new Date()
  const viewDate = new Date(date)
  const diff = now - viewDate
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

export const StatusViewersModal = ({ visible, statusId, onClose }) => {
  const { getStatusViewers, getViewsForStatus, isLoadingViews } =
    useStatusViews()
  const [viewers, setViewers] = useState([])

  useEffect(() => {
    if (visible && statusId) {
      loadViewers()
    }
  }, [visible, statusId])

  const loadViewers = async () => {
    const views = await getStatusViewers(statusId)
    setViewers(views)
  }

  const renderViewer = ({ item }) => (
    <ViewerItem>
      <ViewerAvatar color={item.userAvatarColor || '#3b82f6'}>
        <ViewerAvatarText>{getInitials(item.userName)}</ViewerAvatarText>
      </ViewerAvatar>
      <ViewerInfo>
        <ViewerName>{item.userName}</ViewerName>
        <ViewTime>{formatViewTime(item.viewedAt)}</ViewTime>
      </ViewerInfo>
    </ViewerItem>
  )

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <ModalOverlay>
          <TouchableWithoutFeedback>
            <ModalContent>
              <ModalHeader>
                <View>
                  <ModalTitle>Viewers</ModalTitle>
                  {viewers.length > 0 && (
                    <ViewCount>{viewers.length} views</ViewCount>
                  )}
                </View>
                <CloseButton onPress={onClose}>
                  <Ionicons name="close" size={20} color="#7f8c8d" />
                </CloseButton>
              </ModalHeader>

              {isLoadingViews(statusId) ? (
                <LoadingContainer>
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <EmptyText>Loading viewers...</EmptyText>
                </LoadingContainer>
              ) : viewers.length === 0 ? (
                <EmptyContainer>
                  <Ionicons name="eye-off-outline" size={48} color="#e9ecef" />
                  <EmptyText>No views yet</EmptyText>
                </EmptyContainer>
              ) : (
                <FlatList
                  data={viewers}
                  renderItem={renderViewer}
                  keyExtractor={(item) => item.userId}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              )}
            </ModalContent>
          </TouchableWithoutFeedback>
        </ModalOverlay>
      </TouchableWithoutFeedback>
    </Modal>
  )
}
