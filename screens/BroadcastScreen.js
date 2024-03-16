import { Entypo, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { io } from "socket.io-client";
import { apiUrl } from "../constants/consts";
import { useUserId } from "../UserContext";
import adminAvatar from "../assets/admin.png";
import userAvatar from "../assets/user.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styleUtils, { accent, secondary, tertiary } from "../constants/style";
import {
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  TextInput,
  Pressable,
  Image,
  TouchableOpacity,
  Modal,
} from "react-native";
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import * as Clipboard from "expo-clipboard";
import PeerService from "../peer";
import axios from "axios";

const BroadcastScreen = () => {
  const socket = useMemo(() => io(apiUrl), []);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [recepientData, setRecepientData] = useState();
  const [showRecepientData, setShowRecepientData] = useState(false);
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState("");
  const [disableSendButton, setDisableSendButton] = useState(false);
  const route = useRoute();
  const { userId, expoPushToken, isAdmin } = useUserId();
  const [recipientIds, setRecipientIds] = useState([]);

  // Fetch all recipient IDs
  useEffect(() => {
    axios
      .get(apiUrl + `/users/${userId}`)
      .then((response) => {
        const ids = response.data.map((user) => user._id);
        console.log(ids);
        setRecipientIds(ids);
      })
      .catch((error) => {
        console.log("Error retrieving users:", error);
      });
  }, [userId]);

  const scrollViewRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, []);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: false });
  };

  const handleContentSizeChange = () => {
    scrollToBottom();
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(apiUrl + `/messages/${userId}/${userId}`);
      const data = await response.json();
      if (response.ok) {
        setMessages(data);
      } else {
        console.log("error showing messags", response.status.message);
      }
    } catch (error) {
      console.log("error fetching messages", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    const fetchRecepientData = async () => {
      try {
        const response = await fetch(apiUrl + `/user/${userId}`);

        const data = await response.json();
        setRecepientData(data);
      } catch (error) {
        console.log("error retrieving details", error);
      }
    };

    fetchRecepientData();
  }, []);

  useEffect(() => {
    socket.on("newMessage", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      scrollToBottom();
    });

    return () => {
      socket.disconnect();
    };
  }, [setMessages]);

  const handleSend = async (messageType, imageUri) => {
    if (!message && !imageUri) return;
    try {
      for (const recepientId of recipientIds) {
        const formData = new FormData();
        formData.append("senderId", userId);
        formData.append("recepientId", recepientId);

        if (messageType === "image") {
          formData.append("messageType", "image");
          formData.append("imageFile", {
            uri: imageUri,
            name: "image.jpg",
            type: "image/jpeg",
          });
        } else {
          formData.append("messageType", "text");
          formData.append("messageText", message);
        }

        const response = await fetch(apiUrl + "/messages", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const newMessage = await response.json(); // Parse the response as JSON
          // Emit the new message to the server;
          socket.emit("newMessage", JSON.stringify(newMessage));
        }
      }
      const formData = new FormData();
      formData.append("senderId", userId);
      formData.append("recepientId", userId);

      if (messageType === "image") {
        formData.append("messageType", "image");
        formData.append("imageFile", {
          uri: imageUri,
          name: "image.jpg",
          type: "image/jpeg",
        });
      } else {
        formData.append("messageType", "text");
        formData.append("messageText", message);
      }

      const response = await fetch(apiUrl + "/messages", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        setMessage("");
        setSelectedImage("");
      }
    } catch (error) {
      console.log("error in sending the message", error);
    }
  };

  useEffect(() => {
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
      headerTitle: "",
      headerStyle: { backgroundColor: secondary },
      headerLeft: () => (
        <Pressable
          onPress={() => setShowRecepientData((prev) => !prev)}
          style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
        >
          <View
            style={{
              height: 40,
              width: 40,
              overflow: "hidden",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "white",
              borderRadius: 90,
            }}
          >
            <Image
              style={{
                height: recepientData?.isAdmin ? 45 : 26,
                width: recepientData?.isAdmin ? 45 : 26,
                objectFit: "cover",
              }}
              source={recepientData?.isAdmin ? adminAvatar : userAvatar}
            />
          </View>
          <Text style={{ color: "white", fontSize: 20 }}>
            {recepientData?.isAdmin ? "Admin" : recepientData?.name}
          </Text>
        </Pressable>
      ),
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
          <Pressable onPress={handleLogout}>
            <Text style={{ color: "white", fontSize: 18 }}>Logout</Text>
          </Pressable>
        </View>
      ),
    });
  }, [recepientData, socket]);

  const deleteMessages = async (messageIds) => {
    try {
      const response = await fetch(apiUrl + "/deleteMessages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: messageIds }),
      });

      if (response.ok) {
        setSelectedMessages((prevSelectedMessages) =>
          prevSelectedMessages.filter((id) => !messageIds.includes(id))
        );
        fetchMessages();
      } else {
        console.log("error deleting messages", response.status);
      }
    } catch (error) {
      console.log("error deleting messages", error);
    }
  };

  const formatTime = (time) => {
    const options = { hour: "numeric", minute: "numeric" };
    return new Date(time).toLocaleString("en-US", options);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);
    if (!result.canceled) {
      handleSend("image", result.uri);
    }
  };

  const handleSelectMessage = (message) => {
    //check if the message is already selected
    const isSelected = selectedMessages.includes(message._id);

    if (isSelected) {
      setSelectedMessages((previousMessages) =>
        previousMessages.filter((id) => id !== message._id)
      );
    } else {
      setSelectedMessages((previousMessages) => [
        ...previousMessages,
        message._id,
      ]);
    }
  };

  return (
    <View style={[{ flex: 1 }, styleUtils.primaryScreen]}>
      {selectedMessages.length > 0 && isAdmin && (
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 40,
            backgroundColor: secondary,
            paddingHorizontal: 60,
            paddingVertical: 20,
          }}
        >
          <TouchableOpacity
            onPress={async () => {
              const msgs = messages.filter((m) =>
                selectedMessages.includes(m._id)
              );
              await Clipboard.setStringAsync(
                msgs.map((msg) => msg.message).join("\n")
              );
              setSelectedMessages([]);
            }}
          >
            <Entypo name="copy" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteMessages(selectedMessages)}>
            <MaterialIcons name="delete" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              const msgs = messages.filter((m) =>
                selectedMessages.includes(m._id)
              );
              navigation.navigate("Home", {
                forwardMsg: msgs.map((msg) => msg.message).join("\n"),
              });
            }}
          >
            <Entypo name="forward" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
      <Modal
        onRequestClose={() => setSelectedImage("")}
        animationType="fade"
        transparent={true}
        visible={!!selectedImage}
      >
        <Pressable
          onPress={() => setSelectedImage("")}
          style={{ position: "relative", flex: 1 }}
        >
          <View
            style={{
              height: "100%",
              width: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              elevation: 1,
              backgroundColor: tertiary,
              padding: 10,
              gap: 10,
            }}
          >
            <Image
              source={{ uri: selectedImage }}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </View>
        </Pressable>
      </Modal>
      <ScrollView
        ref={scrollViewRef}
        style={{ height: "100%" }}
        onContentSizeChange={handleContentSizeChange}
      >
        {messages.map((item, index) => {
          if (item.messageType == "text" || item.messageType == "call") {
            const isSelected = selectedMessages.includes(item._id);
            return (
              <Pressable
                onLongPress={() => (isAdmin ? handleSelectMessage(item) : null)}
                key={index}
                style={[
                  item?.senderId?._id == userId || item?.senderId == userId
                    ? {
                        alignSelf: "flex-end",
                        backgroundColor: "#DCF8C6",
                        padding: 8,
                        maxWidth: "60%",
                        borderRadius: 7,
                        margin: 10,
                      }
                    : {
                        alignSelf: "flex-start",
                        backgroundColor: "white",
                        padding: 8,
                        margin: 10,
                        borderRadius: 7,
                        maxWidth: "60%",
                      },

                  isSelected && { width: "100%", backgroundColor: "#F0FFFF" },
                ]}
              >
                <Text
                  style={{
                    fontSize: 13,
                    textAlign: isSelected ? "right" : "left",
                  }}
                >
                  {item?.message}
                </Text>
                <Text
                  style={{
                    textAlign: "right",
                    fontSize: 9,
                    color: "gray",
                    marginTop: 5,
                  }}
                >
                  {formatTime(item.timeStamp)}
                </Text>
              </Pressable>
            );
          }
          if (item.messageType === "image") {
            const imageUrl = item.imageUrl;
            const filename = imageUrl.split(/[/\\]/).pop();
            const source = { uri: apiUrl + "/" + filename };
            return (
              <Pressable
                key={index}
                onPress={() => setSelectedImage(source.uri)}
                style={[
                  item?.senderId?._id == userId
                    ? {
                        alignSelf: "flex-end",
                        backgroundColor: "#DCF8C6",
                        padding: 8,
                        maxWidth: "60%",
                        borderRadius: 7,
                        margin: 10,
                      }
                    : {
                        alignSelf: "flex-start",
                        backgroundColor: "white",
                        padding: 8,
                        margin: 10,
                        borderRadius: 7,
                        maxWidth: "60%",
                      },
                ]}
              >
                <View>
                  <Image
                    source={source}
                    style={{
                      width: 200,
                      height: 200,
                      borderRadius: 7,
                    }}
                  />
                  <Text
                    style={{
                      textAlign: "right",
                      fontSize: 9,
                      position: "absolute",
                      right: 10,
                      bottom: 7,
                      color: "white",
                      marginTop: 5,
                    }}
                  >
                    {formatTime(item?.timeStamp)}
                  </Text>
                </View>
              </Pressable>
            );
          }
        })}
      </ScrollView>
      <KeyboardAvoidingView>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            gap: 10,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 10,
              borderWidth: 2,
              borderColor: secondary,
              padding: 10,
              borderRadius: 20,
            }}
          >
            <TextInput
              value={message}
              onChangeText={(text) => setMessage(text)}
              style={{ flex: 1, color: "white", fontSize: 20, maxHeight: 100 }}
              placeholderTextColor={accent}
              placeholder="Message"
              multiline
            />
            <Entypo onPress={pickImage} name="camera" size={24} color="white" />
          </View>
          {/* <Feather
            style={{
              backgroundColor: secondary,
              borderRadius: 22,
              padding: 8,
            }}
            name="mic"
            size={22}
            color="white"
          /> */}
          <Pressable
            onPress={() => {
              if (disableSendButton) return;
              setDisableSendButton(true);
              handleSend("text").then(() => setDisableSendButton(false));
            }}
            disabled={disableSendButton}
            style={{
              backgroundColor: !disableSendButton ? secondary : tertiary,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default BroadcastScreen;
