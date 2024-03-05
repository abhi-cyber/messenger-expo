import StackNavigator from "./StackNavigator";
import { UserContext } from "./UserContext";
import { usePreventScreenCapture } from "expo-screen-capture";

export default function App() {
  usePreventScreenCapture();

  return (
    <>
      <UserContext>
        <StackNavigator />
      </UserContext>
    </>
  );
}
