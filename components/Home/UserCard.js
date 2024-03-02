import { TouchableOpacity, View, Image, Text, Pressable } from "react-native";
import { accent, secondary } from "../../constants/style";
import userIcon from "../../assets/user.png";
import { useNavigation } from "@react-navigation/native";
import { useState, useEffect } from "react";
import { apiUrl } from "../../constants/consts";
import { io } from "socket.io-client";
import { useUserId } from "../../UserContext";

export default ({
  index,
  user,
  displayDeleteButton,
  setDisplayDeleteButton,
  deleteUser,
  handleSelectedForwardUser,
}) => {
  const { userId } = useUserId();
  const navigation = useNavigation();
  const [unreadMessages, setUnreadMessages] = useState(0);

  const fetchMessages = async () => {
    try {
      const response = await fetch(apiUrl + `/messages/${userId}/${user._id}`);
      const data = await response.json();
      if (response.ok) {
        const unreadCount = data.filter(
          (message) => message.senderId === user._id
        ).length;
        setUnreadMessages(unreadCount);
      } else {
        console.log("Error fetching messages:", response.status.message);
      }
    } catch (error) {
      console.log("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    const socket = io(apiUrl);

    // Listen for new messages
    socket.on("newMessage", (message) => {
      console.log("socket", message);
      // Check if the message is from the current chat user
      if (message.senderId == user._id && message.recepientId == userId) {
        // Update unread messages count
        setUnreadMessages((prevUnread) => prevUnread + 1);
        console.log(unreadMessages);
      }
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Reset unread messages count to 0 when navigating to chat message screen
    const unsubscribe = navigation.addListener("focus", () => {
      setUnreadMessages(0);
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <>
      <TouchableOpacity
        onLongPress={() =>
          setDisplayDeleteButton((prev) =>
            !prev || prev != user._id ? user._id : ""
          )
        }
        onPress={() =>
          navigation.navigate("Messages", { recepientId: user._id })
        }
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
                {user.name}
              </Text>
              {unreadMessages > 0 && (
                <Text
                  style={{
                    color: "green",
                    fontSize: 16,
                    fontWeight: "400",
                  }}
                >
                  {`(${unreadMessages})`}
                </Text>
              )}
              {displayDeleteButton == user._id && (
                <Pressable onPress={() => deleteUser(user._id)}>
                  <Text
                    style={{
                      backgroundColor: secondary,
                      padding: 10,
                      borderRadius: 16,
                    }}
                  >
                    delete
                  </Text>
                </Pressable>
              )}
            </View>
            <Text
              style={{
                color: accent,
                fontSize: 16,
                fontWeight: "400",
              }}
            >
              {user.email}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </>
  );
};
