import {StyleSheet, Text, View, Pressable, Image, Alert} from "react-native";
import React, {useContext, useState, useEffect} from "react";
import {UserType} from "../UserContext";
import axios from "axios";
import {io} from "socket.io-client";

const socket = io("http://192.168.1.4:8000");

const User = ({item, isAdmin}) => {
  const {userId, setUserId} = useContext(UserType);
  const [requestSent, setRequestSent] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [userFriends, setUserFriends] = useState([]);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const response = await fetch(
          `http://192.168.1.4:8000/friend-requests/sent/${userId}`
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
        const response = await fetch(
          `http://192.168.1.4:8000/friends/${userId}`
        );

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
    socket.on("friendRequestAccepted", ({senderId, recepientId}) => {
      if (userId === senderId || userId === recepientId) {
        fetchFriendRequests();
        fetchUserFriends();
      }
    });

    return () => {
      socket.off("friendRequestAccepted");
    };
  }, [userId]);

  const sendFriendRequest = async (currentUserId, selectedUserId) => {
    try {
      const response = await fetch("http://192.168.1.4:8000/friend-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({currentUserId, selectedUserId}),
      });

      if (response.ok) {
        setRequestSent(true);
      }
    } catch (error) {
      console.log("error message", error);
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await axios.delete(
        `http://192.168.1.4:8000/users/${userId}`
      );
      if (response.status === 200) {
        Alert.alert("Success", "User deleted successfully");
      } else {
        Alert.alert("Error", "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      Alert.alert("Error", "Failed to delete user");
    }
  };

  return (
    <Pressable
      style={{flexDirection: "row", alignItems: "center", marginVertical: 10}}>
      <View>
        <Image
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            resizeMode: "cover",
          }}
          source={{uri: item.image}}
        />
      </View>

      <View style={{marginLeft: 12, flex: 1}}>
        <Text style={{fontWeight: "bold"}}>{item?.name}</Text>
        <Text style={{marginTop: 4, color: "gray"}}>{item?.email}</Text>
      </View>
      {userFriends.includes(item._id) ? (
        <Pressable
          style={{
            backgroundColor: "#82CD47",
            padding: 10,
            width: 105,
            borderRadius: 6,
          }}>
          <Text style={{textAlign: "center", color: "white"}}>Friends</Text>
        </Pressable>
      ) : requestSent ||
        friendRequests.some((friend) => friend._id === item._id) ? (
        <Pressable
          style={{
            backgroundColor: "gray",
            padding: 10,
            width: 105,
            borderRadius: 6,
          }}>
          <Text style={{textAlign: "center", color: "white", fontSize: 13}}>
            Request Sent
          </Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => sendFriendRequest(userId, item._id)}
          style={{
            backgroundColor: "#567189",
            padding: 10,
            borderRadius: 6,
            width: 105,
          }}>
          <Text style={{textAlign: "center", color: "white", fontSize: 13}}>
            Add Friend
          </Text>
        </Pressable>
      )}

      {isAdmin && (
        <Pressable onPress={() => deleteUser(item._id)}>
          <Text style={{color: "red", marginLeft: 10}}>Delete</Text>
        </Pressable>
      )}
    </Pressable>
  );
};

export default User;

const styles = StyleSheet.create({});
