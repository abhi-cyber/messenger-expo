import { useState } from "react";
import styleUtils, {
  secondary,
  tertiary,
  accent,
  vw,
} from "../../constants/style";
import { View, Text, TextInput, TouchableOpacity } from "react-native";

const Register = ({
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  phoneNumber,
  setPhoneNumber,
  userType,
  setUserType,
  companyName,
  setCompanyName,
  handleRegister,
  handleLoginButton,
}) => {
  const [slide, setSlide] = useState(1);
  return (
    <View style={{ marginTop: 60, gap: 20, width: vw(75) }}>
      {slide == 1 && (
        <>
          <Text style={[styleUtils.SubText, { color: secondary }]}>Name</Text>
          <TextInput
            value={name}
            onChangeText={(text) => setName(text)}
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
            placeholder="Enter Your Name"
          />
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
            Phone Number
          </Text>
          <TextInput
            value={phoneNumber}
            onChangeText={(text) => setPhoneNumber(text)}
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
            placeholder="Enter Your Phone Number"
          />
          <TouchableOpacity
            onPress={() => setSlide(2)}
            style={{
              width: "100%",
              backgroundColor: tertiary,
              paddingVertical: 15,
              marginTop: 20,
              borderWidth: 2,
              borderColor: secondary,
              borderRadius: 14,
            }}
          >
            <Text
              style={{
                color: accent,
                fontSize: 20,
                fontWeight: "900",
                textAlign: "center",
              }}
            >
              Next
            </Text>
          </TouchableOpacity>
        </>
      )}
      {slide == 2 && (
        <>
          <View style={{ flexDirection: "row", gap: 26, marginVertical: 10 }}>
            <Text
              onPress={() => setUserType("Corporate")}
              style={[
                styleUtils.SubText,
                {
                  borderColor: secondary,
                  borderWidth: 2,
                  borderRadius: 14,
                  padding: 10,
                  textAlign: "center",
                  borderStyle: userType != "Corporate" ? "dashed" : "solid",
                },
              ]}
            >
              Corporate
            </Text>
            <Text
              onPress={() => setUserType("Personal")}
              style={[
                styleUtils.SubText,
                {
                  borderColor: secondary,
                  borderWidth: 2,
                  borderRadius: 14,
                  padding: 10,
                  textAlign: "center",
                  borderStyle: userType != "Personal" ? "dashed" : "solid",
                },
              ]}
            >
              Personal
            </Text>
          </View>
          {userType == "Corporate" && (
            <>
              <Text style={[styleUtils.SubText, { color: secondary }]}>
                Company Name
              </Text>
              <TextInput
                value={companyName}
                onChangeText={(text) => setCompanyName(text)}
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
                placeholder="Your Company Name"
              />
            </>
          )}
          <TouchableOpacity
            onPress={() => setSlide(3)}
            style={{
              width: "100%",
              backgroundColor: tertiary,
              paddingVertical: 15,
              marginTop: 20,
              borderWidth: 2,
              borderColor: secondary,
              borderRadius: 14,
            }}
          >
            <Text
              style={{
                color: accent,
                fontSize: 20,
                fontWeight: "900",
                textAlign: "center",
              }}
            >
              Next
            </Text>
          </TouchableOpacity>
        </>
      )}
      {slide == 3 && (
        <>
          <Text style={[styleUtils.SubText, { color: secondary }]}>
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={(text) => setPassword(text)}
            // secureTextEntry={true}
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
          <Text style={[styleUtils.SubText, { color: secondary }]}>
            Confirm Password
          </Text>
          <TextInput
            value={confirmPassword}
            onChangeText={(text) => setConfirmPassword(text)}
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
            placeholder="Confirm Password"
          />
          <TouchableOpacity
            onPress={handleRegister}
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
              Register
            </Text>
          </TouchableOpacity>
        </>
      )}
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <Text style={{ textAlign: "center", color: "gray", fontSize: 16 }}>
          Already Have an account?{"  "}
        </Text>
        <TouchableOpacity onPress={handleLoginButton}>
          <Text
            style={{
              textAlign: "center",
              color: "gray",
              fontSize: 16,
              textDecorationLine: "underline",
              color: secondary,
            }}
          >
            Sign in
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Register;
