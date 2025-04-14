import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
  Animated,
  Easing,
} from 'react-native';
import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

interface UserProfile {
  name: string;
  username: string;
}

type FormErrors = Record<string, string[]>;

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;

  onProfileUpdate?: (updatedData: UserProfile) => void;
}

export default function ProfileModal({ visible, onClose, onProfileUpdate }: ProfileModalProps) {
  const [userData, setUserData] = useState<UserProfile>({ name: '', username: '' });
  const [draftUserData, setDraftUserData] = useState<UserProfile>({ name: '', username: '' });
  const [loading, setLoading] = useState<boolean>(false);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [showPasswordInput, setShowPasswordInput] = useState<boolean>(false);

  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const modalScaleAnim = useRef(new Animated.Value(0)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    'OpenSans-Bold': require('../assets/fonts/OpenSans-Bold.ttf'),
    'OpenSans-Regular': require('../assets/fonts/OpenSans-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  useEffect(() => {
    const backAction = () => {
      if (visible) {
        onClose();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [visible, onClose]);

  useEffect(() => {
    if (visible) {
      fetchUserProfile();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(modalScaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacityAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      modalScaleAnim.setValue(0);
      modalOpacityAnim.setValue(0);
    }
  }, [visible]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const authToken = await SecureStore.getItemAsync('authToken');
      if (!authToken) throw new Error('No authorization token found.');

      const response = await axios.get(
        'http://161.49.182.141:8008/PMS_Inventory/public/api/my-profile',
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      const data = response.data || {};
      const newProfile: UserProfile = {
        name: data.name || '',
        username: data.username || '',
      };

      setUserData(newProfile);
      setDraftUserData(newProfile);

      setFormErrors({});
      setIsEditing(false);
      setShowPasswordInput(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to fetch your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setFormErrors({});

      const authToken = await SecureStore.getItemAsync('authToken');
      if (!authToken) throw new Error('No authorization token found.');

      const response = await axios.post(
        'http://161.49.182.141:8008/PMS_Inventory/public/api/update-profile',
        {
          name: draftUserData.name,
          username: draftUserData.username,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data && response.data.message) {
        setSuccessMessage(response.data.message);
      } else {
        setSuccessMessage('Profile updated successfully!');
      }


      setUserData(draftUserData);

      if (onProfileUpdate) {
        onProfileUpdate(draftUserData);
      }

      setShowSuccessModal(true);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      if (error.response && error.response.status === 422) {
        setFormErrors(error.response.data.errors || {});
      } else {
        Alert.alert('Error', 'An unexpected error occurred while updating profile.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setIsChangingPassword(true);
      setPasswordChangeError(null);

      const authToken = await SecureStore.getItemAsync('authToken');
      if (!authToken) throw new Error('No authorization token found.');

      const response = await axios.post(
        'http://161.49.182.141:8008/PMS_Inventory/public/api/change-pass',
        {
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmNewPassword,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (response.data && response.data.message) {
        setSuccessMessage(response.data.message);
      } else {
        setSuccessMessage('Password changed successfully!');
      }

      setShowSuccessModal(true);
      setShowPasswordInput(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.response) {
        if (error.response.status === 401) {
          setPasswordChangeError(
            error.response.data.message || 'Current password is incorrect.'
          );
        } else if (error.response.status === 422) {
          const dataErrors = error.response.data.errors;
          if (dataErrors && dataErrors.new_password) {
            setPasswordChangeError(dataErrors.new_password.join(' '));
          } else {
            setPasswordChangeError('Validation error. Please check your input.');
          }
        } else {
          setPasswordChangeError(error.response.data.message || 'An error occurred.');
        }
      } else {
        setPasswordChangeError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleStartEditing = () => {
    setDraftUserData({ ...userData });
    setIsEditing(true);
  };

  const hasChanges =
    draftUserData.name !== userData.name || draftUserData.username !== userData.username;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.fullScreenWrapper}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={30} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A52A2A" />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              <View style={styles.profileIconContainer}>
                <Ionicons
                  name="person-circle-outline"
                  size={90}
                  color="#041435"
                  style={styles.profileIcon}
                />
                <Text style={styles.profileName}>{userData.name || ''}</Text>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      {
                        backgroundColor: isEditing ? '#28a745' : '#041435',
                      },
                    ]}
                    onPress={() => {
                      if (isEditing) {
                        handleSaveProfile();
                      } else {
                        handleStartEditing();
                      }
                    }}
                    disabled={isEditing && !hasChanges}
                  >
                    {isSaving ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.buttonText}>
                        {isEditing ? 'Save Changes' : 'Edit Profile'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, { opacity: isChangingPassword ? 0.6 : 1 }]}
                    onPress={() => setShowPasswordInput(true)}
                    disabled={isChangingPassword}
                  >
                    <Text style={styles.buttonText}>Change Password</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: isEditing ? '#FFFFFF' : '#F0F0F0' },
                  ]}
                  placeholder="Username"
                  placeholderTextColor="#9E9E9E"
                  value={draftUserData.username}
                  onChangeText={(val) =>
                    setDraftUserData((prev) => ({ ...prev, username: val }))
                  }
                  editable={isEditing}
                />
                {formErrors.username && (
                  <Text style={styles.errorText}>{formErrors.username.join(' ')}</Text>
                )}

                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: isEditing ? '#FFFFFF' : '#F0F0F0' },
                  ]}
                  placeholder="Full name"
                  placeholderTextColor="#9E9E9E"
                  value={draftUserData.name}
                  onChangeText={(val) =>
                    setDraftUserData((prev) => ({ ...prev, name: val }))
                  }
                  autoCapitalize="words"
                  editable={isEditing}
                />
                {formErrors.name && (
                  <Text style={styles.errorText}>{formErrors.name.join(' ')}</Text>
                )}

                {showPasswordInput && (
                  <>
                    <View style={styles.separator} />
                    <Text style={styles.label}>Current Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter current password"
                      placeholderTextColor="#9E9E9E"
                      secureTextEntry
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                    />

                    <Text style={styles.label}>New Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter new password"
                      placeholderTextColor="#9E9E9E"
                      secureTextEntry
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />

                    <Text style={styles.label}>Confirm New Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm new password"
                      placeholderTextColor="#9E9E9E"
                      secureTextEntry
                      value={confirmNewPassword}
                      onChangeText={setConfirmNewPassword}
                    />

                    {passwordChangeError && (
                      <Text style={styles.errorText}>{passwordChangeError}</Text>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.fullWidthButton,
                        { backgroundColor: '#0066b2' },
                        {
                          opacity:
                            !currentPassword ||
                            !newPassword ||
                            !confirmNewPassword ||
                            isChangingPassword
                              ? 0.6
                              : 1,
                        },
                      ]}
                      onPress={handleChangePassword}
                      disabled={
                        !currentPassword ||
                        !newPassword ||
                        !confirmNewPassword ||
                        isChangingPassword
                      }
                    >
                      {isChangingPassword ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.buttonText}>Change</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>

            {showSuccessModal && (
              <View style={styles.modalOverlay}>
                <Animated.View
                  style={[
                    styles.modalContainer,
                    {
                      opacity: modalOpacityAnim,
                      transform: [
                        {
                          scale: modalScaleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={80}
                    color="#28a745"
                    style={styles.successIcon}
                  />
                  <Text style={styles.successTitle}>Success</Text>
                  <Text style={styles.successMessage}>
                    {successMessage || 'Your profile has been successfully updated.'}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowSuccessModal(false)}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#041435',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'OpenSans-Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  profileIconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  profileIcon: {
    marginBottom: 10,
  },
  profileName: {
    fontSize: 22,
    color: '#041435',
    fontFamily: 'Lato-Bold',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    height: 50,
    backgroundColor: '#A52A2A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
  },
  label: {
    fontSize: 16,
    color: '#3C4043',
    alignSelf: 'flex-start',
    marginBottom: 5,
    marginTop: 10,
    fontFamily: 'OpenSans-Bold',
  },
  input: {
    width: '100%',
    height: 50,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    color: '#202124',
    marginBottom: 5,
    fontFamily: 'OpenSans-Regular',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  separator: {
    borderBottomColor: '#DADCE0',
    borderBottomWidth: 1,
    marginVertical: 20,
  },
  errorText: {
    color: 'red',
    marginTop: 5,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
  },
  modalOverlay: {
    position: 'absolute',
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
  },
  successIcon: {
    marginBottom: 15,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#28a745',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'OpenSans-Bold',
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'OpenSans-Regular',
    color: '#3C4043',
  },
  closeButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#A52A2A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'OpenSans-Bold',
  },
  fullWidthButton: {
    width: '100%',
    marginHorizontal: 0,
    marginTop: 20,
  },
});
