// RegisterScreen.js
import React, {useState} from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Pressable,
  Alert,
  Switch,
} from "react-native";
import OtpVerification from "../components/OtpVerification";
import axios from "axios";
import {useNavigation} from "@react-navigation/native";

const RegisterScreen = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [image, setImage] = useState("");
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const navigation = useNavigation();

  const handleRegister = async () => {
    const user = {
      name: name,
      email: email,
      password: password,
      image: image,
      isAdmin: isAdmin,
    };

    try {
      // Send a POST request to the backend API to initiate registration
      const response = await axios.post(
        "https://api.knightangle.com/register",
        user
      );

      // Check if the registration initiation was successful
      if (response.status === 200) {
        Alert.alert(
          "Registration successful",
          "You have initiated the registration process. Check your email for the OTP."
        );

        // Show OTP verification component only when initiation is successful
        setShowOtpVerification(true);
      } else {
        Alert.alert(
          "Registration Error",
          "An error occurred while initiating registration"
        );
      }
    } catch (error) {
      Alert.alert("Registration Error", "An error occurred while registering");
      console.log("Registration initiation failed", error);
    }
  };

  const handleVerificationComplete = async (enteredCode) => {
    try {
      // Send the verification code to the backend for validation
      const verificationResponse = await axios.post(
        "https://api.knightangle.com/verify-otp",
        {
          email: email,
          otp: enteredCode,
        }
      );

      // Check if the verification was successful
      if (verificationResponse.status === 200) {
        Alert.alert(
          "Email verified",
          "Your email has been successfully verified"
        );
      } else {
        Alert.alert(
          "Verification failed",
          "Please check your verification code and try again"
        );
      }
    } catch (error) {
      console.error("Axios error during OTP verification:", error);
      // Log the error details here
      Alert.alert(
        "Verification failed",
        "An error occurred during OTP verification"
      );
    }

    // Reset the state and hide OTP verification component
    setShowOtpVerification(false);
    setName("");
    setEmail("");
    setPassword("");
    setImage("");
  };

  return (
    <View>
      <KeyboardAvoidingView>
        <View>
          <Text>Register</Text>
          <Text>Register To your Account</Text>
        </View>

        <View>
          <View>
            <Text>Name</Text>
            <TextInput
              value={name}
              onChangeText={(text) => setName(text)}
              style={{
                borderBottomColor: "gray",
                borderBottomWidth: 1,
                marginVertical: 10,
                width: 300,
              }}
              placeholder="Enter your name"
            />
          </View>

          <View>
            <Text>Email</Text>
            <TextInput
              value={email}
              onChangeText={(text) => setEmail(text)}
              style={{
                borderBottomColor: "gray",
                borderBottomWidth: 1,
                marginVertical: 10,
                width: 300,
              }}
              placeholder="enter Your Email"
            />
          </View>

          <View
            style={{flexDirection: "row", alignItems: "center", marginTop: 10}}>
            <Text>Register as Admin?</Text>
            <Switch
              value={isAdmin}
              onValueChange={(value) => setIsAdmin(value)}
              style={{marginLeft: 10}}
            />
          </View>

          <View>
            <Text>Password</Text>
            <TextInput
              value={password}
              onChangeText={(text) => setPassword(text)}
              secureTextEntry={true}
              style={{
                borderBottomColor: "gray",
                borderBottomWidth: 1,
                marginVertical: 10,
                width: 300,
              }}
              placeholder="Passowrd"
            />
          </View>

          <View>
            <Text>Image</Text>
            <TextInput
              value={image}
              onChangeText={(text) => setImage(text)}
              style={{
                borderBottomColor: "gray",
                borderBottomWidth: 1,
                marginVertical: 10,
                width: 300,
              }}
              placeholder="Image"
            />
          </View>

          <Pressable
            onPress={handleRegister}
            style={{
              width: 200,
              backgroundColor: "#4A55A2",
              padding: 15,
              marginTop: 50,
              marginLeft: "auto",
              marginRight: "auto",
              borderRadius: 6,
            }}>
            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "bold",
                textAlign: "center",
              }}>
              Register
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.goBack()}
            style={{marginTop: 15}}>
            <Text style={{textAlign: "center", color: "gray", fontSize: 16}}>
              Already Have an account? Sign in
            </Text>
          </Pressable>
        </View>

        {showOtpVerification && (
          <OtpVerification
            onCompleteVerification={handleVerificationComplete}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

export default RegisterScreen;
