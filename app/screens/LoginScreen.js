import React, { useState } from 'react'
import styled from 'styled-components/native'
import { StatusBar, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/setUpFirebase'

const API_URL = process.env.EXPO_PUBLIC_API_URL

const Container = styled.View`
  flex: 1;
  background-color: #1a1a2e;
`

const KeyboardContainer = styled(KeyboardAvoidingView)`
  flex: 1;
`

const ScrollContainer = styled.ScrollView`
  flex: 1;
`

const Header = styled.View`
  padding: 80px 30px 60px 30px;
  align-items: center;
`

const Logo = styled.View`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  background-color: #3396d3;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  shadow-color: #3396d3;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.3;
  shadow-radius: 20px;
  elevation: 10;
`

const LogoText = styled.Text`
  color: white;
  font-size: 32px;
  font-weight: 700;
`

const WelcomeTitle = styled.Text`
  font-size: 32px;
  font-weight: 800;
  color: white;
  margin-bottom: 8px;
  text-align: center;
`

const WelcomeSubtitle = styled.Text`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  line-height: 22px;
`

const FormContainer = styled.View`
  padding: 0 30px;
  margin-bottom: 40px;
`

const InputGroup = styled.View`
  margin-bottom: 24px;
`

const InputLabel = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
  margin-left: 4px;
`

const InputContainer = styled.View`
  position: relative;
`

const Input = styled.TextInput`
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 18px 20px;
  padding-left: 55px;
  font-size: 16px;
  color: white;
  border-width: 2px;
  border-color: ${(props) =>
    props.focused ? '#3396D3' : 'rgba(255, 255, 255, 0.2)'};
`

const InputIcon = styled.View`
  position: absolute;
  left: 18px;
  top: 18px;
  z-index: 1;
`

const LoginButton = styled.TouchableOpacity`
  background-color: #3396d3;
  border-radius: 16px;
  padding: 18px;
  align-items: center;
  margin-top: 10px;
  flex-direction: row;
  justify-content: center;
  shadow-color: #3396d3;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.3;
  shadow-radius: 20px;
  elevation: 8;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
`

const LoginButtonText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: 700;
`

const DividerContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin: 30px 0;
`

const DividerLine = styled.View`
  flex: 1;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.2);
`

const DividerText = styled.Text`
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin: 0 20px;
  font-weight: 500;
`

const SocialButton = styled.TouchableOpacity`
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.2);
`

const SocialButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin-left: 12px;
`

const FooterContainer = styled.View`
  padding: 20px 30px 40px 30px;
  align-items: center;
`

const SignupContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
`

const SignupText = styled.Text`
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
`

const SignupLink = styled.TouchableOpacity`
  margin-left: 6px;
`

const SignupLinkText = styled.Text`
  color: #3396d3;
  font-size: 16px;
  font-weight: 700;
`

const ForgotPasswordLink = styled.TouchableOpacity`
  align-items: center;
  margin-top: 20px;
`

const ForgotPasswordText = styled.Text`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 500;
`

const LoadingIndicator = styled.ActivityIndicator`
  margin-right: 10px;
`

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [loading, setLoading] = useState(false)

  const isFormValid = email.trim() && password.trim()

  const handleLogin = async () => {
    if (!isFormValid) return

    setLoading(true)
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )

      // Get the ID token
      const token = await userCredential.user.getIdToken()

      // Create or verify user in backend
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: userCredential.user.displayName || 'User',
          email: userCredential.user.email,
        }),
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ User authenticated and verified in backend')
      } else {
        throw new Error(data.error || 'Failed to verify user')
      }
    } catch (error) {
      console.error('Login error:', error)

      let errorMessage = 'Login failed. Please try again.'

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.'
          break
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.'
          break
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.'
          break
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.'
          break
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.'
          break
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.'
          break
      }

      Alert.alert('Login Error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = (provider) => {
    Alert.alert('Coming Soon', `${provider} login will be available soon!`)
  }

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address first.')
      return
    }

    Alert.alert(
      'Reset Password',
      'Password reset functionality will be added soon!'
    )
  }

  return (
    <Container>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <KeyboardContainer
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollContainer
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Header>
            <Logo>
              <LogoText>C</LogoText>
            </Logo>
            <WelcomeTitle>Welcome Back</WelcomeTitle>
            <WelcomeSubtitle>
              Sign in to continue to your conversations
            </WelcomeSubtitle>
          </Header>

          <FormContainer>
            <InputGroup>
              <InputLabel>Email Address</InputLabel>
              <InputContainer>
                <InputIcon>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={
                      emailFocused ? '#3396D3' : 'rgba(255, 255, 255, 0.6)'
                    }
                  />
                </InputIcon>
                <Input
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  focused={emailFocused}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </InputContainer>
            </InputGroup>

            <InputGroup>
              <InputLabel>Password</InputLabel>
              <InputContainer>
                <InputIcon>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={
                      passwordFocused ? '#3396D3' : 'rgba(255, 255, 255, 0.6)'
                    }
                  />
                </InputIcon>
                <Input
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  focused={passwordFocused}
                  secureTextEntry
                  autoComplete="password"
                />
              </InputContainer>
            </InputGroup>

            <LoginButton
              onPress={handleLogin}
              disabled={!isFormValid || loading}
            >
              {loading && <LoadingIndicator color="white" size="small" />}
              <LoginButtonText>
                {loading ? 'Signing In...' : 'Sign In'}
              </LoginButtonText>
            </LoginButton>

            <ForgotPasswordLink onPress={handleForgotPassword}>
              <ForgotPasswordText>Forgot your password?</ForgotPasswordText>
            </ForgotPasswordLink>
          </FormContainer>

          <FormContainer>
            <DividerContainer>
              <DividerLine />
              <DividerText>Or continue with</DividerText>
              <DividerLine />
            </DividerContainer>

            <SocialButton onPress={() => handleSocialLogin('Google')}>
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <SocialButtonText>Continue with Google</SocialButtonText>
            </SocialButton>

            <SocialButton onPress={() => handleSocialLogin('Apple')}>
              <Ionicons name="logo-apple" size={20} color="white" />
              <SocialButtonText>Continue with Apple</SocialButtonText>
            </SocialButton>
          </FormContainer>

          <FooterContainer>
            <SignupContainer>
              <SignupText>Don't have an account?</SignupText>
              <SignupLink onPress={() => navigation.navigate('Signup')}>
                <SignupLinkText>Sign Up</SignupLinkText>
              </SignupLink>
            </SignupContainer>
          </FooterContainer>
        </ScrollContainer>
      </KeyboardContainer>
    </Container>
  )
}
