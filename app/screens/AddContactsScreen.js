import React, { useState, useContext } from 'react'
import styled from 'styled-components/native'
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import ContactsContext from '../contexts/ContactsContext'
import { useContacts } from '../providers/ContactsProvider'

const Container = styled.View`
  flex: 1;
  background-color: #f8fafc;
`

const Header = styled.View`
  background-color: #fff;
  padding-top: 50px;
  padding-bottom: 16px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 8px;
  elevation: 4;
`

const HeaderContent = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 0 20px;
`

const BackButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #f1f5f9;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
`

const HeaderTitle = styled.Text`
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
  flex: 1;
`

const ContentContainer = styled.ScrollView`
  flex: 1;
`

const ContentPadding = styled.View`
  padding: 20px;
  padding-bottom: 40px;
`

const SearchCard = styled.View`
  background-color: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 8px;
  elevation: 3;
`

const SearchTitle = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
`

const InputGroup = styled.View`
  margin-bottom: 16px;
`

const InputLabel = styled.Text`
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
`

const InputWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #f8fafc;
  border-radius: 12px;
  padding: 14px 16px;
  border-width: 1px;
  border-color: #e2e8f0;
`

const Input = styled.TextInput`
  flex: 1;
  font-size: 16px;
  color: #1e293b;
  margin-left: 12px;
`

const SearchButton = styled.TouchableOpacity`
  background-color: #3b82f6;
  border-radius: 12px;
  padding: 16px;
  align-items: center;
  flex-direction: row;
  justify-content: center;
  shadow-color: #3b82f6;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 6px;
  elevation: 4;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
`

const SearchButtonText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  margin-left: 8px;
`

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
`

const Divider = styled.View`
  height: 1px;
  background-color: #e2e8f0;
  margin: 32px 0;
`

const UserCard = styled.View`
  background-color: #fff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  flex-direction: row;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 4px;
  elevation: 2;
`

const UserAvatar = styled.View`
  width: 52px;
  height: 52px;
  border-radius: 26px;
  background-color: ${(props) => props.color || '#3b82f6'};
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  position: relative;
`

const UserAvatarText = styled.Text`
  color: #fff;
  font-size: 18px;
  font-weight: 700;
`

const OnlineIndicator = styled.View`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  border-radius: 8px;
  background-color: ${(props) => (props.online ? '#10b981' : '#94a3b8')};
  border-width: 3px;
  border-color: #fff;
`

const UserInfo = styled.View`
  flex: 1;
`

const UserName = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
`

const UserDetail = styled.Text`
  font-size: 13px;
  color: #64748b;
  margin-bottom: 2px;
`

const AddButton = styled.TouchableOpacity`
  background-color: ${(props) => (props.added ? '#f1f5f9' : '#3b82f6')};
  padding: 10px 16px;
  border-radius: 12px;
  flex-direction: row;
  align-items: center;
`

const AddButtonText = styled.Text`
  color: ${(props) => (props.added ? '#64748b' : '#fff')};
  font-size: 14px;
  font-weight: 600;
  margin-left: 6px;
`

const EmptyContainer = styled.View`
  padding: 40px;
  align-items: center;
`

const EmptyIcon = styled.View`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: #f1f5f9;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
`

const EmptyText = styled.Text`
  color: #64748b;
  font-size: 16px;
  text-align: center;
  line-height: 24px;
`

const LoadingContainer = styled.View`
  padding: 40px;
  align-items: center;
`

const InviteCard = styled.View`
  background-color: #fef3c7;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  border-width: 1px;
  border-color: #fbbf24;
`

const InviteText = styled.Text`
  color: #92400e;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
`

const InviteButton = styled.TouchableOpacity`
  background-color: #f59e0b;
  border-radius: 8px;
  padding: 10px;
  align-items: center;
`

const InviteButtonText = styled.Text`
  color: #fff;
  font-size: 14px;
  font-weight: 600;
`

const ResultsContainer = styled.View`
  margin-top: 24px;
`

const getUserColor = (userId) => {
  const colors = [
    '#3b82f6',
    '#f59e0b',
    '#10b981',
    '#8b5cf6',
    '#ef4444',
    '#06b6d4',
    '#84cc16',
    '#f97316',
    '#ec4899',
    '#6366f1',
    '#14b8a6',
  ]
  const index = userId ? userId.toString().charCodeAt(0) % colors.length : 0
  return colors[index]
}

export default function AddContactsScreen() {
  const navigation = useNavigation()
  const contactsContext = useContext(ContactsContext)

  // Separate state for each section
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [contactName, setContactName] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [inviteData, setInviteData] = useState(null)

  const {
    addContact,
    searchUsers,
    sendInvite,
    isAddingContact,
    contacts,
    loadContacts,
  } = useContacts()

  const handleAddContact = async () => {
    if (!email.trim() && !phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter an email or phone number')
      return
    }

    console.log('🔵 Adding contact with:', {
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      name: contactName.trim(),
    })

    setInviteData(null)

    try {
      const result = await addContact({
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        name: contactName.trim() || undefined,
      })

      console.log('🔵 Add contact result:', result)

      if (result.success) {
        Alert.alert('Success', 'Contact added successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setEmail('')
              setPhoneNumber('')
              setContactName('')
              // Reload contacts to refresh the list
              loadContacts?.()
              navigation.goBack()
            },
          },
        ])
      } else if (result.userExists === false) {
        setInviteData(result.inviteData)
      } else if (result.error === 'Contact already exists') {
        Alert.alert('Info', 'This contact is already in your list')
      }
    } catch (error) {
      console.error('❌ Error in handleAddContact:', error)
      Alert.alert('Error', error.message || 'Failed to add contact')
    }
  }

  const handleSearchUsers = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      Alert.alert('Error', 'Please enter at least 2 characters to search')
      return
    }

    setSearching(true)
    setSearchResults([])
    setInviteData(null)

    console.log('🔍 Searching for users with query:', searchQuery.trim())

    try {
      const result = await searchUsers(searchQuery.trim())

      console.log('🔍 Search results:', result)

      if (result.success) {
        setSearchResults(result.users || [])
        if (result.users.length === 0) {
          Alert.alert('No Results', 'No users found matching your search.')
        }
      }
    } catch (error) {
      console.error('❌ Error searching users:', error)
      Alert.alert('Error', 'Failed to search users')
    } finally {
      setSearching(false)
    }
  }

  const handleAddFromSearch = async (user) => {
    console.log('🔵 Adding user from search:', user)

    try {
      const result = await addContact({
        email: user.email || undefined,
        phoneNumber: user.phoneNumber || undefined,
        name: user.name,
      })

      console.log('🔵 Add from search result:', result)

      if (result.success) {
        Alert.alert('Success', 'Contact added successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setSearchResults([])
              setSearchQuery('')
              // Reload contacts to refresh the list
              loadContacts?.()
              navigation.goBack()
            },
          },
        ])
      } else if (result.error === 'Contact already exists') {
        Alert.alert('Info', 'This contact is already in your list')
      }
    } catch (error) {
      console.error('❌ Error adding from search:', error)
      Alert.alert('Error', error.message || 'Failed to add contact')
    }
  }

  const handleSendInvite = async () => {
    if (!inviteData) return

    try {
      const result = await sendInvite(inviteData)
      if (result.success) {
        Alert.alert('Success', result.message, [
          {
            text: 'OK',
            onPress: () => {
              setEmail('')
              setPhoneNumber('')
              setContactName('')
              setInviteData(null)
              navigation.goBack()
            },
          },
        ])
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send invite')
    }
  }

  const isContactAdded = (userId) => {
    return contacts?.some((contact) => contact.contactUserId === userId)
  }

  const renderSearchResult = ({ item }) => (
    <UserCard key={item.firebaseUid}>
      <UserAvatar color={getUserColor(item.firebaseUid)}>
        <UserAvatarText>
          {item.name
            ?.split(' ')
            .map((n) => n.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase() || '?'}
        </UserAvatarText>
        <OnlineIndicator online={item.online} />
      </UserAvatar>
      <UserInfo>
        <UserName>{item.name}</UserName>
        {item.email && <UserDetail>{item.email}</UserDetail>}
        {item.phoneNumber && <UserDetail>{item.phoneNumber}</UserDetail>}
      </UserInfo>
      <AddButton
        added={item.isContact || isContactAdded(item.firebaseUid)}
        onPress={() => handleAddFromSearch(item)}
        disabled={
          item.isContact || isContactAdded(item.firebaseUid) || isAddingContact
        }
      >
        <Ionicons
          name={
            item.isContact || isContactAdded(item.firebaseUid)
              ? 'checkmark-circle'
              : 'person-add'
          }
          size={18}
          color={
            item.isContact || isContactAdded(item.firebaseUid)
              ? '#64748b'
              : '#fff'
          }
        />
        <AddButtonText
          added={item.isContact || isContactAdded(item.firebaseUid)}
        >
          {item.isContact || isContactAdded(item.firebaseUid) ? 'Added' : 'Add'}
        </AddButtonText>
      </AddButton>
    </UserCard>
  )

  return (
    <Container>
      <Header>
        <HeaderContent>
          <BackButton onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#64748b" />
          </BackButton>
          <HeaderTitle>Add Contacts</HeaderTitle>
        </HeaderContent>
      </Header>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ContentContainer
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ContentPadding>
            {/* Add by Email or Phone Section */}
            <SearchCard>
              <SearchTitle>Add by Email or Phone</SearchTitle>

              <InputGroup>
                <InputLabel>Email Address</InputLabel>
                <InputWrapper>
                  <Ionicons name="mail-outline" size={20} color="#64748b" />
                  <Input
                    placeholder="friend@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#94a3b8"
                    editable={!isAddingContact}
                  />
                </InputWrapper>
              </InputGroup>

              <InputGroup>
                <InputLabel>Phone Number (Optional)</InputLabel>
                <InputWrapper>
                  <Ionicons name="call-outline" size={20} color="#64748b" />
                  <Input
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    placeholderTextColor="#94a3b8"
                    editable={!isAddingContact}
                  />
                </InputWrapper>
              </InputGroup>

              <InputGroup>
                <InputLabel>Name (Optional)</InputLabel>
                <InputWrapper>
                  <Ionicons name="person-outline" size={20} color="#64748b" />
                  <Input
                    placeholder="Friend's name"
                    value={contactName}
                    onChangeText={setContactName}
                    placeholderTextColor="#94a3b8"
                    editable={!isAddingContact}
                  />
                </InputWrapper>
              </InputGroup>

              <SearchButton
                onPress={handleAddContact}
                disabled={
                  isAddingContact || (!email.trim() && !phoneNumber.trim())
                }
              >
                {isAddingContact ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="person-add" size={20} color="#fff" />
                )}
                <SearchButtonText>Add Contact</SearchButtonText>
              </SearchButton>

              {inviteData && (
                <InviteCard>
                  <InviteText>
                    User not found. Would you like to send an invite to{' '}
                    {inviteData.name || 'them'}?
                  </InviteText>
                  <InviteButton onPress={handleSendInvite}>
                    <InviteButtonText>Send Invite</InviteButtonText>
                  </InviteButton>
                </InviteCard>
              )}
            </SearchCard>

            {/* Divider */}
            <Divider />

            {/* Search Users Section */}
            <SectionTitle>Search Users by Name</SectionTitle>
            <SearchCard>
              <InputWrapper>
                <Ionicons name="search" size={20} color="#64748b" />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#94a3b8"
                  editable={!searching}
                />
              </InputWrapper>

              <SearchButton
                onPress={handleSearchUsers}
                disabled={searching || searchQuery.length < 2}
                style={{ marginTop: 16 }}
              >
                {searching ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="search" size={20} color="#fff" />
                )}
                <SearchButtonText>Search</SearchButtonText>
              </SearchButton>
            </SearchCard>

            {/* Loading State */}
            {searching && (
              <LoadingContainer>
                <ActivityIndicator size="large" color="#3b82f6" />
              </LoadingContainer>
            )}

            {/* Search Results */}
            {!searching && searchResults.length > 0 && (
              <ResultsContainer>
                <SectionTitle>
                  Search Results ({searchResults.length})
                </SectionTitle>
                {searchResults.map((item) => renderSearchResult({ item }))}
              </ResultsContainer>
            )}

            {/* Empty State */}
            {!searching &&
              searchResults.length === 0 &&
              !inviteData &&
              searchQuery.length >= 2 && (
                <EmptyContainer>
                  <EmptyIcon>
                    <Ionicons name="search-outline" size={40} color="#94a3b8" />
                  </EmptyIcon>
                  <EmptyText>
                    No users found matching "{searchQuery}".{'\n'}Try a
                    different search term.
                  </EmptyText>
                </EmptyContainer>
              )}
          </ContentPadding>
        </ContentContainer>
      </KeyboardAvoidingView>
    </Container>
  )
}
