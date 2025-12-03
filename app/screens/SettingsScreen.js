import React, { useState } from 'react'
import styled from 'styled-components/native'
import { ScrollView, Switch, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { signOut, deleteUser } from 'firebase/auth'
import { auth } from '../firebase/setUpFirebase'

const Container = styled.View`
  flex: 1;
  background-color: #f8f9fa;
`

const Header = styled.View`
  background-color: #fff;
  padding: 60px 20px 30px 20px;
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

const ProfileSection = styled.View`
  background-color: #fff;
  margin: 20px;
  padding: 20px;
  border-radius: 16px;
  align-items: center;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`

const ProfileAvatar = styled.View`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: #3b82f6;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
`

const ProfileAvatarText = styled.Text`
  color: white;
  font-size: 32px;
  font-weight: bold;
`

const ProfileName = styled.Text`
  font-size: 22px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
`

const ProfileEmail = styled.Text`
  font-size: 16px;
  color: #7f8c8d;
  margin-bottom: 16px;
`

const EditProfileButton = styled.TouchableOpacity`
  background-color: #3b82f6;
  padding: 12px 24px;
  border-radius: 25px;
  flex-direction: row;
  align-items: center;
`

const EditProfileText = styled.Text`
  color: white;
  font-weight: 600;
  font-size: 16px;
  margin-left: 8px;
`

const SettingsSection = styled.View`
  background-color: #fff;
  margin: 0 20px 20px 20px;
  border-radius: 16px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
`

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  padding: 20px 20px 12px 20px;
`

const SettingItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 16px 20px;
  border-bottom-width: ${(props) => (props.isLast ? '0px' : '1px')};
  border-bottom-color: #f1f2f6;
`

const SettingIconContainer = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: ${(props) => props.color || '#ecf0f1'};
  align-items: center;
  justify-content: center;
  margin-right: 16px;
`

const SettingContent = styled.View`
  flex: 1;
`

const SettingTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 2px;
`

const SettingSubtitle = styled.Text`
  font-size: 14px;
  color: #7f8c8d;
`

const SettingAction = styled.View`
  align-items: center;
  justify-content: center;
`

const SettingBadge = styled.View`
  background-color: #e74c3c;
  border-radius: 10px;
  min-width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
`

const BadgeText = styled.Text`
  color: white;
  font-size: 12px;
  font-weight: bold;
`

const VersionInfo = styled.View`
  align-items: center;
  padding: 30px 20px;
`

const VersionText = styled.Text`
  font-size: 14px;
  color: #95a5a6;
  margin-bottom: 4px;
`

const AppName = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #7f8c8d;
`

export default function SettingsScreen({ navigation }) {
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [readReceipts, setReadReceipts] = useState(true)
  const [onlineStatus, setOnlineStatus] = useState(true)

  const handleLogout = async () => {
    try {
      await signOut(auth)
      console.log('✅ User signed out')
      // no need for navigation.replace('Login')
    } catch (error) {
      console.error('❌ Logout failed:', error)
    }
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
              const user = auth.currentUser
              if (user) {
                await deleteUser(user)
                console.log('✅ Account deleted')
                // No navigation needed – AppNavigator will switch to Login
              } else {
                console.warn('⚠️ No user logged in')
              }
            } catch (error) {
              console.error('❌ Account deletion failed:', error)
              if (error.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Re-authentication required',
                  'Please log in again before deleting your account.'
                )
              }
            }
          },
        },
      ]
    )
  }

  const SettingItemComponent = ({
    icon,
    iconColor,
    title,
    subtitle,
    onPress,
    rightComponent,
    badge,
    isLast = false,
  }) => (
    <SettingItem onPress={onPress} isLast={isLast}>
      <SettingIconContainer color={iconColor}>
        <Ionicons name={icon} size={20} color="#fff" />
      </SettingIconContainer>
      <SettingContent>
        <SettingTitle>{title}</SettingTitle>
        {subtitle && <SettingSubtitle>{subtitle}</SettingSubtitle>}
      </SettingContent>
      <SettingAction>
        {badge && (
          <SettingBadge>
            <BadgeText>{badge}</BadgeText>
          </SettingBadge>
        )}
        {rightComponent}
        {!rightComponent && !badge && (
          <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
        )}
      </SettingAction>
    </SettingItem>
  )

  return (
    <Container>
      <Header>
        <HeaderTitle>Settings</HeaderTitle>
        <HeaderSubtitle>Manage your account and preferences</HeaderSubtitle>
      </Header>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileSection>
          <ProfileAvatar>
            <ProfileAvatarText>JD</ProfileAvatarText>
          </ProfileAvatar>
          <ProfileName>John Doe</ProfileName>
          <ProfileEmail>john.doe@example.com</ProfileEmail>
          <EditProfileButton>
            <Ionicons name="person-outline" size={18} color="#fff" />
            <EditProfileText>Edit Profile</EditProfileText>
          </EditProfileButton>
        </ProfileSection>

        <SettingsSection>
          <SectionTitle>Notifications</SectionTitle>
          <SettingItemComponent
            icon="notifications-outline"
            iconColor="#f39c12"
            title="Push Notifications"
            subtitle="Receive notifications for new messages"
            rightComponent={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#ecf0f1', true: '#3b82f6' }}
                thumbColor={notifications ? '#fff' : '#bdc3c7'}
              />
            }
          />
          <SettingItemComponent
            icon="mail-outline"
            iconColor="#e74c3c"
            title="Email Notifications"
            subtitle="Get notified via email"
            onPress={() => navigation?.navigate('EmailSettings')}
            isLast
          />
        </SettingsSection>

        <SettingsSection>
          <SectionTitle>Privacy & Security</SectionTitle>
          <SettingItemComponent
            icon="eye-outline"
            iconColor="#2ecc71"
            title="Read Receipts"
            subtitle="Let others know when you've read their messages"
            rightComponent={
              <Switch
                value={readReceipts}
                onValueChange={setReadReceipts}
                trackColor={{ false: '#ecf0f1', true: '#3b82f6' }}
                thumbColor={readReceipts ? '#fff' : '#bdc3c7'}
              />
            }
          />
          <SettingItemComponent
            icon="shield-checkmark-outline"
            iconColor="#9b59b6"
            title="Privacy Settings"
            subtitle="Control who can contact you"
            onPress={() => navigation?.navigate('PrivacySettings')}
          />
          <SettingItemComponent
            icon="lock-closed-outline"
            iconColor="#34495e"
            title="Blocked Users"
            subtitle="Manage blocked contacts"
            badge="3"
            onPress={() => navigation?.navigate('BlockedUsers')}
            isLast
          />
        </SettingsSection>

        <SettingsSection>
          <SectionTitle>Appearance</SectionTitle>
          <SettingItemComponent
            icon="moon-outline"
            iconColor="#2c3e50"
            title="Dark Mode"
            subtitle="Switch to dark theme"
            rightComponent={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#ecf0f1', true: '#3b82f6' }}
                thumbColor={darkMode ? '#fff' : '#bdc3c7'}
              />
            }
          />
          <SettingItemComponent
            icon="color-palette-outline"
            iconColor="#e67e22"
            title="Theme"
            subtitle="Choose your preferred color scheme"
            onPress={() => navigation?.navigate('ThemeSettings')}
          />
          <SettingItemComponent
            icon="text-outline"
            iconColor="#16a085"
            title="Font Size"
            subtitle="Adjust text size for better readability"
            onPress={() => navigation?.navigate('FontSettings')}
            isLast
          />
        </SettingsSection>

        <SettingsSection>
          <SectionTitle>Storage & Data</SectionTitle>
          <SettingItemComponent
            icon="download-outline"
            iconColor="#3b82f6"
            title="Auto-download Media"
            subtitle="Automatically download photos and videos"
            onPress={() => navigation?.navigate('MediaSettings')}
          />
          <SettingItemComponent
            icon="trash-outline"
            iconColor="#e74c3c"
            title="Clear Cache"
            subtitle="Free up storage space"
            onPress={() => {
              Alert.alert(
                'Clear Cache',
                'This will free up storage space on your device.'
              )
            }}
          />
          <SettingItemComponent
            icon="cloud-outline"
            iconColor="#9b59b6"
            title="Backup & Restore"
            subtitle="Backup your chats to cloud storage"
            onPress={() => navigation?.navigate('BackupSettings')}
            isLast
          />
        </SettingsSection>

        <SettingsSection>
          <SectionTitle>Support</SectionTitle>
          <SettingItemComponent
            icon="help-circle-outline"
            iconColor="#f39c12"
            title="Help Center"
            subtitle="Find answers to common questions"
            onPress={() => navigation?.navigate('HelpCenter')}
          />
          <SettingItemComponent
            icon="chatbubble-outline"
            iconColor="#2ecc71"
            title="Contact Support"
            subtitle="Get help from our team"
            onPress={() => navigation?.navigate('ContactSupport')}
          />
          <SettingItemComponent
            icon="star-outline"
            iconColor="#e74c3c"
            title="Rate App"
            subtitle="Leave a review on the app store"
            onPress={() => {
              Alert.alert(
                'Rate App',
                'Thank you for using our app! Please rate us on the app store.'
              )
            }}
            isLast
          />
        </SettingsSection>

        <SettingsSection>
          <SectionTitle>Account</SectionTitle>
          <SettingItemComponent
            icon="log-out-outline"
            iconColor="#e67e22"
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleLogout}
          />
          <SettingItemComponent
            icon="trash-outline"
            iconColor="#e74c3c"
            title="Delete Account"
            subtitle="Permanently delete your account"
            onPress={handleDeleteAccount}
            isLast
          />
        </SettingsSection>

        <VersionInfo>
          <AppName>ChatApp</AppName>
          <VersionText>Version 2.1.0 (Build 142)</VersionText>
        </VersionInfo>
      </ScrollView>
    </Container>
  )
}
