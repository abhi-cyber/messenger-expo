import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';

const OtpVerification = ({ onCompleteVerification }) => {
  const [otp, setOtp] = useState('');

  const handleVerify = () => {
    // You may want to add validation for the OTP (e.g., length check)
    if (otp.length === 6) {
      onCompleteVerification(otp);
    } else {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP');
    }
    console.log("OTP entered:", otp);
  };

  return (
    <View>
      <Text>Enter the OTP sent to your email</Text>
      <TextInput
        value={otp}
        onChangeText={setOtp}
        keyboardType="numeric"
        maxLength={6}
      />
      <Pressable onPress={handleVerify}>
        <Text>Verify</Text>
      </Pressable>
    </View>
  );
};

export default OtpVerification;
