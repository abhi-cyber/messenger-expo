import { Text, View, Pressable } from "react-native";
import { useLayoutEffect, useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useUserId } from "../UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwt_decode from "jwt-decode";
import axios from "axios";
import UserCard from "../components/UserCard";
import { apiUrl, appName } from "../constants/consts";
import styleUtils, { secondary } from "../constants/style";

const HomeScreen = () => {
  const navigation = useNavigation();
  const { setUserId } = useUserId();
  const [users, setUsers] = useState([]);
  // const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const token = await AsyncStorage.getItem("authToken");
      const decodedToken = jwt_decode(token);
      const userId = decodedToken.userId;
      setUserId(userId);
      // setUserName(decodedToken.userName);

      axios
        .get(apiUrl + "/users/" + userId)
        .then((response) => {
          setUsers(response.data);
        })
        .catch((error) => {
          console.log("error retrieving users", error);
        });
    };

    fetchUsers();
  }, []);

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
    <View
      style={[
        { marginHorizontal: "auto", padding: 20, flex: 1 },
        styleUtils.primaryScreen,
      ]}
    >
      {users.map((user, index) => (
        <UserCard key={index} user={user} />
      ))}
    </View>
  );
};

export default HomeScreen;
