import React, { useState, useEffect } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Image,
  BackHandler,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';

interface PickedImage {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string;
}

const { width } = Dimensions.get('window');


const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  return `${day}-${month}-${year}`;
};

export default function HealthCenterFormModal() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(true);
  const [barangay, setBarangay] = useState('');
  const [telephoneNumber, setTelephoneNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [installationDateObj, setInstallationDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');
  const [mac, setMac] = useState('');
  const [modemFrontImage, setModemFrontImage] = useState<PickedImage | null>(null);
  const [modemBackImage, setModemBackImage] = useState<PickedImage | null>(null);
  const [speedTestImages, setSpeedTestImages] = useState<PickedImage[]>([]);
  const [loading, setLoading] = useState(false);

  
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageForModal, setSelectedImageForModal] = useState<PickedImage | null>(null);

  
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== 'granted') {
        Alert.alert('Permission Denied', 'We need permission to access your camera!');
      }
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (libraryStatus !== 'granted') {
        Alert.alert('Permission Denied', 'We need permission to access your media library!');
      }
    })();
  }, []);


  useEffect(() => {
    const backAction = () => {
      router.replace('/');
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [router]);

  const handleClose = () => {
    setModalVisible(false);
    router.replace('/');
  };

  const getToken = async (): Promise<string | null> => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Error', 'No authentication token found. Please log in.');
      }
      return token;
    } catch (error) {
      console.error('Error fetching token:', error);
      Alert.alert('Error', 'Failed to retrieve authentication token.');
      return null;
    }
  };

  const captureImage = async (
    setImage: React.Dispatch<React.SetStateAction<PickedImage | null>>
  ) => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const { uri, width, height, type, fileName } = result.assets[0];
        const imageCaptured: PickedImage = {
          uri,
          width,
          height,
          type: type ?? 'image',
          fileName: fileName ?? `capture_${Date.now()}.jpg`,
        };
        setImage(imageCaptured);
      }
    } catch (error: any) {
      console.error('captureImage error:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
  };

  const pickImagesForSpeedTest = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
      });
      if (!result.canceled) {
        const images = result.assets.map((asset) => ({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: asset.type ?? 'image',
          fileName: asset.fileName ?? `speed_test_${Date.now()}.jpg`,
        }));
        setSpeedTestImages((prev) => [...prev, ...images]);
      }
    } catch (error: any) {
      console.error('pickImages error:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };

  const removeSpeedTestImage = (index: number) => {
    setSpeedTestImages((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setInstallationDateObj(selectedDate);
      setInstallationDate(formatDate(selectedDate));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('barangay', barangay.trim());
      formData.append('tel_number', telephoneNumber.trim());
      formData.append('acct_number', accountNumber.trim());
      formData.append('installation_date', installationDate.trim());
      formData.append('serial_number', serialNumber.trim());
      formData.append('mac', mac.trim());

      if (modemFrontImage) {
        formData.append('modemfront[]', {
          uri: modemFrontImage.uri,
          type: 'image/jpeg',
          name: modemFrontImage.fileName ?? 'modem_front.jpg',
        } as any);
      }

      if (modemBackImage) {
        formData.append('modemback[]', {
          uri: modemBackImage.uri,
          type: 'image/jpeg',
          name: modemBackImage.fileName ?? 'modem_back.jpg',
        } as any);
      }

      speedTestImages.forEach((img, idx) => {
        formData.append('speedtest[]', {
          uri: img.uri,
          type: 'image/jpeg',
          name: img.fileName ?? `speed_test_${idx}.jpg`,
        } as any);
      });

      const response = await axios.post(
        'http://161.49.182.141:8008/PMS_Inventory/public/api/store-health-center',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Health center data successfully posted!');
        console.log('Server response:', response.data);
        router.replace('/')
      } else {
        console.error('Error response:', response.data);
        Alert.alert('Error', 'An error occurred while submitting. Check logs.');
      }
    } catch (error: any) {
      console.error('handleSubmit error:', error);
      if (error.response?.data?.errors) {
        Alert.alert('Validation Error', JSON.stringify(error.response.data.errors));
      } else {
        Alert.alert('Error', error.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <MaterialCommunityIcons name="hospital-building" size={24} color="#228B22" />
              <Text style={styles.headerTitle}>Internet Details</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Basic Information</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Barangay</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={barangay}
                    style={styles.picker}
                    onValueChange={(itemValue) => setBarangay(itemValue)}
                  >
                    <Picker.Item label="----" value="" />
                    <Picker.Item label="Sta.Lucia" value="Sta.Lucia" />
                    <Picker.Item label="San Perfecto" value="San Perfecto" />
                    <Picker.Item label="Balong-Bato" value="Balong-Bato" />
                    <Picker.Item label="Pedro Cruz" value="Pedro Cruz" />
                    <Picker.Item label="West Crame" value="West Crame" />
                    <Picker.Item label="Corazon de Jesus" value="Corazon de Jesus" />
                    <Picker.Item label="Salapan" value="Salapan" />
                    <Picker.Item label="Onse" value="Onse" />
                    <Picker.Item label="Tibagan" value="Tibagan" />
                  </Picker>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telephone Number</Text>
                <TextInput
                  style={styles.input}
                  value={telephoneNumber}
                  onChangeText={setTelephoneNumber}
                  placeholder=""
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Number</Text>
                <TextInput
                  style={styles.input}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder=""
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Installation Date (dd-mm-yyyy)</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInputContainer}>
                  <MaterialCommunityIcons name="calendar" size={20} color="#333" style={styles.dateIcon} />
                  <TextInput
                    style={[styles.input, { flex: 1, marginLeft: 8 }]}
                    value={installationDate}
                    onChangeText={setInstallationDate}
                    placeholder="Select a date"
                    editable={false}
                  />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={installationDateObj}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Serial Number</Text>
                <TextInput
                  style={styles.input}
                  value={serialNumber}
                  onChangeText={setSerialNumber}
                  placeholder=""
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>MAC Address</Text>
                <TextInput
                  style={styles.input}
                  value={mac}
                  onChangeText={setMac}
                  placeholder=""
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Modem Images</Text>
              <View style={styles.instructionImageContainer}>
                <Image
                  source={require('../assets/images/health-center.png')}
                  style={styles.instructionImage}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Modem Front Image</Text>
                {!modemFrontImage && (
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#007bff' }]}
                    onPress={() => captureImage(setModemFrontImage)}
                  >
                    <Text style={styles.buttonText}>Capture Image</Text>
                  </TouchableOpacity>
                )}
                {modemFrontImage && (
                  <>
                    <View style={styles.imagePreviewRow}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedImageForModal(modemFrontImage);
                          setImageModalVisible(true);
                        }}
                      >
                        <Image
                          source={{ uri: modemFrontImage.uri }}
                          style={styles.imagePreview}
                        />
                      </TouchableOpacity>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {modemFrontImage.fileName ?? 'modem_front.jpg'}
                        </Text>
                        <TouchableOpacity onPress={() => setModemFrontImage(null)}>
                          <MaterialCommunityIcons name="close" size={24} color="red" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: '#007bff', marginTop: 6 }]}
                      onPress={() => captureImage(setModemFrontImage)}
                    >
                      <Text style={styles.buttonText}>Recapture</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Modem Back Image</Text>
                {!modemBackImage && (
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#007bff' }]}
                    onPress={() => captureImage(setModemBackImage)}
                  >
                    <Text style={styles.buttonText}>Capture Image</Text>
                  </TouchableOpacity>
                )}
                {modemBackImage && (
                  <>
                    <View style={styles.imagePreviewRow}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedImageForModal(modemBackImage);
                          setImageModalVisible(true);
                        }}
                      >
                        <Image
                          source={{ uri: modemBackImage.uri }}
                          style={styles.imagePreview}
                        />
                      </TouchableOpacity>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {modemBackImage.fileName ?? 'modem_back.jpg'}
                        </Text>
                        <TouchableOpacity onPress={() => setModemBackImage(null)}>
                          <MaterialCommunityIcons name="close" size={24} color="red" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: '#007bff', marginTop: 6 }]}
                      onPress={() => captureImage(setModemBackImage)}
                    >
                      <Text style={styles.buttonText}>Recapture</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Speed Test</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Add Speed Test Image(s)</Text>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#007bff' }]}
                  onPress={pickImagesForSpeedTest}
                >
                  <Text style={styles.buttonText}>Pick from Gallery</Text>
                </TouchableOpacity>
                {speedTestImages.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    {speedTestImages.map((img, i) => (
                      <View key={i} style={styles.imagePreviewRow}>
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedImageForModal(img);
                            setImageModalVisible(true);
                          }}
                        >
                          <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                        </TouchableOpacity>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.fileName} numberOfLines={1}>
                            {img.fileName ?? `speed_test_${i}.jpg`}
                          </Text>
                          <TouchableOpacity onPress={() => removeSpeedTestImage(i)}>
                            <MaterialCommunityIcons name="close" size={24} color="red" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Save</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

 
      <Modal
        visible={imageModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.fullScreenModalContainer}>
          <TouchableOpacity style={styles.fullScreenCloseButton} onPress={() => setImageModalVisible(false)}>
            <MaterialCommunityIcons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {selectedImageForModal && (
            <Image
              source={{ uri: selectedImageForModal.uri }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    elevation: 2,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  scrollContainer: {
    padding: 16,
    backgroundColor: '#F3F3F3',
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  instructionImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionImage: {
    width: '100%',
    height: 150,
    resizeMode: 'contain',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateIcon: {
    marginRight: 4,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#28a745',
    width: '100%',
    marginTop: 8,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 14,
    maxWidth: '85%',
    marginRight: 8,
  },
  imagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  // Full screen modal styles
  fullScreenModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 2,
  },
  fullScreenImage: {
    width: '90%',
    height: '80%',
  },
});
