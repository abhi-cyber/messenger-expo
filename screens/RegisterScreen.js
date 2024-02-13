import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Alert } from "react-native";
import { Register, VerifyOTP } from "../components/registration";
import styleUtils from "../constants/style";
import axios from "axios";
import { apiUrl, appName } from "../constants/consts";
import { useNavigation } from "@react-navigation/native";

const RegisterScreen = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [userType, setUserType] = useState("Corporate");
  const [companyName, setCompanyName] = useState("");
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigation = useNavigation();

  const handleRegister = async () => {
    const user = { name, email, password, isAdmin };
    console.log(user);

    try {
      // Send a POST request to the backend API to initiate registration
      const response = await axios.post(apiUrl + "/register", user);
      // Check if the registration initiation was successful
      if (response.status != 200)
        return Alert.alert(
          "Registration Error",
          "An error occurred while initiating registration"
        );

      Alert.alert(
        "Registration successful",
        "You have initiated the registration process. Check your email for the OTP."
      );
      // Show OTP verification component only when initiation is successful
      setShowOtpVerification(true);
    } catch (error) {
      Alert.alert("Registration Error", "An error occurred while registering");
      console.log("Registration initiation failed", error);
    }
  };

  const handleVerificationComplete = async (enteredCode) => {
    try {
      // Send the verification code to the backend for validation
      const verificationResponse = await axios.post(apiUrl + "/verify-otp", {
        email,
        otp: enteredCode,
      });

      // Check if the verification was successful
      if (verificationResponse.status != 200)
        return Alert.alert(
          "Verification failed",
          "Please check your verification code and try again"
        );

      Alert.alert(
        "Email verified",
        "Your email has been successfully verified"
      );
    } catch (error) {
      console.error("Axios error during OTP verification:", error);
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
    setPhoneNumber(null);
    setUserType("");
    setIsAdmin(false);
  };

  const handleLoginButton = () => {
    navigation.navigate("Login");
  };

  return (
    <View style={[styleUtils.container, styleUtils.primaryScreen]}>
      <KeyboardAvoidingView>
        <View style={styleUtils.center}>
          <Text style={styleUtils.Headers}>Register</Text>
          <Text style={[styleUtils.SubText, { marginTop: 20 }]}>
            Register to {appName}
          </Text>
        </View>
        {!showOtpVerification ? (
          <Register
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            userType={userType}
            setUserType={setUserType}
            companyName={companyName}
            setCompanyName={setCompanyName}
            isAdmin={isAdmin}
            setIsAdmin={setIsAdmin}
            handleRegister={handleRegister}
            handleLoginButton={handleLoginButton}
          />
        ) : (
          <VerifyOTP onCompleteVerification={handleVerificationComplete} />
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

export default RegisterScreen;
