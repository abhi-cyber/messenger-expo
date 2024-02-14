import {StyleSheet, Text, View} from "react-native";
import React, {useLayoutEffect, useContext, useEffect, useState} from "react";
import {useNavigation} from "@react-navigation/native";
import {Ionicons} from "@expo/vector-icons";
import {MaterialIcons} from "@expo/vector-icons";
import {UserType} from "../UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwt_decode from "jwt-decode";
import axios from "axios";
import User from "../components/User";
import {Pressable} from "react-native";

const HomeScreen = () => {
  const navigation = useNavigation();
  const {userId, setUserId} = useContext(UserType);
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const token = await AsyncStorage.getItem("authToken");
      const decodedToken = jwt_decode(token);
      const userId = decodedToken.userId;
      setUserId(userId);
      setUserName(decodedToken.userName);

      axios
        .get(`http://10.0.64.229:8000/users/${userId}`)
        .then((response) => {
          if (isAdmin) {
            setUsers(response.data);
          } else {
            const filteredUsers = response.data.filter((user) => user.isAdmin);
            setUsers(filteredUsers);
          }
        })
        .catch((error) => {
          console.log("error retrieving users", error);
        });
    };

    const fetchIsAdmin = async () => {
      const isAdminString = await AsyncStorage.getItem("isAdmin");
      const isAdmin = JSON.parse(isAdminString);
      setIsAdmin(isAdmin);
    };

    fetchUsers();
    fetchIsAdmin();
  }, [setUserId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: userId ? `Welcome, ${userName || "Unknown"}` : "",
      headerRight: () => (
        <View style={{flexDirection: "row", alignItems: "center", gap: 8}}>
          <Ionicons
            onPress={() => navigation.navigate("Chats")}
            name="chatbox-ellipses-outline"
            size={24}
            color="black"
          />
          <MaterialIcons
            onPress={() => navigation.navigate("Friends")}
            name="people-outline"
            size={24}
            color="black"
          />
          <Pressable onPress={handleLogout}>
            <Text style={{marginLeft: 10, color: "black", fontSize: 16}}>
              Logout
            </Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, userId, userName]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      navigation.replace("Login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  console.log("users", users);
  return (
    <View>
      {isAdmin ? (
        <View style={{padding: 10}}>
          {users.map((item, index) => (
            <User key={index} item={item} />
          ))}
        </View>
      ) : (
        <View style={{padding: 10}}>
          {users.map((item, index) => (
            <User key={index} item={item} />
          ))}
        </View>
      )}
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({});
