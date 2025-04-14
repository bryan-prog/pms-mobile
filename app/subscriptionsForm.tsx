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
  Linking,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';

interface PickedFile {
  uri: string;
  width?: number;   
  height?: number;  
  type?: string;   
  fileName?: string;
  mimeType?: string; 
}

interface Office {
  id: number;
  location: string;
  office: string;
  dept_code: string;
  dept_head: string | null;
  dept_head_position: string | null;
}

const { width } = Dimensions.get('window');

export default function SubscriptionsFormModal() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(true);


  const [provider, setProvider] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [locationInstallation, setLocationInstallation] = useState('');
  const [officeStorage, setOfficeStorage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [subscriptionPackage, setSubscriptionPackage] = useState('');
  const [bandSpeed, setBandSpeed] = useState('');
  const [monthlyCharge, setMonthlyCharge] = useState('');
  const [contractTerm, setContractTerm] = useState('');


  const [attachments, setAttachments] = useState<PickedFile[]>([]);

 
  const [loading, setLoading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageForModal, setSelectedImageForModal] = useState<PickedFile | null>(null);


  const [officeModalVisible, setOfficeModalVisible] = useState(false);
  const [officeList, setOfficeList] = useState<Office[]>([]);
  const [searchQuery, setSearchQuery] = useState('');


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

  
  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const response = await axios.get<Office[]>(
          'http://161.49.182.141:8008/PMS_Inventory/public/api/offices',
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.status === 200) {
          setOfficeList(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch offices:', error);
        Alert.alert('Error', 'Failed to fetch office data.');
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


  const captureAttachmentFromCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const { uri, width, height, type, fileName } = result.assets[0];
       
        const mimeType = 'image/jpeg';
        const fileCaptured: PickedFile = {
          uri,
          width,
          height,
          type: 'image',
          fileName: fileName ?? `capture_${Date.now()}.jpg`,
          mimeType,
        };
        setAttachments((prev) => [...prev, fileCaptured]);
      }
    } catch (error: any) {
      console.error('captureAttachmentFromCamera error:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
  };


  const pickAttachmentsFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
      });
      if (!result.canceled && result.assets) {
        const files = result.assets.map((asset) => ({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: 'image',
          fileName: asset.fileName ?? `attachment_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
        }));
        setAttachments((prev) => [...prev, ...files]);
      }
    } catch (error: any) {
      console.error('pickAttachmentsFromGallery error:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };

 
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const newFile: PickedFile = {
          uri: file.uri,
          fileName: file.name || `doc_${Date.now()}`,
          type: 'document',
          mimeType: file.mimeType || '*/*',
        };
        setAttachments((prev) => [...prev, newFile]);
      }
    } catch (error: any) {
      console.error('pickDocument error:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

 
  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
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
     
      formData.append('provider', provider.trim());
      formData.append('acct_name', accountName.trim());
      formData.append('acct_number', accountNumber.trim());
      formData.append('location_installation', locationInstallation.trim());
      formData.append('office', officeStorage.trim());
      formData.append('phone_number', phoneNumber.trim());
      formData.append('serial_number', serialNumber.trim());
      formData.append('mac_address', macAddress.trim());
      formData.append('package', subscriptionPackage.trim());
      formData.append('speed', bandSpeed.trim());
      formData.append('monthly_charge', monthlyCharge.trim());
      formData.append('contract_term', contractTerm.trim());

      
      attachments.forEach((file, idx) => {
        formData.append('filename[]', {
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
          name: file.fileName ?? `attachment_${idx}.dat`,
        } as any);
      });

      const response = await axios.post(
        'http://161.49.182.141:8008/PMS_Inventory/public/api/store-subscriptions',
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
        Alert.alert('Success', 'Subscription data successfully posted!');
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


  const filteredOffices = officeList.filter((item) =>
    item.office.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <MaterialCommunityIcons name="file-document-edit" size={24} color="#228B22" />
              <Text style={styles.headerTitle}>Internet and Telephone </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer}>
         
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Subscription Details</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Provider</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={provider}
                    onValueChange={(itemValue) => setProvider(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="----" value="" />
                    <Picker.Item label="Globe" value="Globe" />
                    <Picker.Item label="Converge" value="Converge" />
                    <Picker.Item label="PLDT" value="PLDT" />
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Name</Text>
                <TextInput
                  style={styles.input}
                  value={accountName}
                  onChangeText={setAccountName}
                  placeholder=""
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
                <Text style={styles.label}>Location of Installation</Text>
                <TextInput
                  style={styles.input}
                  value={locationInstallation}
                  onChangeText={setLocationInstallation}
                  placeholder=""
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Office / Barangay</Text>
                <TouchableOpacity
                  style={[styles.input, { justifyContent: 'center' }]}
                  onPress={() => setOfficeModalVisible(true)}
                >
                  <Text style={{ color: officeStorage ? '#000' : '#888' }}>
                    {officeStorage ? officeStorage : 'Select Office'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder=""
                  keyboardType="phone-pad"
                />
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
                  value={macAddress}
                  onChangeText={setMacAddress}
                  placeholder=""
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Package</Text>
                <TextInput
                  style={styles.input}
                  value={subscriptionPackage}
                  onChangeText={setSubscriptionPackage}
                  placeholder=""
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Band Speed</Text>
                <TextInput
                  style={styles.input}
                  value={bandSpeed}
                  onChangeText={setBandSpeed}
                  placeholder=""
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Monthly Charge</Text>
                <TextInput
                  style={styles.input}
                  value={monthlyCharge}
                  onChangeText={setMonthlyCharge}
                  placeholder=""
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contract Term (months)</Text>
                <TextInput
                  style={styles.input}
                  value={contractTerm}
                  onChangeText={setContractTerm}
                  placeholder=""
                  keyboardType="numeric"
                />
              </View>
            </View>

         
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Attachments</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Add file(s) or image(s)</Text>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#007bff', marginBottom: 8 }]}
                  onPress={captureAttachmentFromCamera}
                >
                  <MaterialCommunityIcons
                    name="camera"
                    size={20}
                    color="#FFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.buttonText}>Capture from Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#007bff', marginBottom: 8 }]}
                  onPress={pickAttachmentsFromGallery}
                >
                  <MaterialCommunityIcons
                    name="file-image-plus"
                    size={20}
                    color="#FFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.buttonText}>Pick from Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#007bff' }]}
                  onPress={pickDocument}
                >
                  <MaterialCommunityIcons
                    name="file-upload"
                    size={20}
                    color="#FFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.buttonText}>Upload File</Text>
                </TouchableOpacity>
              </View>

            
              {attachments.length > 0 && (
                <View style={styles.attachmentsContainer}>
                  {attachments.map((file, index) => {
                    const isImage =
                      file.mimeType?.startsWith('image') || file.type === 'image';
                    return (
                      <View key={index} style={styles.attachmentItem}>
                      
                        {isImage ? (
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedImageForModal(file);
                              setImageModalVisible(true);
                            }}
                            style={styles.attachmentThumbnailWrapper}
                          >
                            <Image
                              source={{ uri: file.uri }}
                              style={styles.attachmentThumbnail}
                            />
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.attachmentIconWrapper}>
                            <MaterialCommunityIcons
                              name="file-document-outline"
                              size={36}
                              color="#666"
                            />
                          </View>
                        )}

                    
                        <View style={styles.attachmentDetails}>
                          <Text
                            style={styles.attachmentFileName}
                            numberOfLines={1}
                            onPress={() => {
                              Linking.openURL(file.uri).catch((err) => {
                                console.error('Cannot open file URI:', err);
                                Alert.alert('Error', 'Cannot open this file URI.');
                              });
                            }}
                          >
                            {file.fileName ?? `attachment_${index}.file`}
                          </Text>
                          <TouchableOpacity
                            style={styles.attachmentRemoveButton}
                            onPress={() => removeAttachment(index)}
                          >
                            <MaterialCommunityIcons name="close-circle" size={24} color="#e74c3c" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
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
          <TouchableOpacity
            style={styles.fullScreenCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
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

    
      <Modal
        visible={officeModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setOfficeModalVisible(false)}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => setOfficeModalVisible(false)}
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <MaterialCommunityIcons name="office-building" size={24} color="#228B22" />
              <Text style={styles.headerTitle}>Select Office</Text>
            </View>
          </View>
          <View style={{ padding: 16 }}>
            <TextInput
              placeholder="Search office..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.input, { marginBottom: 12 }]}
            />
            <ScrollView>
              {filteredOffices.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.officeItem}
                  onPress={() => {
                    setOfficeStorage(item.office);
                    setOfficeModalVisible(false);
                  }}
                >
                  <Text style={styles.officeText}>{item.office}</Text>
                  <Text style={styles.officeSubText}>{item.location}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
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


  attachmentsContainer: {
    marginTop: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECF9FF',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  attachmentThumbnailWrapper: {
    marginRight: 12,
  },
  attachmentThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
    resizeMode: 'cover',
  },
  attachmentIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  attachmentDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentFileName: {
    flexShrink: 1,
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  attachmentRemoveButton: {
    marginLeft: 12,
  },

 
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

  officeItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  officeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  officeSubText: {
    fontSize: 14,
    color: '#666',
  },
});
