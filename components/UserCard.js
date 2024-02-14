import { Text, View, Pressable, Image } from "react-native";
import React, { useState, useEffect } from "react";
import { useUserId } from "../UserContext";
import { apiUrl } from "../constants/consts";
import { io } from "socket.io-client";

const UserCard = ({ user }) => {
  const { userId } = useUserId();
  const [requestSent, setRequestSent] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [userFriends, setUserFriends] = useState([]);
  const socket = io(apiUrl);

  useEffect(() => {
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
  }, [userId]); // Make sure to include userId in the dependency array

  const sendFriendRequest = async (currentUserId, selectedUserId) => {
    try {
      const response = await fetch(apiUrl + "/friend-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentUserId, selectedUserId }),
      });

      if (response.ok) {
        setRequestSent(true);
      }
    } catch (error) {
      console.log("error message", error);
    }
  };
  console.log("friend requests sent", friendRequests);
  console.log("user friends", userFriends);
  return (
    <Pressable
      style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}
    >
      <View>
        <Image
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            resizeMode: "cover",
          }}
          source={{ uri: user.image }}
        />
      </View>

      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ fontWeight: "bold" }}>{user?.name}</Text>
        <Text style={{ marginTop: 4, color: "gray" }}>{user?.email}</Text>
      </View>
      {userFriends.includes(user._id) ? (
        <Pressable
          style={{
            backgroundColor: "#82CD47",
            padding: 10,
            width: 105,
            borderRadius: 6,
          }}
        >
          <Text style={{ textAlign: "center", color: "white" }}>Friends</Text>
        </Pressable>
      ) : requestSent ||
        friendRequests.some((friend) => friend._id === user._id) ? (
        <Pressable
          style={{
            backgroundColor: "gray",
            padding: 10,
            width: 105,
            borderRadius: 6,
          }}
        >
          <Text style={{ textAlign: "center", color: "white", fontSize: 13 }}>
            Request Sent
          </Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => sendFriendRequest(userId, user._id)}
          style={{
            backgroundColor: "#567189",
            padding: 10,
            borderRadius: 6,
            width: 105,
          }}
        >
          <Text style={{ textAlign: "center", color: "white", fontSize: 13 }}>
            Add Friend
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
};

export default UserCard;
