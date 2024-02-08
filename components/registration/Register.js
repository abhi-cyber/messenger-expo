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
  handleRegister,
  handleLoginButton,
}) => {
  return (
    <View style={{ marginTop: 60, gap: 20, width: vw(75) }}>
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
        onChangeText={(text) => setEmail(text)}
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
      <Text style={[styleUtils.SubText, { color: secondary }]}>Password</Text>
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
