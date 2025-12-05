import React, { useState, useEffect } from 'react'
import styled from 'styled-components/native'
import {
  ScrollView,
  Switch,
  Alert,
  Platform,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  View,
  TextInput,
  Image,
  KeyboardAvoidingView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { signOut, deleteUser } from 'firebase/auth'
import * as ImagePicker from 'expo-image-picker'
import WebSidebarLayout, {
  shouldShowSidebar,
} from '../components/WebSidebarLayout'
import { auth } from '../firebase/setUpFirebase'
import { useUserProfile } from '../providers/UserProfileProvider'

// ==============================
// STYLED COMPONENTS
// ==============================

const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`

const Header = styled.View`
  background-color: #fff;
  padding: ${Platform.OS === 'web' && shouldShowSidebar
    ? '40px 20px 20px 20px'
    : '60px 20px 30px 20px'};
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 5;
`

const HeaderTitle = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 8px;
`

const HeaderSubtitle = styled.Text`
  font-size: 16px;
  color: #7f8c8d;
`

const Content = styled.ScrollView`
  flex: 1;
`

const Section = styled.View`
  background-color: #fff;
  margin: 20px;
  margin-top: ${(props) => (props.first ? '0px' : '20px')};
  border-radius: 16px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
`

const SectionHeader = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 20px;
  border-bottom-width: 1px;
  border-bottom-color: #f1f2f6;
`

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin-left: 12px;
`

const ProfileSection = styled.View`
  padding: 30px;
  align-items: center;
`

const AvatarContainer = styled.View`
  position: relative;
  margin-bottom: 20px;
`

const Avatar = styled.View`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background-color: ${(props) => props.color || '#3b82f6'};
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-width: 4px;
  border-color: #fff;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.15;
  shadow-radius: 8px;
  elevation: 5;
`

const AvatarImage = styled.Image`
  width: 100%;
  height: 100%;
`

const AvatarText = styled.Text`
  color: white;
  font-size: 48px;
  font-weight: bold;
`

const EditAvatarButton = styled.TouchableOpacity`
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #3b82f6;
  align-items: center;
  justify-content: center;
  border-width: 3px;
  border-color: white;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.2;
  shadow-radius: 4px;
  elevation: 3;
`

const ProfileInfo = styled.View`
  align-items: center;
  margin-bottom: 25px;
`

const ProfileName = styled.Text`
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 5px;
`

const ProfileEmail = styled.Text`
  font-size: 16px;
  color: #7f8c8d;
  margin-bottom: 15px;
`

const ProfileActions = styled.View`
  flex-direction: row;
  gap: 12px;
  margin-top: 10px;
`

const ActionButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 12px 20px;
  border-radius: 25px;
  background-color: ${(props) => (props.primary ? '#3b82f6' : '#f8f9fa')};
  border-width: ${(props) => (props.outline ? '1px' : '0px')};
  border-color: ${(props) => (props.outline ? '#3b82f6' : 'transparent')};
`

const ActionButtonText = styled.Text`
  color: ${(props) =>
    props.primary ? '#fff' : props.outline ? '#3b82f6' : '#6c757d'};
  font-weight: 600;
  font-size: 16px;
  margin-left: 8px;
`

const SettingItem = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom-width: ${(props) => (props.last ? '0px' : '1px')};
  border-bottom-color: #f1f2f6;
`

const SettingInfo = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
`

const SettingIcon = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: ${(props) => props.color || '#ecf0f1'};
  align-items: center;
  justify-content: center;
  margin-right: 16px;
`

const SettingText = styled.View`
  flex: 1;
`

const SettingTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 2px;
`

const SettingDescription = styled.Text`
  font-size: 14px;
  color: #7f8c8d;
`

const InputContainer = styled.View`
  padding: 20px;
`

const InputGroup = styled.View`
  margin-bottom: 20px;
`

const InputLabel = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
`

const StyledTextInput = styled.TextInput`
  background-color: #f8f9fa;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 16px;
  color: #2c3e50;
  border-width: 1px;
  border-color: ${(props) => (props.error ? '#e74c3c' : '#e9ecef')};
`

const ErrorText = styled.Text`
  color: #e74c3c;
  font-size: 14px;
  margin-top: 5px;
`

const SaveButton = styled.TouchableOpacity`
  background-color: #3b82f6;
  padding: 15px;
  border-radius: 12px;
  align-items: center;
  margin-top: 20px;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
`

const SaveButtonText = styled.Text`
  color: white;
  font-weight: 600;
  font-size: 16px;
`

const LoadingOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  justify-content: center;
  align-items: center;
  z-index: 1000;
`

const VersionInfo = styled.View`
  align-items: center;
  padding: 30px 20px;
`

const AppName = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #7f8c8d;
  margin-bottom: 4px;
`

const VersionText = styled.Text`
  font-size: 14px;
  color: #95a5a6;
`

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  padding: 20px;
`

const ModalContent = styled.View`
  background-color: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90%;
  overflow: hidden;
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
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
`

const ModalBody = styled.ScrollView`
  padding: 20px;
`

const ModalActions = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top-width: 1px;
  border-top-color: #e9ecef;
  background-color: white;
`

const ModalButton = styled.TouchableOpacity`
  padding: 12px 24px;
  border-radius: 25px;
  background-color: ${(props) => (props.primary ? '#3b82f6' : '#f8f9fa')};
`

const ModalButtonText = styled.Text`
  color: ${(props) => (props.primary ? 'white' : '#6c757d')};
  font-weight: 600;
  font-size: 16px;
`

const SidebarContainer = styled.View`
  flex: 1;
  background-color: #fff;
  padding-top: 40px;
`

const SidebarHeader = styled.View`
  align-items: center;
  padding: 0 20px 30px 20px;
  border-bottom-width: 1px;
  border-bottom-color: #e9ecef;
  margin-bottom: 20px;
`

const SectionList = styled.View`
  padding: 0 10px;
`

const SectionItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 15px;
  margin-bottom: 5px;
  border-radius: 12px;
  background-color: ${(props) => (props.active ? '#f0f7ff' : 'transparent')};
`

const SectionIcon = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background-color: ${(props) => (props.active ? props.color : '#f8f9fa')};
  align-items: center;
  justify-content: center;
  margin-right: 12px;
`

const SectionItemTitle = styled.Text`
  flex: 1;
  font-size: 16px;
  font-weight: ${(props) => (props.active ? '600' : '500')};
  color: ${(props) => (props.active ? '#2c3e50' : '#6c757d')};
`

// ==============================
// SIDEBAR COMPONENT
// ==============================

const SettingsSidebar = ({ user, onSelectSection, activeSection }) => {
  const sections = [
    {
      id: 'profile',
      title: 'Profile',
      icon: 'person-outline',
      color: '#3b82f6',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications-outline',
      color: '#f39c12',
    },
    {
      id: 'privacy',
      title: 'Privacy',
      icon: 'shield-checkmark-outline',
      color: '#9b59b6',
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: 'color-palette-outline',
      color: '#e67e22',
    },
    {
      id: 'account',
      title: 'Account',
      icon: 'settings-outline',
      color: '#34495e',
    },
  ]

  return (
    <SidebarContainer>
      <SidebarHeader>
        <AvatarContainer style={{ marginBottom: 20 }}>
          <Avatar color="#3b82f6">
            {user?.profilePicture ? (
              <AvatarImage source={{ uri: user.profilePicture }} />
            ) : (
              <AvatarText>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarText>
            )}
          </Avatar>
        </AvatarContainer>
        <ProfileName style={{ fontSize: 20, marginBottom: 5 }}>
          {user?.name || 'User'}
        </ProfileName>
        <ProfileEmail style={{ fontSize: 14 }}>
          {user?.email || 'user@example.com'}
        </ProfileEmail>
      </SidebarHeader>

      <SectionList>
        {sections.map((section) => (
          <SectionItem
            key={section.id}
            onPress={() => onSelectSection(section.id)}
            active={activeSection === section.id}
          >
            <SectionIcon
              active={activeSection === section.id}
              color={section.color}
            >
              <Ionicons
                name={section.icon}
                size={20}
                color={activeSection === section.id ? '#fff' : section.color}
              />
            </SectionIcon>
            <SectionItemTitle active={activeSection === section.id}>
              {section.title}
            </SectionItemTitle>
            {activeSection === section.id && (
              <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
            )}
          </SectionItem>
        ))}
      </SectionList>
    </SidebarContainer>
  )
}

// ==============================
// PROFILE EDIT MODAL
// ==============================

const EditProfileModal = ({ visible, onClose, user, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })
  const [profileImage, setProfileImage] = useState(null)
  const [errors, setErrors] = useState({})

  // Reset form when user changes or modal opens
  useEffect(() => {
    if (visible && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      })
      setProfileImage(null)
      setErrors({})
    }
  }, [visible, user])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission required',
          'Please allow access to your photo library'
        )
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0]
        const uri = asset.uri

        // IMPROVED: Better extension handling
        let extension = 'jpg'
        if (uri.includes('.')) {
          extension = uri.split('.').pop()?.toLowerCase() || 'jpg'
        }

        const mimeType = asset.mimeType || getMimeTypeFromExtension(extension)
        const timestamp = Date.now()
        const fileName = `profile_${timestamp}.${extension}`

        const imageFile = {
          uri: uri,
          type: mimeType,
          name: fileName,
          fileName: fileName,
          mimeType: mimeType,
        }

        setProfileImage(imageFile)
        console.log('📸 Selected image details:', imageFile)
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  // Helper function
  const getMimeTypeFromExtension = (extension) => {
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg'
      case 'png':
        return 'image/png'
      case 'gif':
        return 'image/gif'
      case 'webp':
        return 'image/webp'
      case 'bmp':
        return 'image/bmp'
      case 'heic':
        return 'image/heic'
      default:
        return 'image/jpeg'
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      // Prepare update data
      const updateData = {}
      if (formData.name !== user?.name) updateData.name = formData.name.trim()
      if (formData.email !== user?.email)
        updateData.email = formData.email.trim().toLowerCase()

      // Call onSave with both data and image
      if (Object.keys(updateData).length > 0 || profileImage) {
        await onSave(updateData, profileImage)
        // Modal will be closed by parent component on success
      } else {
        Alert.alert('No changes', 'No changes were made to your profile')
        onClose()
      }
    } catch (error) {
      // Error is already handled by onSave, just prevent modal from closing
      console.error('Submit error:', error)
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <ModalOverlay>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, width: '100%' }}
        >
          <ModalContent>
            {isLoading && (
              <LoadingOverlay>
                <ActivityIndicator size="large" color="#3b82f6" />
              </LoadingOverlay>
            )}

            <ModalHeader>
              <ModalTitle>Edit Profile</ModalTitle>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </ModalHeader>

            <ModalBody>
              <AvatarContainer
                style={{ alignSelf: 'center', marginBottom: 30 }}
              >
                <TouchableOpacity onPress={handlePickImage}>
                  <Avatar color="#3b82f6">
                    {profileImage ? (
                      <AvatarImage source={{ uri: profileImage.uri }} />
                    ) : user?.profilePicture ? (
                      <AvatarImage
                        source={{
                          uri: user.profilePicture,
                        }}
                      />
                    ) : (
                      <AvatarText>
                        {formData.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarText>
                    )}
                  </Avatar>
                  <EditAvatarButton>
                    <Ionicons name="camera" size={18} color="#fff" />
                  </EditAvatarButton>
                </TouchableOpacity>
              </AvatarContainer>

              <InputGroup>
                <InputLabel>Full Name</InputLabel>
                <StyledTextInput
                  value={formData.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                  placeholder="Enter your name"
                  error={errors.name}
                />
                {errors.name && <ErrorText>{errors.name}</ErrorText>}
              </InputGroup>

              <InputGroup>
                <InputLabel>Email Address</InputLabel>
                <StyledTextInput
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                />
                {errors.email && <ErrorText>{errors.email}</ErrorText>}
              </InputGroup>
            </ModalBody>

            <ModalActions>
              <ModalButton onPress={onClose}>
                <ModalButtonText>Cancel</ModalButtonText>
              </ModalButton>

              <ModalButton primary onPress={handleSubmit} disabled={isLoading}>
                <ModalButtonText primary>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </ModalButtonText>
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </KeyboardAvoidingView>
      </ModalOverlay>
    </Modal>
  )
}

// ==============================
// CHANGE PASSWORD MODAL
// ==============================

const ChangePasswordModal = ({
  visible,
  onClose,
  onChangePassword,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setErrors({})
      setShowCurrent(false)
      setShowNew(false)
      setShowConfirm(false)
    }
  }, [visible])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required'
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      await onChangePassword(formData.currentPassword, formData.newPassword)
      Alert.alert('Success', 'Password changed successfully')
      onClose()
    } catch (error) {
      // Show specific error from backend
      Alert.alert('Error', error.message || 'Failed to change password')
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <ModalOverlay>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, width: '100%' }}
        >
          <ModalContent>
            {isLoading && (
              <LoadingOverlay>
                <ActivityIndicator size="large" color="#3b82f6" />
              </LoadingOverlay>
            )}

            <ModalHeader>
              <ModalTitle>Change Password</ModalTitle>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </ModalHeader>

            <ModalBody>
              <InputGroup>
                <InputLabel>Current Password</InputLabel>
                <View style={{ position: 'relative' }}>
                  <StyledTextInput
                    value={formData.currentPassword}
                    onChangeText={(text) =>
                      handleInputChange('currentPassword', text)
                    }
                    placeholder="Enter current password"
                    secureTextEntry={!showCurrent}
                    error={errors.currentPassword}
                  />
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 15, top: 12 }}
                    onPress={() => setShowCurrent(!showCurrent)}
                  >
                    <Ionicons
                      name={showCurrent ? 'eye-off' : 'eye'}
                      size={20}
                      color="#6c757d"
                    />
                  </TouchableOpacity>
                </View>
                {errors.currentPassword && (
                  <ErrorText>{errors.currentPassword}</ErrorText>
                )}
              </InputGroup>

              <InputGroup>
                <InputLabel>New Password</InputLabel>
                <View style={{ position: 'relative' }}>
                  <StyledTextInput
                    value={formData.newPassword}
                    onChangeText={(text) =>
                      handleInputChange('newPassword', text)
                    }
                    placeholder="Enter new password"
                    secureTextEntry={!showNew}
                    error={errors.newPassword}
                  />
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 15, top: 12 }}
                    onPress={() => setShowNew(!showNew)}
                  >
                    <Ionicons
                      name={showNew ? 'eye-off' : 'eye'}
                      size={20}
                      color="#6c757d"
                    />
                  </TouchableOpacity>
                </View>
                {errors.newPassword && (
                  <ErrorText>{errors.newPassword}</ErrorText>
                )}
              </InputGroup>

              <InputGroup>
                <InputLabel>Confirm New Password</InputLabel>
                <View style={{ position: 'relative' }}>
                  <StyledTextInput
                    value={formData.confirmPassword}
                    onChangeText={(text) =>
                      handleInputChange('confirmPassword', text)
                    }
                    placeholder="Confirm new password"
                    secureTextEntry={!showConfirm}
                    error={errors.confirmPassword}
                  />
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 15, top: 12 }}
                    onPress={() => setShowConfirm(!showConfirm)}
                  >
                    <Ionicons
                      name={showConfirm ? 'eye-off' : 'eye'}
                      size={20}
                      color="#6c757d"
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <ErrorText>{errors.confirmPassword}</ErrorText>
                )}
              </InputGroup>
            </ModalBody>

            <ModalActions>
              <ModalButton onPress={onClose}>
                <ModalButtonText>Cancel</ModalButtonText>
              </ModalButton>

              <ModalButton primary onPress={handleSubmit} disabled={isLoading}>
                <ModalButtonText primary>
                  {isLoading ? 'Changing...' : 'Change Password'}
                </ModalButtonText>
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </KeyboardAvoidingView>
      </ModalOverlay>
    </Modal>
  )
}

// ==============================
// SETTINGS CONTENT COMPONENT
// ==============================

const SettingsContent = ({ activeSection }) => {
  const {
    user,
    isLoading,
    isInitializing,
    updateProfile,
    updateProfilePicture,
    deleteProfilePicture,
    changePassword,
    refreshProfile,
  } = useUserProfile()

  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false)

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth)
          } catch (error) {
            console.error('❌ Logout failed:', error)
            Alert.alert('Error', 'Failed to sign out')
          }
        },
      },
    ])
  }

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentUser = auth.currentUser
              if (currentUser) {
                await deleteUser(currentUser)
              } else {
                Alert.alert('Error', 'No user logged in')
              }
            } catch (error) {
              console.error('❌ Account deletion failed:', error)
              if (error.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Re-authentication required',
                  'Please log in again before deleting your account.'
                )
              } else {
                Alert.alert('Error', 'Failed to delete account')
              }
            }
          },
        },
      ]
    )
  }

  const handleSaveProfile = async (updateData, profileImage) => {
    try {
      let profileUpdated = false
      let pictureUpdated = false

      // Update profile information first
      if (updateData && Object.keys(updateData).length > 0) {
        console.log('📝 Updating profile with data:', updateData)
        await updateProfile(updateData)
        profileUpdated = true
      }

      // Then update profile picture if selected
      if (profileImage) {
        console.log('📸 Updating profile picture:', {
          uri: profileImage.uri.substring(0, 50) + '...',
          type: profileImage.type,
          name: profileImage.name,
        })
        await updateProfilePicture(profileImage)
        pictureUpdated = true
      }

      // Refresh profile to ensure UI sync
      if (profileUpdated || pictureUpdated) {
        await refreshProfile()
        Alert.alert('Success', 'Profile updated successfully')
        setIsEditModalVisible(false)
      } else {
        Alert.alert('No changes', 'No changes were made to your profile')
        setIsEditModalVisible(false)
      }

      return true
    } catch (error) {
      console.error('Save profile error:', error)
      // Show more specific error message
      const errorMessage = error.message || 'Failed to update profile'
      Alert.alert('Error', errorMessage)
      throw error
    }
  }
  const handleChangePassword = async (currentPassword, newPassword) => {
    try {
      await changePassword(currentPassword, newPassword)
      return true
    } catch (error) {
      console.error('Change password error:', error)
      throw error // Let the modal handle the error display
    }
  }

  const handleDeletePicture = async () => {
    Alert.alert(
      'Delete Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProfilePicture()
              await refreshProfile() // Force UI refresh
              Alert.alert('Success', 'Profile picture removed successfully')
            } catch (error) {
              Alert.alert(
                'Error',
                error.message || 'Failed to remove profile picture'
              )
            }
          },
        },
      ]
    )
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <Section first>
            <SectionHeader>
              <Ionicons name="person-outline" size={24} color="#3b82f6" />
              <SectionTitle>Profile</SectionTitle>
            </SectionHeader>
            <ProfileSection>
              <AvatarContainer>
                <TouchableOpacity onPress={handleDeletePicture}>
                  <Avatar color="#3b82f6">
                    {user?.profilePicture ? (
                      <AvatarImage
                        source={{
                          uri: user.profilePicture,
                        }}
                      />
                    ) : (
                      <AvatarText>
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarText>
                    )}
                  </Avatar>
                  {user?.profilePicture && (
                    <EditAvatarButton
                      style={{ backgroundColor: '#e74c3c' }}
                      onPress={handleDeletePicture}
                    >
                      <Ionicons name="trash" size={18} color="#fff" />
                    </EditAvatarButton>
                  )}
                </TouchableOpacity>
              </AvatarContainer>
              <ProfileInfo>
                <ProfileName>{user?.name || 'User'}</ProfileName>
                <ProfileEmail>{user?.email || 'user@example.com'}</ProfileEmail>
              </ProfileInfo>
              <ProfileActions>
                <ActionButton
                  primary
                  onPress={() => setIsEditModalVisible(true)}
                >
                  <Ionicons name="create-outline" size={18} color="#fff" />
                  <ActionButtonText primary>Edit Profile</ActionButtonText>
                </ActionButton>
                <ActionButton
                  outline
                  onPress={() => setIsPasswordModalVisible(true)}
                >
                  <Ionicons name="key-outline" size={18} color="#3b82f6" />
                  <ActionButtonText outline>Change Password</ActionButtonText>
                </ActionButton>
              </ProfileActions>
            </ProfileSection>
          </Section>
        )

      case 'account':
        return (
          <Section first>
            <SectionHeader>
              <Ionicons name="settings-outline" size={24} color="#34495e" />
              <SectionTitle>Account</SectionTitle>
            </SectionHeader>
            <SettingItem>
              <SettingInfo>
                <SettingIcon color="#e67e22">
                  <Ionicons name="log-out" size={20} color="#fff" />
                </SettingIcon>
                <SettingText>
                  <SettingTitle>Sign Out</SettingTitle>
                  <SettingDescription>
                    Sign out of your account
                  </SettingDescription>
                </SettingText>
              </SettingInfo>
              <TouchableOpacity onPress={handleLogout}>
                <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
              </TouchableOpacity>
            </SettingItem>
            <SettingItem last>
              <SettingInfo>
                <SettingIcon color="#e74c3c">
                  <Ionicons name="trash" size={20} color="#fff" />
                </SettingIcon>
                <SettingText>
                  <SettingTitle>Delete Account</SettingTitle>
                  <SettingDescription>
                    Permanently delete your account
                  </SettingDescription>
                </SettingText>
              </SettingInfo>
              <TouchableOpacity onPress={handleDeleteAccount}>
                <Ionicons name="chevron-forward" size={20} color="#e74c3c" />
              </TouchableOpacity>
            </SettingItem>
          </Section>
        )

      case 'notifications':
        return (
          <Section first>
            <SectionHeader>
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#f39c12"
              />
              <SectionTitle>Notifications</SectionTitle>
            </SectionHeader>
            <SettingItem last>
              <SettingInfo>
                <SettingIcon color="#f39c12">
                  <Ionicons name="notifications" size={20} color="#fff" />
                </SettingIcon>
                <SettingText>
                  <SettingTitle>Push Notifications</SettingTitle>
                  <SettingDescription>
                    Receive notifications for new messages
                  </SettingDescription>
                </SettingText>
              </SettingInfo>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#ecf0f1', true: '#3b82f6' }}
                thumbColor={notifications ? '#fff' : '#bdc3c7'}
              />
            </SettingItem>
          </Section>
        )

      case 'appearance':
        return (
          <Section first>
            <SectionHeader>
              <Ionicons
                name="color-palette-outline"
                size={24}
                color="#e67e22"
              />
              <SectionTitle>Appearance</SectionTitle>
            </SectionHeader>
            <SettingItem last>
              <SettingInfo>
                <SettingIcon color="#2c3e50">
                  <Ionicons name="moon" size={20} color="#fff" />
                </SettingIcon>
                <SettingText>
                  <SettingTitle>Dark Mode</SettingTitle>
                  <SettingDescription>Switch to dark theme</SettingDescription>
                </SettingText>
              </SettingInfo>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#ecf0f1', true: '#3b82f6' }}
                thumbColor={darkMode ? '#fff' : '#bdc3c7'}
              />
            </SettingItem>
          </Section>
        )

      default:
        return (
          <Section first>
            <SectionHeader>
              <Ionicons name="person-outline" size={24} color="#3b82f6" />
              <SectionTitle>Profile</SectionTitle>
            </SectionHeader>
            <ProfileSection>
              <AvatarContainer>
                <Avatar color="#3b82f6">
                  {user?.profilePicture ? (
                    <AvatarImage source={{ uri: user.profilePicture }} />
                  ) : (
                    <AvatarText>
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarText>
                  )}
                </Avatar>
              </AvatarContainer>
              <ProfileInfo>
                <ProfileName>{user?.name || 'User'}</ProfileName>
                <ProfileEmail>{user?.email || 'user@example.com'}</ProfileEmail>
              </ProfileInfo>
            </ProfileSection>
          </Section>
        )
    }
  }

  if (isInitializing) {
    return (
      <Container style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </Container>
    )
  }

  return (
    <>
      <Container>
        {!shouldShowSidebar && (
          <Header>
            <HeaderTitle>Settings</HeaderTitle>
            <HeaderSubtitle>Manage your account and preferences</HeaderSubtitle>
          </Header>
        )}

        <Content showsVerticalScrollIndicator={false}>
          {renderContent()}

          {activeSection !== 'account' && (
            <Section>
              <SectionHeader>
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color="#3498db"
                />
                <SectionTitle>About</SectionTitle>
              </SectionHeader>
              <VersionInfo>
                <AppName>PeepGram</AppName>
                <VersionText>Version 1.0.0 (Build 12)</VersionText>
              </VersionInfo>
            </Section>
          )}
        </Content>

        {isLoading && (
          <LoadingOverlay>
            <ActivityIndicator size="large" color="#3b82f6" />
          </LoadingOverlay>
        )}
      </Container>

      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        user={user}
        onSave={handleSaveProfile}
        isLoading={isLoading}
      />

      <ChangePasswordModal
        visible={isPasswordModalVisible}
        onClose={() => setIsPasswordModalVisible(false)}
        onChangePassword={handleChangePassword}
        isLoading={isLoading}
      />
    </>
  )
}

// ==============================
// MAIN SETTINGS SCREEN
// ==============================

export default function SettingsScreen({ navigation, route }) {
  const [activeSection, setActiveSection] = useState('profile')
  const { user } = useUserProfile()

  const renderSidebar = () => (
    <SettingsSidebar
      user={user}
      onSelectSection={setActiveSection}
      activeSection={activeSection}
    />
  )

  const renderMain = () => <SettingsContent activeSection={activeSection} />

  const SettingsEmptyState = () => (
    <Container style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="settings-outline" size={80} color="#bdc3c7" />
      <HeaderTitle style={{ marginTop: 20 }}>Select a Setting</HeaderTitle>
      <HeaderSubtitle>
        Choose a category from the sidebar to begin
      </HeaderSubtitle>
    </Container>
  )

  return (
    <WebSidebarLayout
      sidebar={renderSidebar()}
      main={renderMain()}
      sidebarWidth={320}
      emptyStateType="custom"
      customEmptyState={<SettingsEmptyState />}
    />
  )
}
