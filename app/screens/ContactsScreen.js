import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  Share,
  ActivityIndicator,
} from 'react-native'
import styled from 'styled-components/native'
import { Ionicons } from '@expo/vector-icons'
import { useUser } from '../hooks/useUser'
import { useContacts } from '../providers/ContactsProvider'

const API_URL = process.env.EXPO_PUBLIC_API_URL

const Container = styled.View`
  flex: 1;
  background-color: #f8fafc;
`

const Header = styled.View`
  background-color: #fff;
  padding: 20px;
  border-bottom-width: 1px;
  border-bottom-color: #e2e8f0;
`

const HeaderTitle = styled.Text`
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
`

const SearchSection = styled.View`
  background-color: #fff;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #e2e8f0;
`

const SearchInput = styled.TextInput`
  background-color: #f8fafc;
  border-radius: 12px;
  padding: 12px 16px 12px 44px;
  font-size: 15px;
  color: #1e293b;
  border-width: 1px;
  border-color: #e2e8f0;
`

const SearchIcon = styled.View`
  position: absolute;
  left: 30px;
  top: 28px;
`

const AddButton = styled.TouchableOpacity`
  background-color: #3b82f6;
  border-radius: 12px;
  padding: 12px 20px;
  margin: 16px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`

const AddButtonText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  margin-left: 8px;
`

const ContactItem = styled.TouchableOpacity`
  background-color: #fff;
  margin: 8px 16px;
  padding: 16px;
  border-radius: 12px;
  flex-direction: row;
  align-items: center;
  border-width: 1px;
  border-color: #e2e8f0;
`

const ContactAvatar = styled.View`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  background-color: ${(props) => props.color || '#3b82f6'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`

const ContactAvatarText = styled.Text`
  color: #fff;
  font-size: 20px;
  font-weight: 700;
`

const ContactInfo = styled.View`
  flex: 1;
`

const ContactName = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
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

const ActionButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${(props) => props.bgColor || '#f1f5f9'};
  justify-content: center;
  align-items: center;
  margin-left: 8px;
`

const FavoriteButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${(props) => props.bgColor || '#fef3c7'};
  justify-content: center;
  align-items: center;
  margin-left: 8px;
`

const EmptyState = styled.View`
  padding: 60px 24px;
  align-items: center;
`

const EmptyText = styled.Text`
  font-size: 16px;
  color: #64748b;
  text-align: center;
  margin-top: 16px;
`

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`

const ModalContent = styled.View`
  background-color: #fff;
  border-radius: 20px;
  width: 85%;
  max-width: 400px;
  padding: 24px;
`

const ModalTitle = styled.Text`
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 20px;
`

const Input = styled.TextInput`
  background-color: #f8fafc;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 15px;
  color: #1e293b;
  border-width: 1px;
  border-color: #e2e8f0;
  margin-bottom: 12px;
`

const ModalButton = styled.TouchableOpacity`
  background-color: ${(props) => props.bgColor || '#3b82f6'};
  border-radius: 12px;
  padding: 14px;
  align-items: center;
  margin-top: 8px;
`

const ModalButtonText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
`

const CancelButton = styled.TouchableOpacity`
  padding: 14px;
  align-items: center;
`

const CancelText = styled.Text`
  color: #64748b;
  font-size: 16px;
  font-weight: 600;
`

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`

const LoadingText = styled.Text`
  margin-top: 12px;
  color: #64748b;
  font-size: 14px;
`

const SectionHeader = styled.View`
  padding: 12px 16px 4px 16px;
  background-color: #f8fafc;
`

const SectionTitle = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const SearchResultsContainer = styled.View`
  background-color: #fff;
  margin: 0 16px 16px 16px;
  border-radius: 12px;
  border-width: 1px;
  border-color: #e2e8f0;
`

const SearchResultItem = styled.TouchableOpacity`
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f1f5f9;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

const SearchResultInfo = styled.View`
  flex: 1;
`

const SearchResultName = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
`

const SearchResultText = styled.Text`
  font-size: 13px;
  color: #64748b;
`

const AlreadyContactBadge = styled.View`
  background-color: #d1fae5;
  padding: 4px 8px;
  border-radius: 6px;
  margin-left: 8px;
`

const AlreadyContactText = styled.Text`
  font-size: 12px;
  color: #065f46;
  font-weight: 500;
`

export default function ContactsScreen({ navigation }) {
  const { user } = useUser()
  const {
    contacts,
    loading,
    isAddingContact,
    isRemovingContact,
    favoriteContacts,
    onlineContacts,
    addContact,
    removeContact,
    searchUsers,
    toggleFavorite,
    loadContacts,
  } = useContacts()

  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [contactName, setContactName] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (searchQuery.length >= 2) {
      handleSearch()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const handleSearch = async () => {
    if (searchQuery.length < 2) return

    setSearching(true)
    try {
      const result = await searchUsers(searchQuery)
      setSearchResults(result.users || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleAddContact = async () => {
    if (!phoneNumber && !email) {
      Alert.alert('Error', 'Please enter phone number or email')
      return
    }

    try {
      const result = await addContact({
        phoneNumber: phoneNumber.trim(),
        email: email.trim().toLowerCase(),
        name: contactName.trim(),
      })

      if (!result.success) {
        if (!result.userExists) {
          // User doesn't exist - offer to send invite
          Alert.alert(
            'User Not Found',
            'This user is not on the app yet. Would you like to invite them?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Send Invite',
                onPress: () => sendInvite(result.inviteData),
              },
            ]
          )
        } else if (result.error === 'Contact already exists') {
          Alert.alert(
            'Already a Contact',
            'This user is already in your contacts.'
          )
        } else if (result.error === 'Cannot add yourself as a contact') {
          Alert.alert(
            'Cannot Add Yourself',
            'You cannot add yourself as a contact.'
          )
        } else {
          Alert.alert('Error', result.error || 'Failed to add contact')
        }
      } else {
        Alert.alert('Success', 'Contact added successfully!')
        setShowAddModal(false)
        resetForm()
        loadContacts() // Refresh the contacts list
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add contact')
    }
  }

  const sendInvite = async (inviteData) => {
    const inviteMessage = `Hey ${inviteData.name}! Join me on our app. Download it here: https://yourapp.com`

    try {
      if (inviteData.phoneNumber) {
        // Send via SMS
        const url = Platform.select({
          ios: `sms:${inviteData.phoneNumber}&body=${encodeURIComponent(
            inviteMessage
          )}`,
          android: `sms:${inviteData.phoneNumber}?body=${encodeURIComponent(
            inviteMessage
          )}`,
        })
        await Linking.openURL(url)
      } else if (inviteData.email) {
        // Send via email
        const url = `mailto:${inviteData.email}?subject=${encodeURIComponent(
          'Join me on our app'
        )}&body=${encodeURIComponent(inviteMessage)}`
        await Linking.openURL(url)
      } else {
        // Use share sheet
        await Share.share({
          message: inviteMessage,
        })
      }
      setShowAddModal(false)
      resetForm()
    } catch (error) {
      console.error('Failed to send invite:', error)
      Alert.alert('Error', 'Failed to send invite')
    }
  }

  const resetForm = () => {
    setPhoneNumber('')
    setEmail('')
    setContactName('')
  }

  const handleRemoveContact = async (contactId) => {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeContact(contactId)
              // State is updated automatically through the provider
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to remove contact')
            }
          },
        },
      ]
    )
  }

  const handleToggleFavorite = async (contactId) => {
    try {
      await toggleFavorite(contactId)
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update favorite')
    }
  }

  const handleStartChat = (contact) => {
    navigation.navigate('ChatScreen', {
      chatId: null,
      otherUserId: contact.contactUserId,
      otherUserName: contact.userDetails?.name || contact.contactName,
      otherUserAvatar: contact.userDetails?.photoURL,
    })
  }

  const filteredContacts = contacts.filter((contact) =>
    (contact.userDetails?.name || contact.contactName)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  )

  const renderContact = ({ item }) => (
    <ContactItem onPress={() => handleStartChat(item)}>
      <ContactAvatar color="#3b82f6">
        <ContactAvatarText>
          {(item.userDetails?.name || item.contactName)?.[0]?.toUpperCase() ||
            '?'}
        </ContactAvatarText>
      </ContactAvatar>

      <ContactInfo>
        <ContactName>
          {item.userDetails?.name || item.contactName}
          {item.favorite && ' ⭐'}
        </ContactName>
        <ContactEmail>{item.userDetails?.email || 'No email'}</ContactEmail>
      </ContactInfo>

      {item.userDetails?.online && <OnlineDot />}

      <FavoriteButton
        bgColor={item.favorite ? '#fde047' : '#fef3c7'}
        onPress={() => handleToggleFavorite(item.contactUserId)}
      >
        <Ionicons
          name={item.favorite ? 'star' : 'star-outline'}
          size={20}
          color={item.favorite ? '#f59e0b' : '#d97706'}
        />
      </FavoriteButton>

      <ActionButton
        bgColor="#fee2e2"
        onPress={() => handleRemoveContact(item.contactUserId)}
        disabled={isRemovingContact}
      >
        {isRemovingContact ? (
          <ActivityIndicator size="small" color="#dc2626" />
        ) : (
          <Ionicons name="trash-outline" size={20} color="#dc2626" />
        )}
      </ActionButton>
    </ContactItem>
  )

  const renderSearchResult = ({ item }) => (
    <SearchResultItem
      onPress={() => {
        if (!item.isContact) {
          setContactName(item.name || '')
          setEmail(item.email || '')
          setPhoneNumber(item.phoneNumber || '')
          setSearchQuery('')
          setSearchResults([])
          setShowAddModal(true)
        }
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <ContactAvatar color="#3b82f6" style={{ width: 40, height: 40 }}>
          <ContactAvatarText style={{ fontSize: 16 }}>
            {item.name?.[0]?.toUpperCase() || '?'}
          </ContactAvatarText>
        </ContactAvatar>

        <SearchResultInfo>
          <SearchResultName>{item.name || 'Unknown User'}</SearchResultName>
          <SearchResultText>
            {item.email || item.phoneNumber || 'No contact info'}
          </SearchResultText>
        </SearchResultInfo>
      </View>

      {item.isContact ? (
        <AlreadyContactBadge>
          <AlreadyContactText>Contact</AlreadyContactText>
        </AlreadyContactBadge>
      ) : (
        <Ionicons name="add-circle-outline" size={24} color="#3b82f6" />
      )}
    </SearchResultItem>
  )

  if (loading) {
    return (
      <LoadingContainer>
        <ActivityIndicator size="large" color="#3b82f6" />
        <LoadingText>Loading contacts...</LoadingText>
      </LoadingContainer>
    )
  }

  return (
    <Container>
      <Header>
        <HeaderTitle>Contacts</HeaderTitle>
      </Header>

      <SearchSection>
        <SearchIcon>
          <Ionicons name="search" size={20} color="#64748b" />
        </SearchIcon>
        <SearchInput
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
      </SearchSection>

      {searchResults.length > 0 && (
        <SearchResultsContainer>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.firebaseUid}
            renderItem={renderSearchResult}
          />
        </SearchResultsContainer>
      )}

      <AddButton onPress={() => setShowAddModal(true)}>
        <Ionicons name="person-add" size={20} color="#fff" />
        <AddButtonText>Add New Contact</AddButtonText>
      </AddButton>

      {contacts.length === 0 ? (
        <EmptyState>
          <Ionicons name="people-outline" size={60} color="#94a3b8" />
          <EmptyText>
            No contacts yet. Add contacts to start chatting!
          </EmptyText>
        </EmptyState>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderContact}
          ListHeaderComponent={() => (
            <>
              {favoriteContacts.length > 0 && (
                <>
                  <SectionHeader>
                    <SectionTitle>
                      ⭐ Favorites ({favoriteContacts.length})
                    </SectionTitle>
                  </SectionHeader>
                  <FlatList
                    data={favoriteContacts}
                    keyExtractor={(item) => item._id.toString()}
                    renderItem={renderContact}
                    scrollEnabled={false}
                  />
                </>
              )}

              {onlineContacts.length > 0 && (
                <>
                  <SectionHeader>
                    <SectionTitle>
                      🟢 Online ({onlineContacts.length})
                    </SectionTitle>
                  </SectionHeader>
                  <FlatList
                    data={onlineContacts}
                    keyExtractor={(item) => item._id.toString()}
                    renderItem={renderContact}
                    scrollEnabled={false}
                  />
                </>
              )}

              <SectionHeader>
                <SectionTitle>
                  All Contacts ({filteredContacts.length})
                </SectionTitle>
              </SectionHeader>
            </>
          )}
        />
      )}

      {showAddModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>Add Contact</ModalTitle>

            <Input
              placeholder="Name (optional)"
              value={contactName}
              onChangeText={setContactName}
              placeholderTextColor="#94a3b8"
            />

            <Input
              placeholder="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholderTextColor="#94a3b8"
            />

            <Text
              style={{
                textAlign: 'center',
                color: '#64748b',
                marginVertical: 8,
              }}
            >
              OR
            </Text>

            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#94a3b8"
            />

            <ModalButton
              onPress={handleAddContact}
              disabled={isAddingContact}
              bgColor={isAddingContact ? '#93c5fd' : '#3b82f6'}
            >
              {isAddingContact ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ModalButtonText>Add Contact</ModalButtonText>
              )}
            </ModalButton>

            <CancelButton
              onPress={() => {
                setShowAddModal(false)
                resetForm()
              }}
              disabled={isAddingContact}
            >
              <CancelText>Cancel</CancelText>
            </CancelButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  )
}
