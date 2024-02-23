import {StyleSheet, Text, View, Pressable, Image} from "react-native";
import React, {useContext, useEffect, useState} from "react";
import {useNavigation} from "@react-navigation/native";
import {UserType} from "../UserContext";
import io from "socket.io-client";

const UserChat = ({item}) => {
  const {userId, setUserId} = useContext(UserType);
  const [messages, setMessages] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const navigation = useNavigation();

  useEffect(() => {
    const socket = io("http://10.0.67.114:8000");

    // Listen for new messages
    socket.on("newMessage", (message) => {
      console.log("New message received:", message);
      // Update messages state with the new message
      setMessages((prevMessages) => [...prevMessages, message]);

      // Check if the message is from the current chat user
      if (message.senderId === item._id && message.recepientId === userId) {
        // Update unread messages count
        setUnreadMessages((prevUnread) => prevUnread + 1);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    // Reset unread messages count to 0 when navigating to chat message screen
    const unsubscribe = navigation.addListener("focus", () => {
      setUnreadMessages(0);
    });

    return unsubscribe;
  }, [navigation]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `http://10.0.67.114:8000/messages/${userId}/${item._id}`
      );
      const data = await response.json();

      if (response.ok) {
        setMessages(data);

        const unreadCount = data.filter(
          (message) => message.senderId === item._id
        ).length;
        setUnreadMessages(unreadCount);
      } else {
        console.log("Error fetching messages:", response.status.message);
      }
    } catch (error) {
      console.log("Error fetching messages:", error);
    }
  };

  const getLastMessage = () => {
    const userMessages = messages.filter(
      (message) => message.messageType === "text"
    );

    const n = userMessages.length;

    return userMessages[n - 1];
  };

  const lastMessage = getLastMessage();

  const formatTime = (time) => {
    const options = {hour: "numeric", minute: "numeric"};
    return new Date(time).toLocaleString("en-US", options);
  };

  return (
    <Pressable
      onPress={() =>
        navigation.navigate("Messages", {
          recepientId: item._id,
        })
      }
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderWidth: 0.7,
        borderColor: "#D0D0D0",
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        padding: 10,
      }}>
      <Image
        style={{width: 50, height: 50, borderRadius: 25, resizeMode: "cover"}}
        source={{uri: item?.image}}
      />

      <View style={{flex: 1}}>
        <Text style={{fontSize: 15, fontWeight: "500"}}>{item?.name}</Text>
        {unreadMessages > 0 && (
          <View
            style={{
              backgroundColor: "red",
              borderRadius: 10,
              marginLeft: 5,
              padding: 2,
            }}>
            <Text style={{color: "white", fontSize: 12}}>{unreadMessages}</Text>
          </View>
        )}
        {lastMessage && (
          <Text style={{marginTop: 3, color: "gray", fontWeight: "500"}}>
            {lastMessage?.message}
          </Text>
        )}
      </View>

      <View>
        <Text style={{fontSize: 11, fontWeight: "400", color: "#585858"}}>
          {lastMessage && formatTime(lastMessage?.timeStamp)}
        </Text>
      </View>
    </Pressable>
  );
};

export default UserChat;

const styles = StyleSheet.create({});
