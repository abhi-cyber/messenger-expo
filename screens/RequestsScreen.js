import {
  Text,
  View,
  Pressable,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
} from "react-native";
import { useLayoutEffect, useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { appName } from "../constants/consts";
import styleUtils, { secondary, accent, vh, vw } from "../constants/style";
import jwt_decode from "jwt-decode";
import { useUserId } from "../UserContext";
import { apiUrl } from "../constants/consts";
import userIcon from "../assets/user.png";

const RequestsScreen = () => {
  const navigation = useNavigation();
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [friendRequests, setFriendRequests] = useState([]);
  const [adminFriendRequests, setAdminFriendRequests] = useState([]);
  const [userFriends, setUserFriends] = useState([]);
  const { expoPushToken } = useUserId();

  useEffect(() => {
    const fetchFriendRequests = async () => {
      const token = await AsyncStorage.getItem("authToken");
      const decodedToken = jwt_decode(token);
      const userId = decodedToken.userId;
      setUserId(userId);
      try {
        const response = await fetch(apiUrl + "/friend-request/" + userId);
        if (response.status === 200) {
          const data = await response.json();
          const friendRequestsData = data.map((friendRequest) => ({
            _id: friendRequest._id,
            name: friendRequest.name,
            email: friendRequest.email,
          }));
          setFriendRequests(friendRequestsData);
        }
      } catch (err) {
        console.log("error message", err);
      }
    };
    fetchFriendRequests();
  }, []);

  useLayoutEffect(() => {
    const handleLogout = async () => {
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
    };

    navigation.setOptions({
      headerTitle: appName,
      headerStyle: { backgroundColor: secondary, color: "white" },
      headerTitleStyle: { fontWeight: "600", color: "white" },
      headerRight: () => (
        <Pressable onPress={handleLogout}>
          <Text style={{ color: "white", fontSize: 18 }}>Logout</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const acceptRequest = async (friendRequestId) => {
    try {
      const response = await fetch(apiUrl + "/friend-request/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: friendRequestId,
          recepientId: userId,
        }),
      });

      if (response.ok) {
        setFriendRequests(
          friendRequests.filter((request) => request._id !== friendRequestId)
        );
        navigation.navigate("Messages", { recepientId: friendRequestId });
      }
    } catch (err) {
      console.log("error accepting the friend request", err);
    }
  };

  return (
    <View
      style={[
        styleUtils.container,
        styleUtils.primaryScreen,
        {
          gap: 20,
          paddingVertical: 60,
          justifyContent: "flex-start",
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
        <Pressable onPress={() => navigation.navigate("Home")}>
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
            All
          </Text>
        </Pressable>
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
          Requests
        </Text>
        <Pressable
          onPress={() => {
            navigation.navigate("Broadcast");
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
            Broadcast
          </Text>
        </Pressable>
      </View>
      {friendRequests.length == 0 && (
        <Text
          style={{
            fontSize: 25,
            marginVertical: 60,
            fontWeight: "600",
            color: "white",
          }}
        >
          No Request found
        </Text>
      )}
      {friendRequests.length > 0 && (
        <FlatList
          style={{ width: "100%", marginRight: -35 }}
          data={friendRequests}
          renderItem={({ index, item }) => {
            return (
              <TouchableOpacity
                onPress={() => {
                  return Alert.alert(
                    "",
                    "Are you sure you want too accept friend request of " +
                      item.name,
                    [
                      {
                        text: "Yes",
                        onPress: () => acceptRequest(item._id),
                      },
                      {
                        text: "Cancel",
                      },
                    ],
                    {
                      cancelable: true,
                    }
                  );
                }}
                style={{
                  width: "90%",
                  flexDirection: "row",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  borderTopWidth: index == 0 ? 0 : 1,
                  borderColor: accent,
                  padding: 20,
                  gap: 20,
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
                <View style={{ flexDirection: "row" }}>
                  <View>
                    <View
                      style={{
                        justifyContent: "space-between",
                        flexDirection: "row",
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 20,
                          fontWeight: "700",
                        }}
                      >
                        {item.name}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: accent,
                        fontSize: 16,
                        fontWeight: "400",
                      }}
                    >
                      {item.email}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item._id}
        />
      )}
    </View>
  );
};

export default RequestsScreen;
