import React, {useContext, useEffect, useState} from "react";
import {View, StyleSheet} from "react-native";
import {UserType} from "../UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwt_decode from "jwt-decode";
import axios from "axios";
import ForwardMessageUsers from "../components/ForwardMessageUsers";
import {useNavigation} from "@react-navigation/native";

const ForwardMessageScreen = ({route}) => {
  const navigation = useNavigation();
  const {userId, setUserId} = useContext(UserType);
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");
  const {selectedMessages} = route.params;

  useEffect(() => {
    const fetchUsers = async () => {
      const isAdminString = await AsyncStorage.getItem("isAdmin");
      const isAdmin = JSON.parse(isAdminString);
      setIsAdmin(isAdmin);

      const token = await AsyncStorage.getItem("authToken");
      const decodedToken = jwt_decode(token);
      const userId = decodedToken.userId;
      setUserId(userId);
      setUserName(decodedToken.userName);

      axios
        .get(`http://192.168.1.4:8000/users/${userId}`)
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

    fetchUsers();
  }, [setUserId]);

  const handleForward = (selectedUserId) => {
    console.log("Selected User ID:", selectedUserId);
    console.log("Selected Messages:", selectedMessages);

    if (selectedMessages && selectedMessages.length > 0) {
      // Forward each selected message to the selected user directly
      axios
        .post("http://192.168.1.4:8000/forwardMessage", {
          senderId: userId,
          recepientId: selectedUserId,
          forwardedMessages: selectedMessages,
        })
        .then((response) => {
          console.log(response.data);
          navigation.navigate('Chats')
        })
        .catch((error) => {
          console.log("error forwarding messages", error);
        });
    } else {
      console.log("No selected messages to forward.");
    }
  };

  return (
    <View style={styles.container}>
      {isAdmin ? (
        <View style={styles.usersContainer}>
          {users.map((item, index) => (
            <ForwardMessageUsers
              key={index}
              item={item}
              onPress={handleForward}
            />
          ))}
        </View>
      ) : (
        <View style={styles.usersContainer}>
          {users.map((item, index) => (
            <ForwardMessageUsers
              key={index}
              item={item}
              onPress={handleForward}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default ForwardMessageScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  usersContainer: {
    padding: 10,
  },
});
