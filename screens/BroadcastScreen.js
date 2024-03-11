import React, {useState, useContext, useEffect} from "react";
import {
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Text,
} from "react-native";
import {Entypo} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {io} from "socket.io-client";
import EmojiSelector from "react-native-emoji-selector";
import {Feather} from "@expo/vector-icons";
import {UserType} from "../UserContext";
import axios from "axios";

const socket = io("http://192.168.130.175:8000");

const BroadcastScreen = () => {
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const {userId, setUserId} = useContext(UserType);
  const [recipientIds, setRecipientIds] = useState([]);

  // Fetch all recipient IDs
  useEffect(() => {
    axios
      .get(`http://192.168.130.175:8000/users/${userId}`)
      .then((response) => {
        const ids = response.data.map((user) => user._id);
        setRecipientIds(ids);
      })
      .catch((error) => {
        console.log("Error retrieving users:", error);
      });
  }, [userId]);

  const handleSend = async (messageType, imageUri) => {
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

        const response = await fetch("http://192.168.130.175:8000/messages", {
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
      }
    } catch (error) {
      console.log("error in sending the message", error);
    }
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

  const handleEmojiPress = () => {
    setShowEmojiSelector(!showEmojiSelector);
  };

  return (
    <KeyboardAvoidingView style={{flex: 1, backgroundColor: "#F0F0F0"}}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 10,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: "#dddddd",
            marginBottom: showEmojiSelector ? 0 : 25,
          }}>
          <Entypo
            onPress={handleEmojiPress}
            style={{marginRight: 5}}
            name="emoji-happy"
            size={24}
            color="gray"
          />

          <TextInput
            value={message}
            onChangeText={(text) => setMessage(text)}
            style={{
              flex: 1,
              height: 40,
              borderWidth: 1,
              borderColor: "#dddddd",
              borderRadius: 20,
              paddingHorizontal: 10,
            }}
            placeholder="Type Your message..."
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
              marginHorizontal: 8,
            }}>
            <Entypo onPress={pickImage} name="camera" size={24} color="gray" />

            <Feather name="mic" size={24} color="gray" />
          </View>

          <Pressable
            onPress={() => handleSend("text")}
            style={{
              backgroundColor: "#007bff",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 20,
            }}>
            <Text style={{color: "white", fontWeight: "bold"}}>Send</Text>
          </Pressable>
        </View>
        {showEmojiSelector && (
          <EmojiSelector
            onEmojiSelected={(emoji) => {
              setMessage((prevMessage) => prevMessage + emoji);
            }}
            style={{height: 250}}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default BroadcastScreen;
