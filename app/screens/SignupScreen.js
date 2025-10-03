import React, { useState } from 'react'
import styled from 'styled-components/native'
import { StatusBar, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/setUpFirebase'

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
  padding: 80px 30px 50px 30px;
  align-items: center;
`

const BackButton = styled.TouchableOpacity`
  position: absolute;
  top: 60px;
  left: 20px;
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: rgba(255, 255, 255, 0.1);
  align-items: center;
  justify-content: center;
  z-index: 1;
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
  padding: 0 20px;
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

const PasswordStrengthContainer = styled.View`
  margin-top: 8px;
  padding: 0 4px;
`

const PasswordStrengthBar = styled.View`
  height: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  margin-bottom: 8px;
  overflow: hidden;
`

const PasswordStrengthFill = styled.View`
  height: 100%;
  background-color: ${(props) => props.color};
  width: ${(props) => props.width}%;
  border-radius: 2px;
`

const PasswordStrengthText = styled.Text`
  font-size: 12px;
  color: ${(props) => props.color};
  font-weight: 500;
`

const PasswordRequirements = styled.View`
  margin-top: 8px;
  padding: 0 4px;
`

const RequirementItem = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 4px;
`

const RequirementText = styled.Text`
  font-size: 12px;
  color: ${(props) => (props.met ? '#4ade80' : 'rgba(255, 255, 255, 0.5)')};
  margin-left: 8px;
`

const SignupButton = styled.TouchableOpacity`
  background-color: #3396d3;
  border-radius: 16px;
  padding: 18px;
  align-items: center;
  margin-top: 10px;
  shadow-color: #3396d3;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.3;
  shadow-radius: 20px;
  elevation: 8;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
`

const SignupButtonText = styled.Text`
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

const LoginContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
`

const LoginText = styled.Text`
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
`

const LoginLink = styled.TouchableOpacity`
  margin-left: 6px;
`

const LoginLinkText = styled.Text`
  color: #3396d3;
  font-size: 16px;
  font-weight: 700;
`

const TermsContainer = styled.View`
  margin-top: 20px;
  padding: 0 10px;
`

const TermsText = styled.Text`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  line-height: 18px;
`

const TermsLink = styled.Text`
  color: #3396d3;
  font-weight: 600;
`

const LoadingIndicator = styled.ActivityIndicator`
  margin-right: 10px;
`

const API_URL = 'http://10.216.188.87:5000'

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false)
  const [nameFocused, setNameFocused] = useState(false)
  const [loading, setLoading] = useState(false)

  // Password strength validation
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, text: '', color: '#6b7280' }

    let score = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    Object.values(checks).forEach((check) => check && score++)

    if (score <= 2) return { score: score * 20, text: 'Weak', color: '#ef4444' }
    if (score === 3)
      return { score: score * 20, text: 'Fair', color: '#f59e0b' }
    if (score === 4)
      return { score: score * 20, text: 'Good', color: '#10b981' }
    return { score: 100, text: 'Strong', color: '#22c55e' }
  }

  const passwordStrength = getPasswordStrength(password)
  const passwordsMatch =
    password && confirmPassword && password === confirmPassword
  const isFormValid =
    email.trim() &&
    password &&
    confirmPassword &&
    name.trim() &&
    passwordsMatch &&
    passwordStrength.score >= 60

  // Enhanced error logging
  const logError = (stage, error, additionalInfo = {}) => {
    console.error(`🔥 Signup Error [${stage}]:`, {
      error: error.message || error,
      code: error.code || 'Unknown',
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...additionalInfo,
    })
  }

  const handleSignup = async () => {
    if (!isFormValid) {
      Alert.alert('Invalid Form', 'Please fill all fields correctly.')
      return
    }

    setLoading(true)
    console.log('🚀 Starting signup process...')

    try {
      // Step 1: Create Firebase user
      console.log('📧 Creating Firebase user with email:', email.trim())
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )
      const user = userCredential.user
      console.log('✅ Firebase user created successfully:', user.uid)

      // Step 2: Create user in MongoDB
      console.log('💾 Creating user in backend database...')
      const userData = {
        firebaseUid: user.uid,
        email: user.email,
        name: name.trim(),
      }

      console.log('📤 Sending request to:', `${API_URL}/users`)
      console.log('📋 User data:', userData)

      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(userData),
        timeout: 10000, // 10 second timeout
      })

      console.log('📨 Response status:', response.status)
      console.log('📨 Response headers:', response.headers)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Backend response error:', errorText)
        throw new Error(`Backend error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Backend user created successfully:', result)

      // Success - Firebase automatically signs in the user
      console.log('🎉 Signup completed successfully')
      Alert.alert(
        'Account Created!',
        'Your account has been created successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigation will be handled by onAuthStateChanged listener
              console.log('📱 User account creation complete')
            },
          },
        ]
      )
    } catch (error) {
      logError('SIGNUP_PROCESS', error, {
        email: email.trim(),
        name: name.trim(),
        API_BASE_URL,
      })

      let errorMessage = 'Account creation failed. Please try again.'

      // Firebase Auth errors
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'An account with this email already exists.'
            break
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.'
            break
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled.'
            break
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters long.'
            break
          case 'auth/network-request-failed':
            errorMessage =
              'Network error. Please check your internet connection.'
            break
        }
      }
      // Network/Backend errors
      else if (error.message.includes('fetch')) {
        errorMessage =
          'Unable to connect to server. Please check your internet connection and try again.'
      } else if (error.message.includes('Backend error')) {
        errorMessage = 'Server error occurred. Please try again later.'
      } else if (error.message.includes('timeout')) {
        errorMessage =
          'Request timed out. Please check your connection and try again.'
      }

      Alert.alert('Signup Error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignup = (provider) => {
    Alert.alert(
      'Coming Soon',
      `Sign up with ${provider} will be available soon!`
    )
  }

  const passwordRequirements = [
    { text: 'At least 8 characters', met: password.length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { text: 'Contains number', met: /\d/.test(password) },
  ]

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
            <BackButton onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </BackButton>

            <Logo>
              <LogoText>A</LogoText>
            </Logo>
            <WelcomeTitle>Create Account</WelcomeTitle>
            <WelcomeSubtitle>
              Join thousands of people connecting through our platform
            </WelcomeSubtitle>
          </Header>

          <FormContainer>
            <InputGroup>
              <InputLabel>Full Name</InputLabel>
              <InputContainer>
                <InputIcon>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={nameFocused ? '#3396D3' : 'rgba(255, 255, 255, 0.6)'}
                  />
                </InputIcon>
                <Input
                  placeholder="Enter your full name"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  focused={nameFocused}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </InputContainer>
            </InputGroup>

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
                  placeholder="Create a strong password"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  focused={passwordFocused}
                  secureTextEntry
                  autoComplete="new-password"
                />
              </InputContainer>

              {password.length > 0 && (
                <PasswordStrengthContainer>
                  <PasswordStrengthBar>
                    <PasswordStrengthFill
                      width={passwordStrength.score}
                      color={passwordStrength.color}
                    />
                  </PasswordStrengthBar>
                  <PasswordStrengthText color={passwordStrength.color}>
                    Password strength: {passwordStrength.text}
                  </PasswordStrengthText>

                  <PasswordRequirements>
                    {passwordRequirements.map((req, index) => (
                      <RequirementItem key={index}>
                        <Ionicons
                          name={
                            req.met ? 'checkmark-circle' : 'ellipse-outline'
                          }
                          size={14}
                          color={
                            req.met ? '#4ade80' : 'rgba(255, 255, 255, 0.3)'
                          }
                        />
                        <RequirementText met={req.met}>
                          {req.text}
                        </RequirementText>
                      </RequirementItem>
                    ))}
                  </PasswordRequirements>
                </PasswordStrengthContainer>
              )}
            </InputGroup>

            <InputGroup>
              <InputLabel>Confirm Password</InputLabel>
              <InputContainer>
                <InputIcon>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={
                      confirmPasswordFocused
                        ? '#3396D3'
                        : 'rgba(255, 255, 255, 0.6)'
                    }
                  />
                </InputIcon>
                <Input
                  placeholder="Confirm your password"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                  focused={confirmPasswordFocused}
                  secureTextEntry
                  autoComplete="new-password"
                />
              </InputContainer>

              {confirmPassword.length > 0 && (
                <PasswordStrengthContainer>
                  <RequirementItem>
                    <Ionicons
                      name={
                        passwordsMatch ? 'checkmark-circle' : 'close-circle'
                      }
                      size={14}
                      color={passwordsMatch ? '#4ade80' : '#ef4444'}
                    />
                    <RequirementText met={passwordsMatch}>
                      {passwordsMatch
                        ? 'Passwords match'
                        : 'Passwords do not match'}
                    </RequirementText>
                  </RequirementItem>
                </PasswordStrengthContainer>
              )}
            </InputGroup>

            <SignupButton
              onPress={handleSignup}
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <>
                  <LoadingIndicator color="white" size="small" />
                  <SignupButtonText>Creating Account...</SignupButtonText>
                </>
              ) : (
                <SignupButtonText>Create Account</SignupButtonText>
              )}
            </SignupButton>
          </FormContainer>

          <FormContainer>
            <DividerContainer>
              <DividerLine />
              <DividerText>Or sign up with</DividerText>
              <DividerLine />
            </DividerContainer>

            <SocialButton onPress={() => handleSocialSignup('Google')}>
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <SocialButtonText>Continue with Google</SocialButtonText>
            </SocialButton>

            <SocialButton onPress={() => handleSocialSignup('Apple')}>
              <Ionicons name="logo-apple" size={20} color="white" />
              <SocialButtonText>Continue with Apple</SocialButtonText>
            </SocialButton>
          </FormContainer>

          <FooterContainer>
            <LoginContainer>
              <LoginText>Already have an account?</LoginText>
              <LoginLink onPress={() => navigation.navigate('Login')}>
                <LoginLinkText>Sign In</LoginLinkText>
              </LoginLink>
            </LoginContainer>

            <TermsContainer>
              <TermsText>
                By creating an account, you agree to our{' '}
                <TermsLink>Terms of Service</TermsLink> and{' '}
                <TermsLink>Privacy Policy</TermsLink>
              </TermsText>
            </TermsContainer>
          </FooterContainer>
        </ScrollContainer>
      </KeyboardContainer>
    </Container>
  )
}
