import StackNavigator from "./StackNavigator";
import { UserContext } from "./UserContext";
import { usePreventScreenCapture } from "expo-screen-capture";
import { useEffect } from "react";
import RNCallKeep from "react-native-callkeep";

export default function App() {
  usePreventScreenCapture();

  // useEffect(() => {
  //   const options = {
  //     ios: {
  //       appName: "MajestiK",
  //     },
  //     android: {
  //       alertTitle: "Permissions required",
  //       alertDescription:
  //         "This application needs to access your phone accounts",
  //       cancelButton: "Cancel",
  //       okButton: "ok",
  //       imageName: "phone_account_icon",
  //     },
  //   };
  //   RNCallKeep.setup(options);
  //   RNCallKeep.setAvailable(true);
  // }, []);

  return (
    <>
      <UserContext>
        <StackNavigator />
      </UserContext>
    </>
  );
}
