import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { primary } from "./constants/style";
import {
  ChatMessagesScreen,
  ChatsScreen,
  FriendsScreen,
  RegisterScreen,
  LoginScreen,
} from "./screens";
import RequestAdmin from "./screens/RequestAdmin";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";

const StackNavigator = () => {
  const Stack = createNativeStackNavigator();
  return (
    <View style={{ flex: 1, backgroundColor: primary }}>
      <NavigationContainer>
        <StatusBar style="light" />
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
          <Stack.Screen name="Home" component={RequestAdmin} />
          <Stack.Screen name="Friends" component={FriendsScreen} />
          <Stack.Screen name="Chats" component={ChatsScreen} />
          <Stack.Screen name="Messages" component={ChatMessagesScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
};

export default StackNavigator;
