import { Text, View, Pressable } from "react-native";
import { useLayoutEffect, useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
// import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { appName } from "../constants/consts";
import styleUtils, { secondary } from "../constants/style";
import jwt_decode from "jwt-decode";
import { AdminCard, UserCard } from "../components/Home";
import { useUserId } from "../UserContext";
import axios from "axios";
import { apiUrl } from "../constants/consts";

const HomeScreen = () => {
  const navigation = useNavigation();
  const { setUserId } = useUserId();
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState();

  useEffect(() => {
    const fetchUsers = async () => {
      const token = await AsyncStorage.getItem("authToken");
      const decodedToken = jwt_decode(token);
      const userId = decodedToken.userId;
      const isAdmin = decodedToken.isAdmin || false;
      setIsAdmin(isAdmin);
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

  if (isAdmin) {
    return (
      <View
        style={[
          styleUtils.container,
          styleUtils.primaryScreen,
          { gap: 20, justifyContent: "flex-start" },
        ]}
      >
        {users.map((user, index) => (
          <UserCard key={index} index={index} user={user} />
        ))}
      </View>
    );
  } else {
    return (
      <View
        style={[styleUtils.container, styleUtils.primaryScreen, { gap: 20 }]}
      >
        {users.map((user, index) => (
          <AdminCard
            key={index}
            admin={user}
            isRequestSent={isRequestSent}
            handleRequestButton={handleRequestButton}
          />
        ))}
      </View>
    );
  }
};

export default HomeScreen;
