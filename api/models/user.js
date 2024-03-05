import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: Number,
  },
  userType: {
    type: String,
    default: "Corporate",
  },
  companyName: {
    type: String,
  },
  image: {
    type: String,
  },
  freindRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  sentFriendRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  isAdmin: {
    type: Boolean,
    default: false,
  },
  unreadMessages: {
    type: Number,
    default: 0,
  },
  location: {
    type: String,
  },
  expoPushTokens: {
    type: Array,
  },
});

const User = mongoose.model.User || mongoose.model("User", userSchema);

export default User;
