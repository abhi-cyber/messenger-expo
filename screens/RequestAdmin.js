import { Text, View, Pressable, Image, TouchableOpacity } from "react-native";
import { useLayoutEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
// import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { appName } from "../constants/consts";
import styleUtils, {
  accent,
  secondary,
  tertiary,
  vw,
} from "../constants/style";
import adminIcon from "../assets/admin.png";

const HomeScreen = () => {
  const navigation = useNavigation();
  const [isRequestSent, setIsRequestSent] = useState(false);

  useLayoutEffect(() => {
    const handleLogout = async () => {
      try {
        // Clear the token from AsyncStorage
        await AsyncStorage.removeItem("authToken");
        // Navigate back to the Login screen
        navigation.replace("Login");
      } catch (error) {
        console.error("Error logging out:", error);
      }
    };

    navigation.setOptions({
      headerTitle: appName,
      headerStyle: { backgroundColor: secondary },
      headerTitleStyle: { fontWeight: "600", color: "white" },
      headerRight: () => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* <Ionicons
            onPress={() => navigation.navigate("Chats")}
            name="chatbox-ellipses-outline"
            size={24}
            color="white"
          />
          <MaterialIcons
            onPress={() => navigation.navigate("Friends")}
            name="people-outline"
            size={28}
            color="white"
          /> */}
          <Pressable onPress={handleLogout}>
            <Text style={{ color: "white", fontSize: 18 }}>Logout</Text>
          </Pressable>
        </View>
      ),
    });
  }, []);

  const handleRequestButton = () => {
    setIsRequestSent(true);
  };

  return (
    <View style={[styleUtils.container, styleUtils.primaryScreen, { gap: 20 }]}>
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
      {!isRequestSent ? (
        <TouchableOpacity
          onPress={handleRequestButton}
          style={{
            width: vw(50),
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
            Request Admin
          </Text>
        </TouchableOpacity>
      ) : (
        <Pressable
          style={{
            width: vw(50),
            backgroundColor: tertiary,
            paddingVertical: 15,
            marginTop: 20,
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
            Request Sent
          </Text>
        </Pressable>
      )}
    </View>
  );
};

export default HomeScreen;
