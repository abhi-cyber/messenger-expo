import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiUrl } from "../constants/consts";
import { useUserId } from "../UserContext";
import jwt_decode from "jwt-decode";
import styleUtils, {
  secondary,
  tertiary,
  accent,
  vw,
} from "../constants/style";
import {
  KeyboardAvoidingView,
  TouchableOpacity,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUserId, setIsAdmin } = useUserId();
  const navigation = useNavigation();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          navigation.replace("Home");
        }
      } catch (error) {
        console.log("error", error);
      }
    };

    checkLoginStatus();
  }, []);

  const handleLogin = () => {
    const user = { email, password };

    axios
      .post(apiUrl + "/login", user)
      .then((response) => {
        const token = response.data.token;
        AsyncStorage.setItem("authToken", token);
        const decodedToken = jwt_decode(token);
        setUserId(decodedToken.userId);
        setIsAdmin(decodedToken.isAdmin);
        navigation.replace("Home");
      })
      .catch((error) => {
        Alert.alert("Login Error", "Invalid email or password");
        console.log("Login Error", error);
      });
  };

  const handleSignUpButton = () => {
    navigation.navigate("Register");
  };

  return (
    <View style={[styleUtils.container, styleUtils.primaryScreen]}>
      <KeyboardAvoidingView>
        <View style={styleUtils.center}>
          <Text style={styleUtils.Headers}>Sign In</Text>
          <Text style={[styleUtils.SubText, { marginTop: 20 }]}>
            Sign In to Your Account
          </Text>
        </View>
        <View style={{ marginTop: 60, gap: 30, width: vw(75) }}>
          <Text style={[styleUtils.SubText, { color: secondary }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={(text) => setEmail(text.toLowerCase())}
            style={[
              styleUtils.SubText,
              {
                borderBottomColor: tertiary,
                borderBottomWidth: 2,
                paddingVertical: 10,
                color: "white",
              },
            ]}
            placeholderTextColor={accent}
            placeholder="Enter Your Email"
          />
          <Text style={[styleUtils.SubText, { color: secondary }]}>
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={(text) => setPassword(text)}
            secureTextEntry={true}
            style={[
              styleUtils.SubText,
              {
                borderBottomColor: tertiary,
                borderBottomWidth: 2,
                paddingVertical: 10,
                color: "white",
              },
            ]}
            placeholderTextColor={accent}
            placeholder="Password"
          />
          <TouchableOpacity
            onPress={handleLogin}
            style={{
              width: "100%",
              backgroundColor: secondary,
              paddingVertical: 15,
              marginTop: 20,
              borderRadius: 14,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 20,
                fontWeight: "900",
                textAlign: "center",
              }}
            >
              Login
            </Text>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <Text style={{ textAlign: "center", color: "gray", fontSize: 16 }}>
              Dont't have an account?{"  "}
            </Text>
            <TouchableOpacity onPress={handleSignUpButton}>
              <Text
                style={{
                  textAlign: "center",
                  color: "gray",
                  fontSize: 16,
                  textDecorationLine: "underline",
                  color: secondary,
                }}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;
