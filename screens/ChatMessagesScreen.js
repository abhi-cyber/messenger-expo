import { Feather, Entypo, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { io } from "socket.io-client";
import { apiUrl } from "../constants/consts";
import { useUserId } from "../UserContext";
import adminAvatar from "../assets/admin.png";
import userAvatar from "../assets/user.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styleUtils, { accent, secondary, tertiary } from "../constants/style";
import jwt_decode from "jwt-decode";
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
import React, { useState, useEffect, useRef } from "react";
import * as Clipboard from "expo-clipboard";

const ChatMessagesScreen = () => {
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [recepientData, setRecepientData] = useState();
  const [showRecepientData, setShowRecepientData] = useState(false);
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState("");
  const route = useRoute();
  const { recepientId } = route.params;
  const { userId } = useUserId();

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("authToken");
      const decodedToken = jwt_decode(token);
      const isAdmin = decodedToken.isAdmin || false;
      setUserName(decodedToken.userName);
      setIsAdmin(isAdmin);
    })();
  }, []);

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
      const response = await fetch(
        apiUrl + `/messages/${userId}/${recepientId}`
      );
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
        const response = await fetch(apiUrl + `/user/${recepientId}`);

        const data = await response.json();
        setRecepientData(data);
      } catch (error) {
        console.log("error retrieving details", error);
      }
    };

    fetchRecepientData();
  }, []);

  useEffect(() => {
    const socket = io(apiUrl);
    socket.on("newMessage", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      scrollToBottom();
    });

    return () => {
      socket.disconnect();
    };
  }, [setMessages]);

  const handleSend = async (messageType, imageUri) => {
    const socket = io(apiUrl);
    try {
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
        setMessage("");
        setSelectedImage("");

        // Emit the new message to the server
        socket.emit("newMessage", JSON.stringify(newMessage));
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable onPress={handleLogout}>
            <Text style={{ color: "white", fontSize: 18 }}>Logout</Text>
          </Pressable>
        </View>
      ),
    });
  }, [recepientData]);

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      // allowsEditing: true,
      // aspect: [4, 3],
      quality: 1,
    });

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
          {/* <TouchableOpacity> */}
          {/* <Entypo name="forward" size={24} color="white" /> */}
          {/* </TouchableOpacity> */}
        </View>
      )}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showRecepientData}
        onRequestClose={() => setShowRecepientData(false)}
      >
        <Pressable
          onPress={() => setShowRecepientData(false)}
          style={{ position: "relative", flex: 1 }}
        >
          <View
            style={{
              position: "absolute",
              top: 60,
              left: 12,
              elevation: 1,
              borderRadius: 16,
              backgroundColor: tertiary,
              paddingVertical: 20,
              paddingHorizontal: 20,
              flexGrow: 1,
              gap: 10,
            }}
          >
            <Text style={{ color: "white", flexWrap: "wrap" }}>
              {recepientData?.email}
            </Text>
            <Text style={{ color: "white", flexWrap: "wrap" }}>
              {recepientData?.phoneNumber}
            </Text>
            <Text style={{ color: "white", flexWrap: "wrap" }}>
              {recepientData?.companyName}
            </Text>
          </View>
        </Pressable>
      </Modal>
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
          if (item.messageType == "text") {
            const isSelected = selectedMessages.includes(item._id);
            return (
              <Pressable
                onLongPress={() => handleSelectMessage(item)}
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
          <Feather
            style={{
              backgroundColor: secondary,
              borderRadius: 22,
              padding: 8,
            }}
            name="mic"
            size={22}
            color="white"
          />
          <Pressable
            onPress={() => handleSend("text")}
            style={{
              backgroundColor: secondary,
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

export default ChatMessagesScreen;
