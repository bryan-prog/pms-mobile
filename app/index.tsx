import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";

import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import NetInfo from "@react-native-community/netinfo";
import Icon from "react-native-vector-icons/FontAwesome";
import axios from "axios";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";

SplashScreen.preventAutoHideAsync(); 

const { width, height } = Dimensions.get("window");


async function saveToken(token: string) {
  await SecureStore.setItemAsync("authToken", token, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

async function saveUserInfo(user: any) {
  await SecureStore.setItemAsync("userInfo", JSON.stringify(user), {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

export default function LoginScreen() {
  const router = useRouter();


  const [isAppReady, setIsAppReady] = useState(false);
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [isConnected, setIsConnected] = useState(true);
  const [showNoInternetModal, setShowNoInternetModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

 
  useEffect(() => {
    async function prepareApp() {
      try {
       
        await Font.loadAsync({
          "DelaGothicOne-Regular": require("../assets/fonts/DelaGothicOne-Regular.ttf"),
          "OpenSans-Regular": require("../assets/fonts/OpenSans-Regular.ttf"),
          "OpenSans-Bold": require("../assets/fonts/OpenSans-Bold.ttf"),
        });

        
        const token = await SecureStore.getItemAsync("authToken");
        if (token) {
         
          router.replace("/home");
        }
      } catch (err) {
        console.log("Error in prepareApp:", err);
      } finally {
        setIsAppReady(true);
      }
    }
    prepareApp();
  }, []);


  useEffect(() => {
    async function hideSplash() {
      if (isAppReady) {
        await SplashScreen.hideAsync();
      }
    }
    hideSplash();
  }, [isAppReady]);

 
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
      setShowNoInternetModal(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

 
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

 
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);


  if (!isAppReady) {
    return null;
  }

 
  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }
    if (!isConnected) {
      setError("No internet connection.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        "http://161.49.182.141:8008/PMS_Inventory/public/api/login",
        { username, password },
        { headers: { Accept: "application/json" } }
      );

      const { user, accessToken } = response.data;
      if (accessToken) {
       
        await saveToken(accessToken);
        if (user) {
          await saveUserInfo(user);
        }
        router.replace("/home");
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        setError("Incorrect username or password.");
      } else {
        setError("Failed to connect. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

 
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#1b2560" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <StatusBar backgroundColor="#000000" barStyle="light-content" />

           
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("../assets/images/bagong-pilipinas.png")}
                  style={styles.logo}
                />
                <Image
                  source={require("../assets/images/sjc.png")}
                  style={styles.logo}
                />
                <Image
                  source={require("../assets/images/icto.png")}
                  style={styles.logo}
                />
              </View>
              <Text style={styles.title}>Welcome!</Text>
            </View>

   
            <View style={styles.formContainer}>
              <Text style={styles.subTitle}>PMS INVENTORY SYSTEM</Text>

              <View style={styles.inputContainer}>
                <Icon
                  name="user"
                  size={width * 0.05}
                  color="#888"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="username"
                  placeholderTextColor="#888"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUserName}
                />
              </View>

              <View style={styles.inputContainer}>
                <Icon
                  name="lock"
                  size={width * 0.05}
                  color="#888"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="password"
                  placeholderTextColor="#888"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon
                    name={showPassword ? "eye" : "eye-slash"}
                    size={width * 0.05}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>
            </View>

       
            {!isKeyboardVisible && (
              <View style={styles.floatingLogoContainer}>
                <TouchableOpacity
                  onPress={() => setModalVisible(true)}
                  style={styles.footerLogoContainer}
                >
                  <Image
                    source={require("../assets/images/npc-2.png")}
                    style={styles.footerLogo}
                  />
                </TouchableOpacity>
              </View>
            )}

         
            <Modal
              animationType="fade"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(!modalVisible)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setModalVisible(false)}
              >
                <View style={styles.modalContent}>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>X</Text>
                  </TouchableOpacity>
                  <Image
                    source={require("../assets/images/npc.jpg")}
                    style={styles.npcModalImage}
                  />
                </View>
              </TouchableOpacity>
            </Modal>

         
            <Modal
              transparent={true}
              visible={showNoInternetModal}
              animationType="fade"
              onRequestClose={() => setShowNoInternetModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.noInternetModal}>
                  <MaterialCommunityIcons
                    name="wifi-off"
                    size={width * 0.12}
                    color="#ff0000"
                    style={styles.noWifiIcon}
                  />
                  <Text style={styles.noInternetText}>
                    No Internet Connection
                  </Text>
                  <TouchableOpacity
                    style={styles.okButton}
                    onPress={() => setShowNoInternetModal(false)}
                  >
                    <Text style={styles.okButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  logoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.02,
  },
  logo: {
    width: width * 0.2,
    height: width * 0.2,
    marginHorizontal: width * 0.01,
    resizeMode: "contain",
  },
  title: {
    color: "#fff",
    fontSize: width * 0.07,
    fontFamily: "DelaGothicOne-Regular",
  },
  formContainer: {
    flex: 3,
    backgroundColor: "#fff",
    borderTopLeftRadius: width * 0.13,
    borderTopRightRadius: width * 0.13,
    paddingHorizontal: width * 0.05,
    justifyContent: "flex-start",
    paddingTop: height * 0.07,
    paddingBottom: height * 0.05,
  },
  subTitle: {
    textAlign: "center",
    color: "#1b2560",
    fontSize: width * 0.055,
    fontFamily: "OpenSans-Bold",
    marginBottom: height * 0.03,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: height * 0.07,
    backgroundColor: "#F8F9FC",
    borderRadius: width * 0.02,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.02,
  },
  icon: { marginRight: width * 0.02 },
  input: {
    flex: 1,
    fontSize: width * 0.045,
    color: "#333",
    fontFamily: "OpenSans-Regular",
    paddingLeft: width * 0.02,
  },
  errorText: {
    color: "red",
    marginBottom: height * 0.01,
    fontSize: width * 0.04,
    textAlign: "center",
    fontFamily: "OpenSans-Regular",
  },
  loginButton: {
    height: height * 0.07,
    backgroundColor: "#a52a2a",
    borderRadius: width * 0.07,
    justifyContent: "center",
    alignItems: "center",
    marginTop: height * 0.015,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: width * 0.05,
    fontFamily: "OpenSans-Bold",
  },
  floatingLogoContainer: {
    position: "absolute",
    bottom: height * 0.07,
    alignSelf: "center",
    zIndex: 10,
  },
  footerLogoContainer: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: (width * 0.3) / 2,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#1b2560",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: height * 0.005 },
    shadowOpacity: 0.25,
    shadowRadius: width * 0.02,
    elevation: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  footerLogo: {
    width: "70%",
    height: "70%",
    resizeMode: "contain",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: width * 0.85,
    height: height * 0.4,
    backgroundColor: "#fff",
    borderRadius: width * 0.02,
    padding: width * 0.05,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: height * 0.015,
    right: width * 0.04,
    backgroundColor: "#ddd",
    borderRadius: width * 0.04,
    width: width * 0.08,
    height: width * 0.08,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: "#000",
  },
  npcModalImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  noInternetModal: {
    width: width * 0.8,
    backgroundColor: "#fff",
    borderRadius: width * 0.02,
    justifyContent: "center",
    alignItems: "center",
    padding: width * 0.05,
  },
  noWifiIcon: { marginBottom: height * 0.02 },
  noInternetText: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: "#000",
    marginBottom: height * 0.02,
    textAlign: "center",
  },
  okButton: {
    backgroundColor: "#4B0082",
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.015,
    borderRadius: width * 0.02,
  },
  okButtonText: {
    color: "#fff",
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
});
