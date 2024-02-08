import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  TouchableOpacity,
} from "react-native";
import styleUtils, {
  secondary,
  tertiary,
  accent,
  vw,
} from "../../constants/style";

const VerifyOTP = ({ onCompleteVerification }) => {
  const [otp, setOtp] = useState("");

  const handleVerify = () => {
    // You may want to add validation for the OTP (e.g., length check)
    if (otp.length != 6)
      return Alert.alert("Invalid OTP", "Please enter a valid 6-digit OTP");

    onCompleteVerification(otp);
    console.log("OTP entered:", otp);
  };

  return (
    <View style={{ marginTop: 60, gap: 20, width: vw(75) }}>
      <Text style={[styleUtils.SubText, { color: secondary }]}>
        Enter the OTP sent to your email
      </Text>
      <TextInput
        value={otp}
        onChangeText={(text) => setOtp(text)}
        keyboardType="numeric"
        maxLength={6}
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
        placeholder="Enter OTP"
      />
      <TouchableOpacity
        onPress={handleVerify}
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
          Verify OTP
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default VerifyOTP;
