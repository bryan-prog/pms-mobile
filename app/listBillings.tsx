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
} from 'react-native';
import { Ionicons, AntDesign, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AppLoading from 'expo-app-loading';
import { useFonts } from 'expo-font';
import { Picker } from '@react-native-picker/picker';

export default function BillingStatements() {
  const [fontsLoaded] = useFonts({
    'OpenSans-Regular': require('../assets/fonts/OpenSans-Regular.ttf'),
    'OpenSans-Bold': require('../assets/fonts/OpenSans-Bold.ttf'),
  });


  const [allBillings, setAllBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);


  const [search, setSearch] = useState('');


  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  const documentsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);


  const [selectedType, setSelectedType] = useState('');

  const [selectedBillingId, setSelectedBillingId] = useState(null);


  const [billingDetails, setBillingDetails] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchBillings();
  }, []);


  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedType]);

  const fetchBillings = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const authToken = await SecureStore.getItemAsync('authToken');
      const response = await axios.get(
        'http://161.49.182.141:8008/PMS_Inventory/public/api/list-billing',
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data) {
        const { portal_accounts = [], non_portal_accounts = [] } = response.data;
    
        const combined = [...portal_accounts, ...non_portal_accounts];
        setAllBillings(combined);
      } else {
        throw new Error('Unexpected data format from API.');
      }
    } catch (error) {
      console.error('Error fetching billing statements:', error);
      setFetchError('An error occurred while fetching billing statements.');
    } finally {
      setLoading(false);
    }
  };

 
  const filteredDocuments = allBillings.filter((item) => {
  
    if (!selectedType) {
      return false;
    }
 
    if (item.type !== selectedType) {
      return false;
    }
 
    const s = search.toLowerCase();
    return (
      (item.office || '').toLowerCase().includes(s) ||
      (item.billing_no || '').toLowerCase().includes(s) ||
      (item.invoice_date || '').toLowerCase().includes(s) ||
      (item.payment_due_date || '').toLowerCase().includes(s) ||
      (item.summary || '').toLowerCase().includes(s) ||
      (item.note || '').toLowerCase().includes(s)
    );
  });


  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = a[sortField]?.toString().toLowerCase() || '';
    const bValue = b[sortField]?.toString().toLowerCase() || '';
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

 
  const totalPages = Math.ceil(sortedDocuments.length / documentsPerPage);
  const indexOfLastDoc = currentPage * documentsPerPage;
  const indexOfFirstDoc = indexOfLastDoc - documentsPerPage;
  const currentDocuments = sortedDocuments.slice(indexOfFirstDoc, indexOfLastDoc);

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
    setSelectedBillingId((prev) => (prev === id ? null : id));
  };

 
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
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
        { minWidth: 150 * 6 },
        selectedBillingId === item.id && styles.selectedRow,
      ]}
    >
      <Text style={[styles.cell, { width: 150 }]}>{item.office}</Text>
      <Text style={[styles.cell, { width: 150 }]}>{item.billing_no}</Text>
      <Text style={[styles.cell, { width: 150 }]}>{item.invoice_date}</Text>
      <Text style={[styles.cell, { width: 150 }]}>{item.payment_due_date}</Text>
      <Text style={[styles.cell, { width: 150 }]}>{item.summary}</Text>
      <Text style={[styles.cell, { width: 150 }]}>{item.note}</Text>
    </TouchableOpacity>
  );

  const handleViewDocument = async () => {
    if (!selectedBillingId) {
      Alert.alert('Warning', 'Please select a record first.');
      return;
    }
    try {
      const authToken = await SecureStore.getItemAsync('authToken');
      const response = await axios.get(
        `http://161.49.182.141:8008/PMS_Inventory/public/api/show-billing/${selectedBillingId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.data && response.data.billing_statement) {
        setBillingDetails(response.data);
        setModalVisible(true);
      } else {
        Alert.alert('Error', 'Unexpected response from server.');
      }
    } catch (error) {
      console.error('Error fetching billing details:', error);
      Alert.alert('Error', 'Failed to load billing details.');
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
        <TouchableOpacity onPress={fetchBillings} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Billing Statements</Text>

    
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedType}
          onValueChange={(value) => {
            setSelectedType(value);
            setSelectedBillingId(null); 
          }}
          style={styles.picker}
        >
          <Picker.Item label="----" value="" />
          <Picker.Item label="Portal" value="portal" />
          <Picker.Item label="Non-portal" value="nonportal" />
        </Picker>
      </View>

   
      {!selectedType ? (
        <View style={styles.emptySelectionContainer}>
          <Ionicons name="information-circle-outline" size={28} color="#999" />
          <Text style={styles.emptySelectionText}>
            Please select a type (Portal or Non-portal) from the dropdown.
          </Text>
        </View>
      ) : (
        <>
         
          <View
            style={[styles.searchContainer, search.length > 0 && styles.searchContainerActive]}
          >
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
              <View style={[styles.row, styles.tableHeader, { minWidth: 150 * 6 }]}>
                <TouchableOpacity onPress={() => handleSort('office')} style={styles.headerCell}>
                  <Text style={styles.tableHeaderText}>Office</Text>
                  {renderSortIcon('office')}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleSort('billing_no')} style={styles.headerCell}>
                  <Text style={styles.tableHeaderText}>Billing No.</Text>
                  {renderSortIcon('billing_no')}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSort('invoice_date')}
                  style={styles.headerCell}
                >
                  <Text style={styles.tableHeaderText}>Invoice Date</Text>
                  {renderSortIcon('invoice_date')}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSort('payment_due_date')}
                  style={styles.headerCell}
                >
                  <Text style={styles.tableHeaderText}>Payment Due Date</Text>
                  {renderSortIcon('payment_due_date')}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleSort('summary')} style={styles.headerCell}>
                  <Text style={styles.tableHeaderText}>Summary</Text>
                  {renderSortIcon('summary')}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleSort('note')} style={styles.headerCell}>
                  <Text style={styles.tableHeaderText}>Note</Text>
                  {renderSortIcon('note')}
                </TouchableOpacity>
              </View>

              {currentDocuments.length === 0 ? (
                <View style={{ padding: 20 }}>
                  <Text style={{ textAlign: 'center', color: '#333' }}>No data found.</Text>
                </View>
              ) : (
                <FlatList
                  data={currentDocuments}
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

      
          {selectedBillingId !== null && (
            <TouchableOpacity style={styles.fabGreen} onPress={handleViewDocument}>
              <MaterialIcons name="visibility" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </>
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
            <Text style={styles.modalTitle}>Billing Details</Text>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {billingDetails ? (
              <>
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Office</Text>
                  <Text style={styles.modalValue}>
                    {billingDetails.billing_statement.office || 'N/A'}
                  </Text>
                </View>

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Billing No.</Text>
                  <Text style={styles.modalValue}>
                    {billingDetails.billing_statement.billing_no || 'N/A'}
                  </Text>
                </View>

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Invoice Date</Text>
                  <Text style={styles.modalValue}>
                    {billingDetails.billing_statement.invoice_date || 'N/A'}
                  </Text>
                </View>

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Payment Due Date</Text>
                  <Text style={styles.modalValue}>
                    {billingDetails.billing_statement.payment_due_date || 'N/A'}
                  </Text>
                </View>

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Summary</Text>
                  <Text style={styles.modalValue}>
                    {billingDetails.billing_statement.summary || 'N/A'}
                  </Text>
                </View>

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Note</Text>
                  <Text style={styles.modalValue}>
                    {billingDetails.billing_statement.note || 'N/A'}
                  </Text>
                </View>
              </>
            ) : (
              <ActivityIndicator size="large" color="#A52A2A" />
            )}
          </ScrollView>
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
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 52,
    width: '100%',
  },
  emptySelectionContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  emptySelectionText: {
    color: '#666',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
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
    textAlign: 'center',
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
  modalValue: {
    fontSize: 14,
    color: '#555',
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 6,
  },
});
