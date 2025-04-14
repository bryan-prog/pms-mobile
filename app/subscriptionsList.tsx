import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  Linking,
} from 'react-native';
import { Ionicons, AntDesign, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AppLoading from 'expo-app-loading';
import { useFonts } from 'expo-font';

export default function SubscriptionLists() {
  const [fontsLoaded] = useFonts({
    'OpenSans-Regular': require('../assets/fonts/OpenSans-Regular.ttf'),
    'OpenSans-Bold': require('../assets/fonts/OpenSans-Bold.ttf'),
  });

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileViewerVisible, setFileViewerVisible] = useState(false);

  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  const subscriptionsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(subscriptions.length / subscriptionsPerPage);


  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(null);
  const [documentDetails, setDocumentDetails] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const authToken = await SecureStore.getItemAsync('authToken');
      const response = await axios.get(
        'http://161.49.182.141:8008/PMS_Inventory/public/api/list-of-subscriptions',
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.data && Array.isArray(response.data)) {
        setSubscriptions(response.data);
      } else {
        throw new Error('Unexpected data format from API (expected an array).');
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setFetchError('An error occurred while fetching subscription data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachedFiles = async (subscriptionId) => {
    try {
      const authToken = await SecureStore.getItemAsync('authToken');
      const response = await axios.get(
        `http://161.49.182.141:8008/PMS_Inventory/public/api/subscription-files/${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      setAttachedFiles(response.data);
    } catch (error) {
      console.error('Error fetching attached files:', error);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const s = search.toLowerCase();
    return (
      (sub.office || '').toLowerCase().includes(s) ||
      (sub.account_number || '').toLowerCase().includes(s) ||
      (sub.serial_number || '').toLowerCase().includes(s) ||
      (sub.phone_number || '').toLowerCase().includes(s) ||
      (sub.provider || '').toLowerCase().includes(s)
    );
  });

  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = (a[sortField] || '').toString().toLowerCase();
    const bValue = (b[sortField] || '').toString().toLowerCase();
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const indexOfLastSub = currentPage * subscriptionsPerPage;
  const indexOfFirstSub = indexOfLastSub - subscriptionsPerPage;
  const currentSubscriptions = sortedSubscriptions.slice(indexOfFirstSub, indexOfLastSub);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const generatePageNumbers = () => {
    const pageNumbers = [];
    const totalNumbers = 5;
    const halfTotal = Math.floor(totalNumbers / 2);
    if (totalPages < 1) return [];
    let startPage = Math.max(2, currentPage - halfTotal);
    let endPage = Math.min(totalPages - 1, currentPage + halfTotal);

    if (currentPage <= halfTotal) {
      endPage = totalNumbers;
    }
    if (currentPage + halfTotal >= totalPages) {
      startPage = totalPages - totalNumbers + 1;
    }

    startPage = Math.max(startPage, 2);
    endPage = Math.min(endPage, totalPages - 1);

    pageNumbers.push(1);
    if (startPage > 2) {
      pageNumbers.push('left-ellipsis');
    }
    for (let i = startPage; i <= endPage; i++) {
      if (i > 1 && i < totalPages) {
        pageNumbers.push(i);
      }
    }
    if (endPage < totalPages - 1) {
      pageNumbers.push('right-ellipsis');
    }
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const pageNumbers = generatePageNumbers();

  const handleRowPress = (id) => {
    setSelectedSubscriptionId((prev) => (prev === id ? null : id));
  };

  const renderSortIcon = (field) => {
    if (sortField === field) {
      return sortOrder === 'asc' ? (
        <AntDesign name="arrowup" size={14} color="#fff" />
      ) : (
        <AntDesign name="arrowdown" size={14} color="#fff" />
      );
    }
    return null;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleRowPress(item.id)}
      style={[
        styles.row,
        { minWidth: 150 * 5 },
        selectedSubscriptionId === item.id && styles.selectedRow,
      ]}
    >
      <Text style={[styles.cell, { width: 150 }]}>{item.office || '-'}</Text>
      <Text style={[styles.cell, { width: 150 }]}>{item.account_number || '-'}</Text>
      <Text style={[styles.cell, { width: 150 }]}>{item.serial_number || '-'}</Text>
      <Text style={[styles.cell, { width: 150 }]}>{item.phone_number || '-'}</Text>
      <Text style={[styles.cell, { width: 150 }]}>{item.provider || '-'}</Text>
    </TouchableOpacity>
  );

  const handleViewDocument = async () => {
    if (!selectedSubscriptionId) {
      Alert.alert('Warning', 'Please select a record first.');
      return;
    }
    try {
      const authToken = await SecureStore.getItemAsync('authToken');
      const response = await axios.get(
        `http://161.49.182.141:8008/PMS_Inventory/public/api/show-subscription/${selectedSubscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      setDocumentDetails(response.data);
   
      fetchAttachedFiles(selectedSubscriptionId);
      setModalVisible(true);
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      Alert.alert('Error', 'Failed to load subscription details.');
    }
  };


  const handleFilePress = (file) => {
  
    const extension = file.filename.split('.').pop().toLowerCase();
    const knownImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];

   
    if (knownImageExtensions.includes(extension)) {
      setSelectedFile(file);
      setFileViewerVisible(true);
    } else {
   
      const fileUrl = `http://161.49.182.141:8008/PMS_Inventory/public/files/${selectedSubscriptionId}/${file.filename}`;
      Linking.openURL(fileUrl).catch((err) => {
        console.error('Unable to open file', err);
        Alert.alert('Error', 'Cannot open the file.');
      });
    }
  };

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A52A2A" />
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'red', marginBottom: 10 }}>{fetchError}</Text>
        <TouchableOpacity onPress={fetchSubscriptions} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Subscriptions</Text>

      <View style={[styles.searchContainer, search.length > 0 && styles.searchContainerActive]}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          placeholder="Search..."
          placeholderTextColor="#8E8E93"
          style={[styles.searchInput, search.length > 0 && styles.searchInputActive]}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal style={{ marginBottom: 16 }}>
        <View style={styles.cardContainer}>
          <View style={[styles.row, styles.tableHeader, { minWidth: 150 * 5 }]}>
            <TouchableOpacity onPress={() => handleSort('office')} style={styles.headerCell}>
              <Text style={styles.tableHeaderText}>Office/Barangay</Text>
              {renderSortIcon('office')}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleSort('account_number')}
              style={styles.headerCell}
            >
              <Text style={styles.tableHeaderText}>Account Number</Text>
              {renderSortIcon('account_number')}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleSort('serial_number')}
              style={styles.headerCell}
            >
              <Text style={styles.tableHeaderText}>Serial Number</Text>
              {renderSortIcon('serial_number')}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleSort('phone_number')}
              style={styles.headerCell}
            >
              <Text style={styles.tableHeaderText}>Phone Number</Text>
              {renderSortIcon('phone_number')}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSort('provider')} style={styles.headerCell}>
              <Text style={styles.tableHeaderText}>Provider</Text>
              {renderSortIcon('provider')}
            </TouchableOpacity>
          </View>

          {currentSubscriptions.length === 0 ? (
            <View style={{ padding: 20 }}>
              <Text style={{ textAlign: 'center', color: '#333' }}>No data found.</Text>
            </View>
          ) : (
            <FlatList
              data={currentSubscriptions}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
            />
          )}
        </View>
      </ScrollView>

      <View style={styles.paginationContainer}>
        <TouchableOpacity onPress={handlePreviousPage} style={styles.paginationButton}>
          <AntDesign name="left" size={20} color={currentPage === 1 ? '#ccc' : '#2A47CB'} />
        </TouchableOpacity>

        <View style={styles.pageNumbersContainer}>
          {pageNumbers.map((number, index) => {
            if (number === 'left-ellipsis' || number === 'right-ellipsis') {
              return (
                <Text key={index} style={styles.ellipsisText}>
                  ...
                </Text>
              );
            } else {
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handlePageChange(number)}
                  style={[
                    styles.pageNumberButton,
                    currentPage === number && styles.currentPageButton,
                  ]}
                >
                  <Text
                    style={[
                      styles.pageNumberText,
                      currentPage === number && styles.currentPageText,
                    ]}
                  >
                    {number}
                  </Text>
                </TouchableOpacity>
              );
            }
          })}
        </View>

        <TouchableOpacity onPress={handleNextPage} style={styles.paginationButton}>
          <AntDesign
            name="right"
            size={20}
            color={currentPage === totalPages || totalPages === 0 ? '#ccc' : '#2A47CB'}
          />
        </TouchableOpacity>
      </View>

   
      {selectedSubscriptionId !== null && (
        <TouchableOpacity style={styles.fabGreen} onPress={handleViewDocument}>
          <MaterialIcons name="visibility" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalBackButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Subscription Details</Text>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Provider</Text>
              <TextInput
                style={styles.modalInput}
                value={documentDetails?.provider || ''}
                editable={false}
              />
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Account Name</Text>
              <TextInput
                style={styles.modalInput}
                value={documentDetails?.account_name || ''}
                editable={false}
              />
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Account Number</Text>
              <TextInput
                style={styles.modalInput}
                value={documentDetails?.account_number || ''}
                editable={false}
              />
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Serial Number</Text>
              <TextInput
                style={styles.modalInput}
                value={documentDetails?.serial_number || ''}
                editable={false}
              />
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>MAC Address</Text>
              <TextInput
                style={styles.modalInput}
                value={documentDetails?.mac_address || ''}
                editable={false}
              />
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Installation Address</Text>
              <TextInput
                style={styles.modalInput}
                value={documentDetails?.installation_address || ''}
                editable={false}
              />
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Office</Text>
              <TextInput
                style={styles.modalInput}
                value={documentDetails?.office || ''}
                editable={false}
              />
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Phone Number</Text>
              <TextInput
                style={styles.modalInput}
                value={documentDetails?.phone_number || ''}
                editable={false}
              />
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Package</Text>
              <TextInput
                style={styles.modalInput}
                value={documentDetails?.package || ''}
                editable={false}
              />
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Speed</Text>
              <TextInput
                style={styles.modalInput}
                value={documentDetails?.speed || ''}
                editable={false}
              />
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Monthly Charge</Text>
              <TextInput
                style={styles.modalInput}
                value={documentDetails?.monthly_charge || ''}
                editable={false}
              />
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Contract Term</Text>
              <TextInput
                style={styles.modalInput}
                value={documentDetails?.contract_term || ''}
                editable={false}
              />
            </View>

          
            <View style={styles.modalField}>
              <Text style={[styles.modalLabel, { marginBottom: 8 }]}>Attached Files</Text>
              {attachedFiles.length > 0 ? (
                attachedFiles.map((file) => (
                  <TouchableOpacity
                    key={file.id}
                    onPress={() => handleFilePress(file)}
                    style={styles.fileItem}
                  >
                    <Text style={styles.fileName}>{file.filename}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={{ color: '#666' }}>No files attached.</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

     
      <Modal
        visible={fileViewerVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setFileViewerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setFileViewerVisible(false)}
              style={styles.modalBackButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Attached Image</Text>
          </View>
          <View style={styles.imageContainer}>
            {selectedFile && (
              <Image
                source={{
                  uri: `http://192.168.0.56:8060/PMS_Inventory/public/files/${selectedSubscriptionId}/${selectedFile.filename}`,
                }}
                style={styles.image}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#041435',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingTop: 16,
    position: 'relative',
  },
  headerText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 10,
    fontFamily: 'OpenSans-Bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 16,
  },
  searchContainerActive: {
    borderColor: '#2A47CB',
    borderWidth: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  searchInputActive: {
    color: '#000',
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tableHeader: {
    backgroundColor: '#002244',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectedRow: {
    backgroundColor: '#DDEAFB',
  },
  headerCell: {
    width: 150,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    fontWeight: '600',
    color: '#fff',
    fontSize: 14,
    fontFamily: 'OpenSans-Bold',
    marginRight: 4,
  },
  cell: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    textAlign: 'center',
    fontSize: 13,
    color: '#333',
    fontFamily: 'OpenSans-Regular',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    paddingBottom: 10,
  },
  paginationButton: {
    padding: 8,
  },
  pageNumbersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageNumberButton: {
    marginHorizontal: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
    backgroundColor: '#f1f1f1',
  },
  currentPageButton: {
    backgroundColor: '#002244',
  },
  pageNumberText: {
    color: '#2A47CB',
    fontSize: 14,
  },
  currentPageText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  ellipsisText: {
    fontSize: 16,
    marginHorizontal: 5,
    color: '#333',
  },
  fabGreen: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: '#17B169',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    right: 20,
    bottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A47CB',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  modalBackButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
  },
  modalContent: {
    padding: 20,
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f1f1f1',
    color: '#333',
  },
  fileItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  fileName: {
    fontSize: 14,
    color: '#2A47CB',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
