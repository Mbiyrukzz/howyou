import React, { useState } from 'react'
import styled from 'styled-components/native'
import { StatusBar, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
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
  padding: 60px 30px 40px 30px;
  align-items: center;
`

const Logo = styled.View`
  width: 70px;
  height: 70px;
  border-radius: 35px;
  background-color: #3396d3;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  shadow-color: #3396d3;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.3;
  shadow-radius: 20px;
  elevation: 10;
`

const LogoText = styled.Text`
  color: white;
  font-size: 28px;
  font-weight: 700;
`

const WelcomeTitle = styled.Text`
  font-size: 28px;
  font-weight: 800;
  color: white;
  margin-bottom: 8px;
  text-align: center;
`

const WelcomeSubtitle = styled.Text`
  font-size: 15px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  line-height: 22px;
`

const FormContainer = styled.View`
  padding: 0 30px;
  margin-bottom: 30px;
`

const InputGroup = styled.View`
  margin-bottom: 20px;
`

const InputLabel = styled.Text`
  font-size: 15px;
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
  padding: 16px 20px;
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
  top: 16px;
  z-index: 1;
`

const SignupButton = styled.TouchableOpacity`
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

const SignupButtonText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: 700;
`

const DividerContainer = styled.View`
  flex-direction: row;
  align-items: center;
  margin: 25px 0;
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
  padding: 14px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.2);
`

const SocialButtonText = styled.Text`
  color: white;
  font-size: 15px;
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
  font-size: 15px;
`

const LoginLink = styled.TouchableOpacity`
  margin-left: 6px;
`

const LoginLinkText = styled.Text`
  color: #3396d3;
  font-size: 15px;
  font-weight: 700;
`

const TermsText = styled.Text`
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  text-align: center;
  margin-top: 20px;
  line-height: 18px;
`

const TermsLink = styled.Text`
  color: #3396d3;
  font-weight: 600;
`

const LoadingIndicator = styled.ActivityIndicator`
  margin-right: 10px;
`

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nameFocused, setNameFocused] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [phoneFocused, setPhoneFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false)
  const [loading, setLoading] = useState(false)

  const isFormValid =
    name.trim() && email.trim() && password.trim() && confirmPassword.trim()

  const handleSignup = async () => {
    if (!isFormValid) return

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )

      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: name.trim(),
      })

      console.log('✅ User created successfully')

      // Backend user creation happens in AppNavigator's onAuthStateChanged
      // Navigation is handled automatically

      Alert.alert(
        'Success',
        'Account created successfully! Welcome to the chat app.',
        [{ text: 'OK' }]
      )
    } catch (error) {
      console.error('Signup error:', error)

      let errorMessage = 'Signup failed. Please try again.'

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered.'
          break
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.'
          break
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled.'
          break
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please use a stronger password.'
          break
      }

      Alert.alert('Signup Error', errorMessage)
      setLoading(false)
    }
  }

  const handleSocialSignup = (provider) => {
    Alert.alert('Coming Soon', `${provider} signup will be available soon!`)
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
            <WelcomeTitle>Create Account</WelcomeTitle>
            <WelcomeSubtitle>
              Sign up to start chatting with friends
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
                  placeholder="Enter your name"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  focused={nameFocused}
                  autoCapitalize="words"
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
              <InputLabel>Phone Number (Optional)</InputLabel>
              <InputContainer>
                <InputIcon>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={
                      phoneFocused ? '#3396D3' : 'rgba(255, 255, 255, 0.6)'
                    }
                  />
                </InputIcon>
                <Input
                  placeholder="+1234567890"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                  focused={phoneFocused}
                  keyboardType="phone-pad"
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
                  placeholder="Create a password"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  focused={passwordFocused}
                  secureTextEntry
                  autoComplete="password-new"
                />
              </InputContainer>
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
                  autoComplete="password-new"
                />
              </InputContainer>
            </InputGroup>

            <SignupButton
              onPress={handleSignup}
              disabled={!isFormValid || loading}
            >
              {loading && <LoadingIndicator color="white" size="small" />}
              <SignupButtonText>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </SignupButtonText>
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

            <TermsText>
              By signing up, you agree to our{' '}
              <TermsLink>Terms of Service</TermsLink> and{' '}
              <TermsLink>Privacy Policy</TermsLink>
            </TermsText>
          </FooterContainer>
        </ScrollContainer>
      </KeyboardContainer>
    </Container>
  )
}
