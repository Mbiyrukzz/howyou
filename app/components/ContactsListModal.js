import React, { useState, useEffect } from 'react'
import {
  Modal,
  FlatList,
  TouchableOpacity,
  View,
  Text,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import { useUser } from '../hooks/useUser'

const API_URL = process.env.EXPO_PUBLIC_API_URL

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`

const ModalContent = styled.View`
  background-color: #fff;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 80%;
  padding: 24px;
`

const ModalHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`

const ModalTitle = styled.Text`
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
`

const CloseButton = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: #f1f5f9;
  justify-content: center;
  align-items: center;
`

const SearchInput = styled.TextInput`
  background-color: #f8fafc;
  border-radius: 12px;
  padding: 12px 16px 12px 44px;
  font-size: 15px;
  color: #1e293b;
  border-width: 1px;
  border-color: #e2e8f0;
  margin-bottom: 16px;
`

const SearchIcon = styled.View`
  position: absolute;
  left: 38px;
  top: 70px;
  z-index: 1;
`

const ContactItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 8px;
  background-color: ${(props) => (props.selected ? '#eff6ff' : '#fff')};
  border-width: 1px;
  border-color: ${(props) => (props.selected ? '#3b82f6' : '#e2e8f0')};
`

const ContactAvatar = styled.View`
  width: 46px;
  height: 46px;
  border-radius: 23px;
  background-color: #3b82f6;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const ContactAvatarText = styled.Text`
  color: #fff;
  font-size: 18px;
  font-weight: 700;
`

const ContactInfo = styled.View`
  flex: 1;
`

const ContactName = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 2px;
`

const ContactEmail = styled.Text`
  font-size: 13px;
  color: #64748b;
`

const OnlineDot = styled.View`
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: #10b981;
  margin-left: 8px;
`

const EmptyState = styled.View`
  padding: 40px 20px;
  align-items: center;
`

const EmptyText = styled.Text`
  font-size: 14px;
  color: #64748b;
  text-align: center;
  margin-top: 12px;
`

const AddContactButton = styled.TouchableOpacity`
  background-color: #3b82f6;
  padding: 12px 20px;
  border-radius: 12px;
  margin-top: 16px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`

const AddContactText = styled.Text`
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  margin-left: 8px;
`

const CreateButton = styled.TouchableOpacity`
  background-color: #3b82f6;
  padding: 14px;
  border-radius: 12px;
  align-items: center;
  margin-top: 16px;
`

const CreateButtonText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
`

export default function ContactsListModal({
  visible,
  onClose,
  onSelectContact,
  onNavigateToContacts,
  allowMultiple = false,
}) {
  const { user } = useUser()
  const [contacts, setContacts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContacts, setSelectedContacts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible) {
      fetchContacts()
    }
  }, [visible])

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const token = await user?.getIdToken()
      const response = await fetch(`${API_URL}/contacts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setContacts(data.contacts)
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectContact = (contact) => {
    if (allowMultiple) {
      const isSelected = selectedContacts.some(
        (c) => c.contactUserId === contact.contactUserId
      )
      if (isSelected) {
        setSelectedContacts(
          selectedContacts.filter(
            (c) => c.contactUserId !== contact.contactUserId
          )
        )
      } else {
        setSelectedContacts([...selectedContacts, contact])
      }
    } else {
      onSelectContact(contact)
      onClose()
    }
  }

  const handleCreateGroupChat = () => {
    if (selectedContacts.length < 2) {
      alert('Please select at least 2 contacts for a group chat')
      return
    }
    onSelectContact(selectedContacts)
    onClose()
    setSelectedContacts([])
  }

  const filteredContacts = contacts.filter((contact) =>
    contact.userDetails?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderContact = ({ item }) => {
    const isSelected = selectedContacts.some(
      (c) => c.contactUserId === item.contactUserId
    )

    return (
      <ContactItem
        onPress={() => handleSelectContact(item)}
        selected={isSelected}
      >
        <ContactAvatar>
          <ContactAvatarText>
            {item.userDetails?.name?.[0]?.toUpperCase() || '?'}
          </ContactAvatarText>
        </ContactAvatar>

        <ContactInfo>
          <ContactName>
            {item.userDetails?.name || item.contactName}
          </ContactName>
          <ContactEmail>{item.userDetails?.email || 'No email'}</ContactEmail>
        </ContactInfo>

        {item.userDetails?.online && <OnlineDot />}

        {allowMultiple && isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
        )}
      </ContactItem>
    )
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <ModalOverlay>
          <TouchableWithoutFeedback>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>
                  {allowMultiple ? 'Select Contacts' : 'Choose Contact'}
                </ModalTitle>
                <CloseButton onPress={onClose}>
                  <Ionicons name="close" size={20} color="#64748b" />
                </CloseButton>
              </ModalHeader>

              <SearchIcon>
                <Ionicons name="search" size={20} color="#64748b" />
              </SearchIcon>
              <SearchInput
                placeholder="Search contacts..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#94a3b8"
              />

              {loading ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#3b82f6" />
                </View>
              ) : filteredContacts.length === 0 ? (
                <EmptyState>
                  <Ionicons name="people-outline" size={50} color="#94a3b8" />
                  <EmptyText>
                    {searchQuery
                      ? 'No contacts found'
                      : 'No contacts yet.\nAdd contacts to start chatting!'}
                  </EmptyText>
                  {!searchQuery && (
                    <AddContactButton onPress={onNavigateToContacts}>
                      <Ionicons name="person-add" size={16} color="#fff" />
                      <AddContactText>Add Contacts</AddContactText>
                    </AddContactButton>
                  )}
                </EmptyState>
              ) : (
                <>
                  <FlatList
                    data={filteredContacts}
                    keyExtractor={(item) => item._id.toString()}
                    renderItem={renderContact}
                    style={{ maxHeight: 400 }}
                  />

                  {allowMultiple && selectedContacts.length > 0 && (
                    <CreateButton onPress={handleCreateGroupChat}>
                      <CreateButtonText>
                        Create Group ({selectedContacts.length})
                      </CreateButtonText>
                    </CreateButton>
                  )}
                </>
              )}
            </ModalContent>
          </TouchableWithoutFeedback>
        </ModalOverlay>
      </TouchableWithoutFeedback>
    </Modal>
  )
}
