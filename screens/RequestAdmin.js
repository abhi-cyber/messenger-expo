import { Text, View, Pressable, Image, TouchableOpacity } from "react-native";
import { useLayoutEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { appName } from "../constants/consts";
import styleUtils, { accent, secondary, vw } from "../constants/style";

const HomeScreen = () => {
  const navigation = useNavigation();

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
          <Ionicons
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
          />
          <Pressable onPress={handleLogout}>
            <Text style={{ color: "white", fontSize: 18 }}>Logout</Text>
          </Pressable>
        </View>
      ),
    });
  }, []);

  return (
    <View style={[styleUtils.container, styleUtils.primaryScreen, { gap: 20 }]}>
      <Image
        style={{ height: 180, width: 180, objectFit: "cover" }}
        source={{
          uri: "https://avatar.iran.liara.run/public/boy?username=Ash",
        }}
      />
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
          Request
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;
