import { StyleSheet, Dimensions } from "react-native";

const primary = "#202124";
const secondary = "#1f6feb";
const tertiary = "#3c4042";
const accent = "#bdc1c6";
const window = Dimensions.get("window");
const vh = (x = 1) => {
  return x * window.height * 0.01;
};
const vw = (x = 1) => {
  return x * window.width * 0.01;
};

export { primary, secondary, tertiary, accent, vw, vh };

const styleUtils = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  primaryScreen: { backgroundColor: primary, color: "#ffffff" },
  center: { justifyContent: "center", alignItems: "center" },
  Headers: { color: secondary, fontSize: 35, fontWeight: "900" },
  SubText: { color: accent, fontSize: 20, fontWeight: "600" },
});
export default styleUtils;
