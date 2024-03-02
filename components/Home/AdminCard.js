import { View, Image, Text, TouchableOpacity } from "react-native";
import adminIcon from "../../assets/admin.png";
import { accent, secondary, tertiary, vw } from "../../constants/style";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";

export default ({ handleRequestButton, admin, friendRequests, friends }) => {
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [isFriends, setIsFriends] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const isInFriendList = friends.some((friend) => friend == admin._id);
    setIsFriends(isInFriendList);
    // if (isInFriendList) {
    //   navigation.navigate("Messages", {
    //     recepientId: admin._id,
    //   });
    // }
  }, [friends]);

  useEffect(() => {
    setIsRequestSent(friendRequests.some((friend) => friend._id == admin._id));
  }, [friendRequests]);
  return (
    <>
      <View
        style={{
          height: 180,
          width: 180,
          overflow: "hidden",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
          borderRadius: 90,
        }}
      >
        <Image
          style={{
            height: 205,
            width: 205,
            objectFit: "cover",
          }}
          source={adminIcon}
        />
      </View>
      <Text
        style={{
          color: accent,
          fontSize: 35,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        Request Admin to connect
      </Text>
      {!isFriends ? (
        <TouchableOpacity
          onPress={
            !isRequestSent
              ? () => {
                  handleRequestButton(admin._id);
                  setIsRequestSent(true);
                }
              : null
          }
          style={{
            width: vw(50),
            backgroundColor: isRequestSent ? tertiary : secondary,
            paddingVertical: 15,
            marginTop: 20,
            borderRadius: 14,
          }}
        >
          <Text
            style={{
              color: isRequestSent ? accent : "white",
              fontSize: 20,
              fontWeight: "900",
              textAlign: "center",
            }}
          >
            {isRequestSent ? "Request Sent" : "Request Admin"}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("Messages", {
              recepientId: admin._id,
            })
          }
          style={{
            width: vw(50),
            backgroundColor: secondary,
            paddingVertical: 15,
            marginTop: 20,
            borderRadius: 14,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 20,
              fontWeight: "900",
              textAlign: "center",
            }}
          >
            Go to Chat
          </Text>
        </TouchableOpacity>
      )}
    </>
  );
};
