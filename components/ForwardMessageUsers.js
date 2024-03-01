import React from "react";
import {View, Text, Pressable, Image, StyleSheet} from "react-native";

const ForwardMessageUsers = ({item, onPress}) => {
  return (
    <Pressable style={styles.container} onPress={() => onPress(item._id)}>
      <View>
        <Image style={styles.image} source={{uri: item.image}} />
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
    </Pressable>
  );
};

export default ForwardMessageUsers;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
    resizeMode: "cover",
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontWeight: "bold",
  },
  userEmail: {
    marginTop: 4,
    color: "gray",
  },
});
