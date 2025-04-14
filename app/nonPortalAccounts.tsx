import React, { useState, useEffect } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

export default function NonPortalFormModal() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(true);


  const [office, setOffice] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [serviceSummary, setServiceSummary] = useState('');
  const [note, setNote] = useState('');

  
  const [showInvoiceDatePicker, setShowInvoiceDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);


  const [loading, setLoading] = useState(false);

  
  useEffect(() => {
    const backAction = () => {
      router.replace('/');
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [router]);

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

  const handleClose = () => {
    setModalVisible(false);
    router.replace('/');
  };

  const formatDate = (dateObj: Date) => {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const onInvoiceDateChange = (event: any, selectedDate?: Date) => {
    setShowInvoiceDatePicker(false);
    if (selectedDate) {
      setInvoiceDate(selectedDate);
    }
  };

  const onDueDateChange = (event: any, selectedDate?: Date) => {
    setShowDueDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
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

      const invoiceDateString = formatDate(invoiceDate);
      const dueDateString = formatDate(dueDate);

      const formData = new FormData();
      formData.append('office', office.trim());
      formData.append('account_number', accountNumber.trim());
      formData.append('invoice_date', invoiceDateString);
      formData.append('due_date', dueDateString);
      formData.append('service_summary', serviceSummary.trim());
      formData.append('note', note.trim());

      const response = await axios.post(
        'http://161.49.182.141:8008/PMS_Inventory/public/api/store-non',
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', response.data.message);
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
              <MaterialCommunityIcons name="file-document-edit" size={24} color="#228B22" />
              <Text style={styles.headerTitle}>Non-Portal Account</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.card}>
          
              <View style={styles.cardTitleWrapper}>
                <MaterialCommunityIcons
                  name="file-document-edit-outline"
                  size={20}
                  color="#333"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.cardTitle}>Non-Portal Account Details</Text>
              </View>
              <View style={styles.separator} />

           
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Office</Text>
                <TextInput
                  style={styles.input}
                  value={office}
                  onChangeText={setOffice}
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
                <Text style={styles.label}>Invoice Date</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateContainer]}
                  onPress={() => setShowInvoiceDatePicker(true)}
                >
                  <Text
                    style={[
                      styles.dateText,
                      { color: invoiceDate ? '#000' : '#888' },
                    ]}
                  >
                    {invoiceDate ? formatDate(invoiceDate) : 'dd-mm-yyyy'}
                  </Text>
                  <MaterialCommunityIcons name="calendar" size={20} />
                </TouchableOpacity>
              </View>

     
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Due Date</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateContainer]}
                  onPress={() => setShowDueDatePicker(true)}
                >
                  <Text
                    style={[
                      styles.dateText,
                      { color: dueDate ? '#000' : '#888' },
                    ]}
                  >
                    {dueDate ? formatDate(dueDate) : 'dd-mm-yyyy'}
                  </Text>
                  <MaterialCommunityIcons name="calendar" size={20} />
                </TouchableOpacity>
              </View>

           
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Service Summary</Text>
                <TextInput
                  style={styles.input}
                  value={serviceSummary}
                  onChangeText={setServiceSummary}
                  placeholder=""
                />
              </View>

          
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Note</Text>
                <TextInput
                  style={styles.input}
                  value={note}
                  onChangeText={setNote}
                  placeholder=""
                />
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


      {showInvoiceDatePicker && (
        <DateTimePicker
          value={invoiceDate}
          mode="date"
          display="calendar"
          onChange={onInvoiceDateChange}
        />
      )}
      {showDueDatePicker && (
        <DateTimePicker
          value={dueDate}
          mode="date"
          display="calendar"
          onChange={onDueDateChange}
        />
      )}
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
  cardTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: '#ccc',
    marginBottom: 14,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 14,
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
});
