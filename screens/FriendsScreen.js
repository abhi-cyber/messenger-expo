import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useContext, useState } from "react";
import axios from "axios";
import { useUserId } from "../UserContext";
import FriendRequest from "../components/FriendRequest";
import { apiUrl } from "../constants/consts";

const FriendsScreen = () => {
  const { userId } = useUserId();
  const [friendRequests, setFriendRequests] = useState([]);
  useEffect(() => {
    fetchFriendRequests();
  }, []);

  const fetchFriendRequests = async () => {
    try {
      const response = await axios.get(apiUrl + `/friend-request/${userId}`);
      if (response.status === 200) {
        const friendRequestsData = response.data.map((friendRequest) => ({
          _id: friendRequest._id,
          name: friendRequest.name,
          email: friendRequest.email,
          image: friendRequest.image,
        }));

        setFriendRequests(friendRequestsData);
      }
    } catch (err) {
      console.log("error message", err);
    }
  };

  console.log(friendRequests);
  return (
    <View style={{ padding: 10, marginHorizontal: 12 }}>
      {friendRequests.length > 0 && <Text>Your Friend Requests!</Text>}

      {friendRequests.map((item, index) => (
        <FriendRequest
          key={index}
          item={item}
          friendRequests={friendRequests}
          setFriendRequests={setFriendRequests}
        />
      ))}
    </View>
  );
};

export default FriendsScreen;
