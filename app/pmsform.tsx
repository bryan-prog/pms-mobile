import React, { useState, useEffect, useMemo } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

export default function PmsFormModal() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(true);


  const [locationArray, setLocationArray] = useState([]);
  const [caseSizeArray, setCaseSizeArray] = useState([]);
  const [opSysArray, setOpSysArray] = useState([]);
  const [ramSizeArray, setRamSizeArray] = useState([]);
  const [ssdSizeArray, setSsdSizeArray] = useState([]);  
  const [hddSizeArray, setHddSizeArray] = useState([]);  
  const [monitorSizeArray, setMonitorSizeArray] = useState([]);
  const [monitor2SizeArray, setMonitor2SizeArray] = useState([]);


  const [allDataLoaded, setAllDataLoaded] = useState(false);


  const [location, setLocation] = useState(''); 
  const [office, setOffice] = useState('');
  const [officeUser, setOfficeUser] = useState('');
  
  
  const [systemModel, setSystemModel] = useState('');


  const [caseModel, setCaseModel] = useState('');
  const [caseSize, setCaseSize] = useState('');
  const [opSys, setOpSys] = useState('');
  const [processor, setProcessor] = useState('');
  const [processorVer, setProcessorVer] = useState('');
  const [ramSize, setRamSize] = useState('');
  const [gpu, setGpu] = useState('');  
  const [biosDate, setBiosDate] = useState<Date>(new Date());
  const [ipAddress, setIpAddress] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [storageTypeSsd, setStorageTypeSsd] = useState('');
  const [storageSize, setStorageSize] = useState('');  
  const [storageTypeHdd, setStorageTypeHdd] = useState('');
  const [hddStorageSize, setHddStorageSize] = useState(''); 
  const [monitorModel, setMonitorModel] = useState('');
  const [monitorSize, setMonitorSize] = useState('');
  const [monitor2Model, setMonitor2Model] = useState('');
  const [monitor2Size, setMonitor2Size] = useState('');
  const [keyboardAssessment, setKeyboardAssessment] = useState('');
  const [mouseAssessment, setMouseAssessment] = useState('');
  const [remarks, setRemarks] = useState('');


  const [gaams, setGaams] = useState('');
  const [gsms, setGsms] = useState('');
  const [toims, setToims] = useState('');
  const [rptas, setRptas] = useState('');
  const [bpltas, setBpltas] = useState('');
  const [osca, setOsca] = useState('');
  const [bpms, setBpms] = useState('');
  const [peso, setPeso] = useState('');
  const [pdao, setPdao] = useState('');
  const [legitas, setLegitas] = useState('');


  const [showBiosDatePicker, setShowBiosDatePicker] = useState(false);


  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const backAction = () => {
      router.replace('/');
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [router]);


  useEffect(() => {
    const fetchCreateData = async () => {
      try {
        const token = await SecureStore.getItemAsync('authToken');
        if (!token) {
          Alert.alert('Error', 'No authentication token found. Please log in.');
          return;
        }

        const response = await axios.get(
          'http://161.49.182.141:8008/PMS_Inventory/public/api/create-data',
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          const createData = response.data;

          
          setLocationArray(createData.location || []);
          setCaseSizeArray(createData.case_size || []);
          setOpSysArray(createData.op_sys || []);
          setRamSizeArray(createData.ram_size || []);
          setSsdSizeArray(createData.storage_size || []);
          setHddSizeArray(createData.hdd_storage_size || []);
          setMonitorSizeArray(createData.monitor_size || []);
          setMonitor2SizeArray(createData.monitor2_size || []);

          setAllDataLoaded(true);
        } else {
          Alert.alert('Error', 'Failed to load data from create-data endpoint.');
        }
      } catch (error) {
        console.log('fetchCreateData error:', error);
        Alert.alert('Error', 'An unexpected error occurred while fetching data.');
      }
    };

    fetchCreateData();
  }, []);


  const uniqueLocations = useMemo(() => {
    if (!locationArray || locationArray.length === 0) return [];
    const allLocs = locationArray.map(item => item.location);
    return Array.from(new Set(allLocs)); 
  }, [locationArray]);


  const filteredOffices = useMemo(() => {
    if (!location || !locationArray) return [];
    return locationArray.filter(item => item.location === location);
  }, [location, locationArray]);


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


  const onBiosDateChange = (event: any, selectedDate?: Date) => {
    setShowBiosDatePicker(false);
    if (selectedDate) {
      setBiosDate(selectedDate);
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

      const biosDateString = formatDate(biosDate);

      
      const formData = new FormData();
      formData.append('location', location.trim());
      formData.append('office', office.trim());
      formData.append('office_user', officeUser.trim());
      formData.append('system_model', systemModel.trim());
      formData.append('case_model', caseModel.trim());
      formData.append('case_size', caseSize.trim());
      formData.append('op_sys', opSys.trim());
      formData.append('processor', processor.trim());
      formData.append('processor_ver', processorVer.trim());
      formData.append('ram_size', ramSize.trim());
      formData.append('gpu', gpu.trim());
      formData.append('bios_date', biosDateString);
      formData.append('ip_address', ipAddress.trim());
      formData.append('mac_address', macAddress.trim());
      formData.append('storage_type_ssd', storageTypeSsd.trim());
      formData.append('storage_size', storageSize.trim()); 
      formData.append('storage_type_hdd', storageTypeHdd.trim());
      formData.append('hdd_storage_size', hddStorageSize.trim());
      formData.append('monitor_model', monitorModel.trim());
      formData.append('monitor_size', monitorSize.trim());
      formData.append('monitor2_model', monitor2Model.trim());
      formData.append('monitor2_size', monitor2Size.trim());
      formData.append('keyboard_assessment', keyboardAssessment.trim());
      formData.append('mouse_assessment', mouseAssessment.trim());
      formData.append('remarks', remarks.trim());
  
      formData.append('gaams', gaams.trim());
      formData.append('gsms', gsms.trim());
      formData.append('toims', toims.trim());
      formData.append('rptas', rptas.trim());
      formData.append('bpltas', bpltas.trim());
      formData.append('osca', osca.trim());
      formData.append('bpms', bpms.trim());
      formData.append('peso', peso.trim());
      formData.append('pdao', pdao.trim());
      formData.append('legitas', legitas.trim());

     
      const response = await axios.post(
        'http://161.49.182.141:8008/PMS_Inventory/public/api/store-inventory',
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
        router.replace('/');
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
              <MaterialCommunityIcons
                name="file-document-edit"
                size={24}
                color="#228B22"
              />
              <Text style={styles.headerTitle}>PMS Inventory</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer}>
           
            <View style={styles.card}>
              <View style={styles.cardTitleWrapper}>
                <MaterialCommunityIcons
                  name="map-marker-radius-outline"
                  size={20}
                  color="#333"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.cardTitle}>Location & Office Info</Text>
              </View>
              <View style={styles.separator} />

           
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={location}
                    onValueChange={(val) => {
                      setLocation(val);
                    
                      setOffice('');
                    }}
                    enabled={allDataLoaded}
                    style={styles.pickerStyle}
                  >
                    <Picker.Item label="----" value="" />
                    {uniqueLocations.map((loc, idx) => (
                      <Picker.Item label={loc} value={loc} key={idx} />
                    ))}
                  </Picker>
                </View>
              </View>

            
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Office</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={office}
                    onValueChange={(val) => setOffice(val)}
                    enabled={location !== ''}
                    style={styles.pickerStyle}
                  >
                    <Picker.Item label="----" value="" />
                    {filteredOffices.map((offItem) => (
                      <Picker.Item
                        key={offItem.id}
                        label={offItem.office}
                        value={offItem.office}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

           
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Office User</Text>
                <TextInput
                  style={styles.input}
                  value={officeUser}
                  onChangeText={setOfficeUser}
                  placeholder=""
                />
              </View>
            </View>

          
            <View style={styles.card}>
              <View style={styles.cardTitleWrapper}>
                <MaterialCommunityIcons
                  name="laptop"
                  size={20}
                  color="#333"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.cardTitle}>System Model</Text>
              </View>
              <View style={styles.separator} />

              <View style={styles.radioRow}>
              
                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => setSystemModel('Desktop')}
                >
                  <Ionicons
                    name={
                      systemModel === 'Desktop'
                        ? 'radio-button-on'
                        : 'radio-button-off'
                    }
                    size={20}
                    color="#333"
                  />
                  <Text style={styles.radioText}>Desktop</Text>
                </TouchableOpacity>

           
                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => setSystemModel('Laptop')}
                >
                  <Ionicons
                    name={
                      systemModel === 'Laptop'
                        ? 'radio-button-on'
                        : 'radio-button-off'
                    }
                    size={20}
                    color="#333"
                  />
                  <Text style={styles.radioText}>Laptop</Text>
                </TouchableOpacity>
              </View>
            </View>

          
            <View style={styles.card}>
              <View style={styles.cardTitleWrapper}>
                <MaterialCommunityIcons
                  name="file-document-edit-outline"
                  size={20}
                  color="#333"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.cardTitle}>Additional PMS Form Details</Text>
              </View>
              <View style={styles.separator} />

            
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Motherboard Model</Text>
                <TextInput
                  style={styles.input}
                  value={caseModel}
                  onChangeText={setCaseModel}
                  placeholder=""
                />
              </View>

           
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Case Size</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={caseSize}
                    onValueChange={(val) => setCaseSize(val)}
                    enabled={allDataLoaded}
                    style={styles.pickerStyle}
                  >
                    <Picker.Item label="----" value="" />
                    {caseSizeArray.map((item, idx) => (
                      <Picker.Item
                        key={idx}
                        label={item.case_size}
                        value={item.case_size}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

          
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Operating System</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={opSys}
                    onValueChange={(val) => setOpSys(val)}
                    enabled={allDataLoaded}
                    style={styles.pickerStyle}
                  >
                    <Picker.Item label="----" value="" />
                    {opSysArray.map((item, idx) => (
                      <Picker.Item
                        key={idx}
                        label={item.op_sys}
                        value={item.op_sys}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

             
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Processor</Text>
                <TextInput
                  style={styles.input}
                  value={processor}
                  onChangeText={setProcessor}
                  placeholder=""
                />
              </View>

             
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Processor Version</Text>
                <TextInput
                  style={styles.input}
                  value={processorVer}
                  onChangeText={setProcessorVer}
                  placeholder=""
                />
              </View>

             
              <View style={styles.inputGroup}>
                <Text style={styles.label}>RAM Size</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={ramSize}
                    onValueChange={(val) => setRamSize(val)}
                    enabled={allDataLoaded}
                    style={styles.pickerStyle}
                  >
                    <Picker.Item label="----" value="" />
                    {ramSizeArray.map((item, idx) => (
                      <Picker.Item
                        key={idx}
                        label={item.ram_size}
                        value={item.ram_size}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

             
              <View style={styles.inputGroup}>
                <Text style={styles.label}>GPU</Text>
                <TextInput
                  style={styles.input}
                  value={gpu}
                  onChangeText={setGpu}
                  placeholder=""
                />
              </View>

            
              <View style={styles.inputGroup}>
                <Text style={styles.label}>BIOS Date</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateContainer]}
                  onPress={() => setShowBiosDatePicker(true)}
                >
                  <Text
                    style={[
                      styles.dateText,
                      { color: biosDate ? '#000' : '#888' },
                    ]}
                  >
                    {biosDate ? formatDate(biosDate) : 'dd-mm-yyyy'}
                  </Text>
                  <MaterialCommunityIcons name="calendar" size={20} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>IP Address</Text>
                <TextInput
                  style={styles.input}
                  value={ipAddress}
                  onChangeText={setIpAddress}
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
                <Text style={styles.label}>Storage Type (SSD)</Text>
                <TextInput
                  style={styles.input}
                  value={storageTypeSsd}
                  onChangeText={setStorageTypeSsd}
                  placeholder=""
                />
              </View>

              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>SSD Size</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={storageSize}
                    onValueChange={(val) => setStorageSize(val)}
                    enabled={allDataLoaded}
                    style={styles.pickerStyle}
                  >
                    <Picker.Item label="----" value="" />
                    {ssdSizeArray.map((item, idx) => (
                      <Picker.Item
                        key={idx}
                        label={item.storage_ssd_size}
                        value={item.storage_ssd_size}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

        
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Storage Type (HDD)</Text>
                <TextInput
                  style={styles.input}
                  value={storageTypeHdd}
                  onChangeText={setStorageTypeHdd}
                  placeholder=""
                />
              </View>

        
              <View style={styles.inputGroup}>
                <Text style={styles.label}>HDD Size</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={hddStorageSize}
                    onValueChange={(val) => setHddStorageSize(val)}
                    enabled={allDataLoaded}
                    style={styles.pickerStyle}
                  >
                    <Picker.Item label="----" value="" />
                    {hddSizeArray.map((item, idx) => (
                      <Picker.Item
                        key={idx}
                        label={item.storage_ssd_size}
                        value={item.storage_ssd_size}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

        
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Monitor Model</Text>
                <TextInput
                  style={styles.input}
                  value={monitorModel}
                  onChangeText={setMonitorModel}
                  placeholder=""
                />
              </View>

       
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Monitor Size</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={monitorSize}
                    onValueChange={(val) => setMonitorSize(val)}
                    enabled={allDataLoaded}
                    style={styles.pickerStyle}
                  >
                    <Picker.Item label="----" value="" />
                    {monitorSizeArray.map((item, idx) => (
                      <Picker.Item
                        key={idx}
                        label={item.monitor_size}
                        value={item.monitor_size}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

       
              <View style={styles.inputGroup}>
                <Text style={styles.label}>2nd Monitor Model</Text>
                <TextInput
                  style={styles.input}
                  value={monitor2Model}
                  onChangeText={setMonitor2Model}
                  placeholder=""
                />
              </View>

     
              <View style={styles.inputGroup}>
                <Text style={styles.label}>2nd Monitor Size</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={monitor2Size}
                    onValueChange={(val) => setMonitor2Size(val)}
                    enabled={allDataLoaded}
                    style={styles.pickerStyle}
                  >
                    <Picker.Item label="----" value="" />
                    {monitor2SizeArray.map((item, idx) => (
                      <Picker.Item
                        key={idx}
                        label={item.monitor_size}
                        value={item.monitor_size}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

           
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Keyboard Assessment</Text>
                <TextInput
                  style={styles.input}
                  value={keyboardAssessment}
                  onChangeText={setKeyboardAssessment}
                  placeholder=""
                />
              </View>

          
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mouse Assessment</Text>
                <TextInput
                  style={styles.input}
                  value={mouseAssessment}
                  onChangeText={setMouseAssessment}
                  placeholder=""
                />
              </View>

           
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Remarks</Text>
                <TextInput
                  style={styles.input}
                  value={remarks}
                  onChangeText={setRemarks}
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

     
      {showBiosDatePicker && (
        <DateTimePicker
          value={biosDate}
          mode="date"
          display="calendar"
          onChange={onBiosDateChange}
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
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'flex-start',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#333',
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
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  pickerStyle: {
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
});
