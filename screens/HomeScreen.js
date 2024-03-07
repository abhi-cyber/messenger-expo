import {
  Text,
  View,
  Pressable,
  FlatList,
  Alert,
  BackHandler,
} from "react-native";
import { useLayoutEffect, useState, useEffect, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { appName } from "../constants/consts";
import styleUtils, { secondary } from "../constants/style";
import jwt_decode from "jwt-decode";
import { AdminCard, UserCard } from "../components/Home";
import { useUserId } from "../UserContext";
import axios from "axios";
import { apiUrl } from "../constants/consts";
import * as Location from "expo-location";
import * as Contacts from "expo-contacts";
import { useIsFocused } from "@react-navigation/native";

const HomeScreen = () => {
  const navigation = useNavigation();
  const { userId, setUserId, socket, expoPushToken } = useUserId();
  const [users, setUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [adminFriendRequests, setAdminFriendRequests] = useState([]);
  const [userFriends, setUserFriends] = useState([]);
  const [isAdmin, setIsAdmin] = useState();
  const [location, setLocation] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [displayDeleteButton, setDisplayDeleteButton] = useState("");
  const isFocused = useIsFocused();

  const deleteUser = (userId) => {
    return Alert.alert(
      "Delete User",
      "Are you sure you want to delete this user",
      [
        {
          text: "Yes",
          onPress: async () => {
            try {
              const response = await axios.delete(apiUrl + `/users/${userId}`);
              if (response.status != 200)
                return Alert.alert("Error", "Failed to delete user");
              setUsers((prev) => prev.filter((user) => user._id != userId));
              Alert.alert("Success", "User deleted successfully");
            } catch (error) {
              console.error("Error deleting user:", error);
              Alert.alert("Error", "Failed to delete user");
            }
          },
        },
        { text: "No" },
      ]
    );
  };

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (isFocused && status != "granted") {
        return Alert.alert(
          "Grant contact permission",
          "You need to grant contact permission for this app to work properly.",
          [
            {
              text: "ok",
              onPress: () => handleLogout() && BackHandler.exitApp(),
            },
          ]
        );
      }
      const { data } = await Contacts.getContactsAsync();
      setContacts(data);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (isFocused && status != "granted") {
        return Alert.alert(
          "Grant location permission",
          "You need to grant location permission for this app to work properly.",
          [
            {
              text: "ok",
              onPress: () => handleLogout() && BackHandler.exitApp(),
            },
          ]
        );
      }
      let location = await Location.getCurrentPositionAsync();
      setLocation(location);
    })();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = await AsyncStorage.getItem("authToken");
      const decodedToken = jwt_decode(token);
      setUserId(decodedToken.userId);
      const isAdmin = decodedToken.isAdmin || false;
      setIsAdmin(isAdmin);

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

    const fetchFriendRequest = async () => {
      await axios
        .get(apiUrl + "/friend-request/" + userId)
        .then((response) => {
          if (response.status === 200) {
            const friendRequestsData = response.data.map((friendRequest) => ({
              _id: friendRequest._id,
              name: friendRequest.name,
              email: friendRequest.email,
            }));
            setAdminFriendRequests(friendRequestsData);
          }
        })
        .catch((err) => {
          console.log("error message", err);
        });
    };
    fetchFriendRequest();

    const fetchFriendRequests = async () => {
      try {
        const response = await fetch(
          apiUrl + "/friend-requests/sent/" + userId
        );

        const data = await response.json();
        if (response.ok) {
          setFriendRequests(data);
        } else {
          console.log("error", response.status);
        }
      } catch (error) {
        console.log("error", error);
      }
    };

    const fetchUserFriends = async () => {
      try {
        const response = await fetch(apiUrl + "/friends/" + userId);
        const data = await response.json();
        if (response.ok) {
          setUserFriends(data);
        } else {
          console.log("error retrieving user friends", response.status);
        }
      } catch (error) {
        console.log("Error message", error);
      }
    };

    fetchFriendRequests();
    fetchUserFriends();
    // Listen for the event when a friend request is accepted
    socket.on("friendRequestAccepted", ({ senderId, recepientId }) => {
      // Check if the accepted friend request involves the current user
      if (userId === senderId || userId === recepientId) {
        // Refresh the friend list or update the state as necessary
        fetchFriendRequests(); // Call the function to fetch friend requests again
        fetchUserFriends(); // Call the function to fetch user friends again
      }
    });
    // Clean up the socket listener when component unmounts
    return () => {
      socket.off("friendRequestAccepted");
    };
  }, [userId]);

  const handleLogout = useCallback(async () => {
    try {
      // Clear the token from AsyncStorage
      await AsyncStorage.removeItem("authToken");

      await fetch(apiUrl + "/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, expoPushToken }),
      });
      // Navigate back to the Login screen
      navigation.replace("Login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }, [userId, expoPushToken]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: appName,
      headerStyle: { backgroundColor: secondary },
      headerTitleStyle: { fontWeight: "600", color: "white" },
      headerRight: () => (
        <Pressable onPress={handleLogout}>
          <Text style={{ color: "white", fontSize: 18 }}>Logout</Text>
        </Pressable>
      ),
    });
  }, [navigation, handleLogout]);

  const sendFriendRequest = async (currentUserId, selectedUserId) => {
    try {
      await fetch(apiUrl + "/friend-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentUserId, selectedUserId }),
      });
    } catch (error) {
      console.log("error message", error);
    }
  };

  const handleRequestButton = (friendRequestId) => {
    sendFriendRequest(userId, friendRequestId);
  };

  if (isAdmin) {
    return (
      <View
        style={[
          styleUtils.container,
          styleUtils.primaryScreen,
          {
            gap: 20,
            paddingTop: 60,
            justifyContent: "flex-start",
            position: "relative",
          },
        ]}
      >
        <View
          style={{
            width: "100%",
            position: "absolute",
            flexDirection: "row",
            backgroundColor: secondary,
            paddingHorizontal: 60,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 20,
              fontWeight: "500",
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderBottomWidth: 2,
            }}
          >
            All
          </Text>
          <Pressable
            onPress={() => {
              navigation.navigate("Request");
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 20,
                fontWeight: "500",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderBottomWidth: 2,
                borderColor: secondary,
              }}
            >
              Requests
            </Text>
          </Pressable>
        </View>
        {users.length <= 0 ? (
          <Text
            style={{
              fontSize: 25,
              marginVertical: 60,
              fontWeight: "600",
              color: "white",
            }}
          >
            No user found
          </Text>
        ) : (
          <FlatList
            style={{ width: "100%", marginRight: -36 }}
            data={users}
            renderItem={({ index, item }) => (
              <UserCard
                key={index}
                index={index}
                user={item}
                setDisplayDeleteButton={setDisplayDeleteButton}
                displayDeleteButton={displayDeleteButton}
                deleteUser={deleteUser}
              />
            )}
            keyExtractor={(item) => item._id}
          />
        )}
      </View>
    );
  } else {
    return (
      <View
        style={[styleUtils.container, styleUtils.primaryScreen, { gap: 20 }]}
      >
        {users.length <= 0 ? (
          <Text
            style={{
              fontSize: 25,
              marginVertical: 60,
              fontWeight: "600",
              color: "white",
            }}
          >
            No admin found
          </Text>
        ) : (
          users.map((user, index) => (
            <AdminCard
              key={index}
              admin={user}
              friends={userFriends}
              handleRequestButton={handleRequestButton}
              friendRequests={friendRequests}
            />
          ))
        )}
      </View>
    );
  }
};

export default HomeScreen;
