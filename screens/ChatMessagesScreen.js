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
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import * as Clipboard from "expo-clipboard";
import { mediaDevices, RTCView } from "react-native-webrtc";
import PeerService from "../peer";

const ChatMessagesScreen = () => {
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
  const { recepientId } = route.params;
  const { userId, expoPushToken, isAdmin } = useUserId();

  // webrtc
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [localStream, setLocalStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [onCall, setOnCall] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(null);
  const [isCallNotificationSent, setIsCallNotificationSent] = useState(false);
  const peer = useRef(new PeerService());

  useEffect(() => {
    if (recepientId && userId) {
      const room =
        recepientId > userId ? recepientId + userId : userId + recepientId;
      socket.emit("room:join", { userId, room });
    }
  }, [recepientId, userId, socket, peer]);

  useEffect(() => {
    if (isCallNotificationSent && remoteSocketId) {
      handleCallUser();
    }
  }, [isCallNotificationSent, remoteSocketId, peer]);

  const handleUserJoined = useCallback(
    ({ id }) => {
      socket.emit("room:join:admit", { id });
      setRemoteSocketId(id);
    },
    [socket, peer]
  );

  const handleCallUser = useCallback(async () => {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    const offer = await peer.current.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setLocalStream(stream);
  }, [remoteSocketId, socket, peer]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      setLocalStream(stream);
      console.log(`Incoming Call`);
      setIsIncomingCall({ from, offer });
    },
    [socket, peer]
  );

  const handleCallAcceptButton = useCallback(async () => {
    setIsIncomingCall(null);
    const ans = await peer.current.getAnswer(isIncomingCall.offer);
    socket.emit("call:accepted", { to: isIncomingCall.from, ans });
    setOnCall(true);
  }, [socket, peer, isIncomingCall]);

  const sendStreams = useCallback(() => {
    if (!localStream) return;
    for (const track of localStream.getTracks()) {
      if (
        peer.current.peer
          .getSenders()
          .find(
            (sender) =>
              sender.track &&
              sender.track.kind === track.kind &&
              sender.track.id === track.id
          )
      )
        return;

      peer.current.peer.addTrack(track, localStream);
    }
  }, [localStream, peer]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.current.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
      socket.emit("sendStream", { to: from });
    },
    [sendStreams, peer]
  );

  const handleStream = useCallback(() => {
    setTimeout(() => {
      sendStreams();
    }, 500);
  }, [sendStreams, peer]);

  const handleCallEnd = useCallback(() => {
    peer.current.peer.close();
    peer.current = new PeerService();
    setLocalStream(null);
    setRemoteStream(null);
    setOnCall(false);
    setIsIncomingCall(null);
  }, [peer]);

  const handleUserAdmit = useCallback(
    ({ id }) => {
      setRemoteSocketId(id);
    },
    [peer]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.current.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket, peer]);

  useEffect(() => {
    peer.current.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.current.peer.removeEventListener(
        "negotiationneeded",
        handleNegoNeeded
      );
    };
  }, [handleNegoNeeded, peer]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.current.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket, peer]
  );

  const handleNegoNeedFinal = useCallback(
    async ({ ans }) => {
      await peer.current.setLocalDescription(ans);
    },
    [peer]
  );

  useEffect(() => {
    peer.current.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, [peer]);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("user:admit", handleUserAdmit);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("sendStream", handleStream);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    socket.on("call:end", handleCallEnd);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("user:admit", handleUserAdmit);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("sendStream", handleStream);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
      socket.off("call:end", handleCallEnd);
    };
  }, [
    socket,
    handleUserJoined,
    handleUserAdmit,
    handleIncommingCall,
    handleCallAccepted,
    handleStream,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
    handleCallEnd,
    peer,
  ]);
  // webrtc

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
        socket.emit("newMessage", newMessage);
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
          <Pressable
            onPress={() => {
              setOnCall((prev) => {
                if (prev) {
                  socket.emit("call:end", { to: remoteSocketId });
                  handleCallEnd();
                } else {
                  if (remoteSocketId) {
                    handleCallUser();
                  } else {
                    socket.emit("call:notify", { recepientId, userId });
                    setIsCallNotificationSent(true);
                  }
                }
                return !prev;
              });
            }}
          >
            {onCall ? (
              <View
                style={{
                  backgroundColor: "red",
                  borderRadius: 50,
                  height: 35,
                  width: 35,
                  justifyContent: "center",
                  alignItems: "center",
                  transform: [{ rotate: "180deg" }],
                }}
              >
                <MaterialIcons name="call-end" size={28} color="white" />
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: "green",
                  borderRadius: 50,
                  height: 35,
                  width: 35,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MaterialIcons name="call" size={28} color="white" />
              </View>
            )}
          </Pressable>
          <Pressable onPress={handleLogout}>
            <Text style={{ color: "white", fontSize: 18 }}>Logout</Text>
          </Pressable>
        </View>
      ),
    });
  }, [recepientData, socket, onCall, handleCallUser, remoteSocketId]);

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

    if (!result?.canceled) {
      handleSend("image", result.assets[0]?.uri);
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
      <Modal
        onRequestClose={null}
        transparent={true}
        visible={onCall || !!isIncomingCall}
      >
        {onCall && (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "space-around",
              backgroundColor: tertiary,
            }}
          >
            <View style={{ gap: 30 }}>
              <View
                style={{
                  height: 140,
                  width: 140,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "white",
                  borderRadius: 90,
                }}
              >
                <Image
                  style={{
                    height: recepientData?.isAdmin ? 150 : 86,
                    width: recepientData?.isAdmin ? 150 : 86,
                    objectFit: "cover",
                  }}
                  source={recepientData?.isAdmin ? adminAvatar : userAvatar}
                />
              </View>
              <Text style={{ color: "white", fontSize: 40, fontWeight: "700" }}>
                {recepientData?.isAdmin ? "Admin" : recepientData?.name}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                socket.emit("call:end", { to: remoteSocketId });
                handleCallEnd();
              }}
              style={{
                backgroundColor: "red",
                height: 70,
                width: 70,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 50,
                transform: [{ rotate: "180deg" }],
              }}
            >
              <MaterialIcons name="call-end" size={28} color="white" />
            </Pressable>
          </View>
        )}
        {isIncomingCall && (
          <View
            style={{
              height: 120,
              backgroundColor: tertiary,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              borderRadius: 20,
              marginHorizontal: 10,
            }}
          >
            <Text style={{ color: "white", fontSize: 28, fontWeight: "600" }}>
              Incoming call...
            </Text>
            <View style={{ flexDirection: "row", gap: 20 }}>
              <TouchableOpacity
                onPress={() => {
                  handleCallAcceptButton();
                }}
                style={{
                  backgroundColor: "green",
                  height: 50,
                  width: 50,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 50,
                }}
              >
                <MaterialIcons name="call" size={28} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  socket.emit("call:end", { to: remoteSocketId });
                  handleCallEnd();
                }}
                style={{
                  backgroundColor: "red",
                  height: 50,
                  width: 50,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 50,
                  transform: [{ rotate: "180deg" }],
                }}
              >
                <MaterialIcons name="call-end" size={28} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
      {localStream && (
        <RTCView
          // style={{ height: 50, width: 50 }}
          streamURL={localStream.toURL()}
        />
      )}
      {remoteStream && (
        <RTCView
          // style={{ height: 50, width: 50 }}
          streamURL={remoteStream.toURL()}
        />
      )}
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

export default ChatMessagesScreen;
