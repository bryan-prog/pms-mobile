import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  DrawerLayoutAndroid,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import axios from 'axios';

import TerminalDocuments from './healthcenterlist';
import SubscriptionLists from './subscriptionsList';
import ListBillings from './listBillings';

import ProfileModal from './ProfileModal';

const { width: screenWidth } = Dimensions.get('window');

export default function Home() {
  const drawerRef = useRef(null);

  const [fontsLoaded] = useFonts({
    'OpenSans-Regular': require('../assets/fonts/OpenSans-Regular.ttf'),
    'OpenSans-Bold': require('../assets/fonts/OpenSans-Bold.ttf'),
  });

  const [userData, setUserData] = useState(null);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  const [showSubscriptionsSubMenu, setShowSubscriptionsSubMenu] = useState(false);
  const [showBillingSubMenu, setShowBillingSubMenu] = useState(false);
  const [showHealthCentersSubMenu, setShowHealthCentersSubMenu] = useState(false);
  const [showPmsSubMenu, setShowPmsSubMenu] = useState(false);

  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userString = await SecureStore.getItemAsync('userInfo');
        if (userString) {
          setUserData(JSON.parse(userString));
        }
      } catch (error) {
        console.log('Error reading user info:', error);
      }
    };
    loadUserInfo();
  }, []);

  const handleProfileUpdate = async (newData) => {
    try {
   
      setUserData(newData);
    
      await SecureStore.setItemAsync('userInfo', JSON.stringify(newData));
    } catch (error) {
      console.log('Error updating user info in SecureStore:', error);
    }
  };

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        await axios.post(
          'http://161.49.182.141:8008/PMS_Inventory/public/api/logout',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.log('Logout Error:', error);
      Alert.alert('Logout Error', 'An error occurred while logging out.');
    } finally {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userInfo');
      setLoadingLogout(false);
      router.replace('/');
    }
  };

  
  const renderDashboard = () => (
    <ScrollView style={styles.dashboardScroll}>
      {userData && (
        <View style={styles.userCard}>
          <Text style={styles.userCardTitle}>Welcome to PMS APP,</Text>
          <Text style={styles.userCardName}>{userData.name}!</Text>
        </View>
      )}
      <View style={styles.cardsContainer}>
       
        <TouchableOpacity
          style={styles.card}
          onPress={() => {
           
            router.push('/subscriptionsForm');
          }}
        >
          <View style={[styles.iconBackground, { backgroundColor: '#FD3A4A' }]}>
            <MaterialCommunityIcons name="book" size={40} color="#fff" />
          </View>
          <Text style={styles.cardTitle}>SUBSCRIPTIONS</Text>
        </TouchableOpacity>

   
        <TouchableOpacity
          style={styles.card}
          onPress={() => {
       
            setCurrentScreen('listBillings');
          }}
        >
          <View style={[styles.iconBackground, { backgroundColor: '#FFA726' }]}>
            <MaterialCommunityIcons name="currency-usd" size={40} color="#fff" />
          </View>
          <Text style={styles.cardTitle}>BILLING</Text>
        </TouchableOpacity>


        <TouchableOpacity
          style={styles.card}
          onPress={() => {
       
            router.push('/healthcenterform');
          }}
        >
          <View style={[styles.iconBackground, { backgroundColor: '#43A047' }]}>
            <MaterialCommunityIcons name="hospital-building" size={40} color="#fff" />
          </View>
          <Text style={styles.cardTitle}>HEALTH CENTERS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            
            router.push('/pmsform')
          }}
        >
          <View style={[styles.iconBackground, { backgroundColor: '#1E88E5' }]}>
            <MaterialCommunityIcons name="file-chart" size={40} color="#fff" />
          </View>
          <Text style={styles.cardTitle}>PMS REPORTS</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderSubscriptionsList = () => <SubscriptionLists />;
  const renderHealthCenterList = () => <TerminalDocuments />;
  const renderListOfBillings = () => <ListBillings />;

  const renderContent = () => {
    if (currentScreen === 'dashboard') {
      return renderDashboard();
    } else if (currentScreen === 'subscriptionslist') {
      return renderSubscriptionsList();
    } else if (currentScreen === 'healthcenterlist') {
      return renderHealthCenterList();
    } else if (currentScreen === 'listBillings') {
      return renderListOfBillings();
    }
  };

  const renderBottomNavBar = () => (
    <View style={styles.bottomNavBar}>
      <TouchableOpacity style={styles.navBarItem} onPress={() => setCurrentScreen('dashboard')}>
        <MaterialCommunityIcons
          name="home"
          size={30}
          color={currentScreen === 'dashboard' ? '#4B3AE8' : '#000'}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navBarItem}
        onPress={() => setCurrentScreen('subscriptionslist')}
      >
        <MaterialCommunityIcons
          name="book"
          size={30}
          color={currentScreen === 'subscriptionslist' ? '#4B3AE8' : '#000'}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navBarItem}
        onPress={() => setCurrentScreen('healthcenterlist')}
      >
        <MaterialCommunityIcons
          name="hospital-building"
          size={30}
          color={currentScreen === 'healthcenterlist' ? '#4B3AE8' : '#000'}
        />
      </TouchableOpacity>
    </View>
  );

  const navigationView = () => (
    <View style={styles.sidebar}>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/images/sjc.png')} style={styles.logoImage} />
      </View>
      <View style={styles.separator} />

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setCurrentScreen('dashboard');
          drawerRef.current?.closeDrawer();
        }}
      >
        <View style={styles.menuItemRow}>
          <MaterialCommunityIcons name="view-dashboard" size={20} color="#fff" />
          <Text style={styles.menuText}>Home</Text>
        </View>
        <MaterialCommunityIcons name="home" size={20} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setShowSubscriptionsSubMenu(!showSubscriptionsSubMenu)}
      >
        <View style={styles.menuItemRow}>
          <MaterialCommunityIcons name="book" size={20} color="#fff" />
          <Text style={styles.menuText}>Subscriptions</Text>
        </View>
        <MaterialCommunityIcons
          name={showSubscriptionsSubMenu ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#fff"
        />
      </TouchableOpacity>
      {showSubscriptionsSubMenu && (
        <View style={styles.subMenu}>
          <TouchableOpacity
            style={styles.subMenuItem}
            onPress={() => {
              console.log('Navigating to Subscription Form...');
              router.push('/subscriptionsForm');
              drawerRef.current?.closeDrawer();
            }}
          >
            <MaterialCommunityIcons name="file-document" size={16} color="#fff" />
            <Text style={styles.subMenuText}>Subscriptions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.subMenuItem}
            onPress={() => {
              console.log('Navigating to List of Subscriptions...');
              setCurrentScreen('subscriptionslist');
              drawerRef.current?.closeDrawer();
            }}
          >
            <MaterialCommunityIcons name="file-document" size={16} color="#fff" />
            <Text style={styles.subMenuText}>List of Subscriptions</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setShowBillingSubMenu(!showBillingSubMenu)}
      >
        <View style={styles.menuItemRow}>
          <MaterialCommunityIcons name="file-document" size={20} color="#fff" />
          <Text style={styles.menuText}>Billing Statements</Text>
        </View>
        <MaterialCommunityIcons
          name={showBillingSubMenu ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#fff"
        />
      </TouchableOpacity>
      {showBillingSubMenu && (
        <View style={styles.subMenu}>
          <TouchableOpacity
            style={styles.subMenuItem}
            onPress={() => {
              router.push('/portalAccounts');
              console.log('Navigating to Portal Account Numbers...');
              drawerRef.current?.closeDrawer();
            }}
          >
            <MaterialCommunityIcons name="account-box" size={16} color="#fff" />
            <Text style={styles.subMenuText}>Portal Acc. Numbers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.subMenuItem}
            onPress={() => {
              router.push('/nonPortalAccounts');
              console.log('Navigating to Non-Portal Account Numbers...');
              drawerRef.current?.closeDrawer();
            }}
          >
            <MaterialCommunityIcons name="account-box-multiple" size={16} color="#fff" />
            <Text style={styles.subMenuText}>Non-Portal Acc. Numbers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.subMenuItem}
            onPress={() => {
              console.log('Navigating to List of Billings...');
              setCurrentScreen('listBillings');
              drawerRef.current?.closeDrawer();
            }}
          >
            <MaterialCommunityIcons name="file-document-outline" size={16} color="#fff" />
            <Text style={styles.subMenuText}>List of Billings</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setShowHealthCentersSubMenu(!showHealthCentersSubMenu)}
      >
        <View style={styles.menuItemRow}>
          <MaterialCommunityIcons name="hospital-building" size={20} color="#fff" />
          <Text style={styles.menuText}>Health Centers</Text>
        </View>
        <MaterialCommunityIcons
          name={showHealthCentersSubMenu ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#fff"
        />
      </TouchableOpacity>
      {showHealthCentersSubMenu && (
        <View style={styles.subMenu}>
          <TouchableOpacity
            style={styles.subMenuItem}
            onPress={() => {
              console.log('Navigating to Health Center Form...');
              router.push('/healthcenterform');
              drawerRef.current?.closeDrawer();
            }}
          >
            <MaterialCommunityIcons name="file-plus" size={16} color="#fff" />
            <Text style={styles.subMenuText}>Health Center Form</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.subMenuItem}
            onPress={() => {
              setCurrentScreen('healthcenterlist');
              drawerRef.current?.closeDrawer();
            }}
          >
            <MaterialCommunityIcons name="file-multiple" size={16} color="#fff" />
            <Text style={styles.subMenuText}>List of Health Centers</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setShowPmsSubMenu(!showPmsSubMenu)}
      >
        <View style={styles.menuItemRow}>
          <MaterialCommunityIcons name="file-chart" size={20} color="#fff" />
          <Text style={styles.menuText}>PMS</Text>
        </View>
        <MaterialCommunityIcons
          name={showPmsSubMenu ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#fff"
        />
      </TouchableOpacity>
      {showPmsSubMenu && (
        <View style={styles.subMenu}>
          <TouchableOpacity
            style={styles.subMenuItem}
            onPress={() => {
              console.log('Navigating to PMS Forms...');
              router.push('/pmsform')
              drawerRef.current?.closeDrawer();
            }}
          >
            <MaterialCommunityIcons name="file-multiple-outline" size={16} color="#fff" />
            <Text style={styles.subMenuText}>PMS Forms</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.subMenuItem}
            onPress={() => {
              console.log('Navigating to Reporting...');
             
              drawerRef.current?.closeDrawer();
            }}
          >
            <MaterialCommunityIcons name="file-table" size={16} color="#fff" />
            <Text style={styles.subMenuText}>Reporting</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={loadingLogout}
      >
        {loadingLogout ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <MaterialCommunityIcons name="logout" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <DrawerLayoutAndroid
      ref={drawerRef}
      drawerWidth={250}
      drawerPosition="left"
      renderNavigationView={navigationView}
    >
      <View style={styles.container}>
   
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => drawerRef.current?.openDrawer()}>
            <MaterialCommunityIcons name="menu" size={30} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowProfileModal(true)}>
            <MaterialCommunityIcons name="account-circle" size={35} color="#000" />
          </TouchableOpacity>
        </View>

     
        <View style={styles.contentContainer}>{renderContent()}</View>

      
        {renderBottomNavBar()}

      
        <ProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onProfileUpdate={handleProfileUpdate}
        />
      </View>
    </DrawerLayoutAndroid>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
  },
  dashboardScroll: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  userCard: {
    backgroundColor: '#1a1110',
    margin: 15,
    borderRadius: 15,
    padding: 15,
  },
  userCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userCardName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  sidebar: {
    flex: 1,
    backgroundColor: '#C0C0C0',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logoImage: {
    width: 150,
    height: 50,
    resizeMode: 'contain',
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: '#808080',
    marginBottom: 10,
  },
  menuItem: {
    backgroundColor: '#4267B2',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  subMenu: {
    marginLeft: 20,
    marginBottom: 10,
  },
  subMenuItem: {
    backgroundColor: '#5B7BC3',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  subMenuText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
  },
  logoutButton: {
    backgroundColor: '#D9534F',
    borderRadius: 6,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  bottomNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  navBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
