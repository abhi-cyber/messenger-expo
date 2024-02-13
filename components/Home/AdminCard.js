import { View, Image, Text, TouchableOpacity } from "react-native";
import adminIcon from "../../assets/admin.png";
import { accent, secondary, tertiary, vw } from "../../constants/style";

export default ({ isRequestSent, handleRequestButton, admin }) => {
  return (
    <>
      <View
        style={{
          height: 180,
          width: 180,
          overflow: "hidden",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
          borderRadius: 90,
        }}
      >
        <Image
          style={{
            height: 205,
            width: 205,
            objectFit: "cover",
          }}
          source={adminIcon}
        />
      </View>
      <Text
        style={{
          color: accent,
          fontSize: 35,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        Request Admin to connect
      </Text>
      <TouchableOpacity
        onPress={!isRequestSent ? handleRequestButton : null}
        style={{
          width: vw(50),
          backgroundColor: !isRequestSent ? secondary : tertiary,
          paddingVertical: 15,
          marginTop: 20,
          borderRadius: 14,
        }}
      >
        <Text
          style={{
            color: !isRequestSent ? "white" : accent,
            fontSize: 20,
            fontWeight: "900",
            textAlign: "center",
          }}
        >
          {!isRequestSent ? "Request Admin" : "Request Sent"}
        </Text>
      </TouchableOpacity>
    </>
  );
};
