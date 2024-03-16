import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { primary } from "./constants/style";
import {
  ChatMessagesScreen,
  RegisterScreen,
  LoginScreen,
  HomeScreen,
  RequestsScreen,
  BroadcastScreen,
} from "./screens";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import RNCallKeep from "react-native-callkeep";

const StackNavigator = () => {
  return (
    <View style={{ flex: 1, backgroundColor: primary }}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Navigator />
      </NavigationContainer>
    </View>
  );
};

const Navigator = () => {
  const Stack = createNativeStackNavigator();
  const responseListener = useRef();
  const navigation = useNavigation();

  useEffect(() => {
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.isCallNotification) {
          navigation.navigate("Messages", {
            recepientId: data.recepientId,
          });
        }
      });

    return () => {
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // useEffect(() => {
  //   RNCallKeep.addEventListener("answerCall", null);
  //   RNCallKeep.addEventListener("endCall", null);

  //   RNCallKeep.startCall("hello sir", null, "hello sir");

  //   RNCallKeep.displayIncomingCall(
  //     "hello sir",
  //     "hello sir",
  //     "hello sir",
  //     "number",
  //     true,
  //     null
  //   );
  //   RNCallKeep.backToForeground();

  //   return () => {
  //     RNCallKeep.removeEventListener("answerCall", null);
  //     RNCallKeep.removeEventListener("endCall", null);
  //   };
  // }, []);

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Request" component={RequestsScreen} />
      <Stack.Screen name="Messages" component={ChatMessagesScreen} />
      <Stack.Screen name="Broadcast" component={BroadcastScreen} />
    </Stack.Navigator>
  );
};

export default StackNavigator;
