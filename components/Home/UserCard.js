import { TouchableOpacity, View, Image, Text } from "react-native";
import { accent } from "../../constants/style";
import userIcon from "../../assets/user.png";
import { useNavigation } from "@react-navigation/native";
export default ({ index, user }) => {
  const navigation = useNavigation();

  return (
    <>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("Messages", { recepientId: user._id })
        }
        style={{
          width: "90%",
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          borderTopWidth: index == 0 ? 0 : 1,
          borderColor: accent,
          padding: 20,
          gap: 40,
        }}
      >
        <View
          style={{
            height: 50,
            width: 50,
            overflow: "hidden",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "white",
            borderRadius: 90,
          }}
        >
          <Image
            style={{
              height: 35,
              width: 35,
              objectFit: "cover",
            }}
            source={userIcon}
          />
        </View>
        <View>
          <Text
            style={{
              color: accent,
              fontSize: 20,
              fontWeight: "700",
            }}
          >
            {user.name}
          </Text>
          <Text
            style={{
              color: accent,
              fontSize: 20,
              fontWeight: "400",
            }}
          >
            {user.email}
          </Text>
        </View>
      </TouchableOpacity>
    </>
  );
};
