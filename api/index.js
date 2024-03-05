import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import passport from "passport";
import nodemailer from "nodemailer";
import cors from "cors";
import "dotenv/config";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import multer from "multer";
import User from "./models/user.js";
import Message from "./models/message.js";
import { Expo } from "expo-server-sdk";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);
// let expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
let expo = new Expo();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("./files"));
app.use(bodyParser.json());
app.use(passport.initialize());

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to Mongo Db");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDb", err);
  });

const userIdToSocketIdMap = new Map();
const socketIdToUserIdMap = new Map();

// socket.io SETUP
io.on("connection", (socket) => {
  console.log("A user connected");

  // webrtc
  socket.on("room:join", ({ userId, room }) => {
    userIdToSocketIdMap.set(userId, socket.id);
    socketIdToUserIdMap.set(socket.id, userId);
    // socket.leave(socket.room);
    const numClients = io.sockets.adapter.rooms[room]?.length || 0;
    if (numClients < 2) {
      socket.join(room);
      io.to(room).emit("user:joined", { id: socket.id });
      // socket.leave(room);
      return;
    }
    // io.to(socket.id).emit("room:join", data);
  });

  socket.on("room:join:admit", ({ id }) => {
    io.to(id).emit("user:admit", { id: socket.id });
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:notify", async ({ recepientId, userId }) => {
    const user = await User.findById(recepientId)
      .populate("expoPushTokens")
      .lean();
    const expoPushTokens = user.expoPushTokens;
    console.log("test", expoPushTokens);

    // for (let pushToken of expoPushTokens) {
    //   await expo.sendPushNotificationsAsync([
    //     {
    //       to: pushToken,
    //       sound: "default",
    //       title: "incoming call...",
    //       data: { recepientId: userId },
    //     },
    //   ]);
    // }
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("sendStream", ({ to }) => {
    io.to(to).emit("sendStream");
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  socket.on("call:end", ({ to }) => {
    io.to(to).emit("call:end");
  });
  // webrtc

  socket.on("newMessage", (response) => {
    try {
      const message = JSON.parse(response);
      console.log("Received new message:", message);
      // Emit the new message to all connected clients
      io.emit("newMessage", message);
    } catch (error) {
      console.error("Error parsing new message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

server.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "knightangle04@gmail.com",
    pass: "ppkrafdhfsvwdnjz",
  },
});

const sendVerificationEmail = (to, otp) => {
  const mailOptions = {
    from: "knightangle04@gmail.com",
    to,
    subject: "Email Verification",
    text: `Your verification code is: ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending verification email", error);
    } else {
      console.log("Verification email sent", info);
    }
  });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

const tempUsers = {};

app.post("/register", async (req, res) => {
  const { name, email, password, phoneNumber, userType, companyName } =
    req.body;

  try {
    const existingUser = await User.findOne({ email, isDeleted: true });

    if (existingUser) {
      await User.findByIdAndUpdate(existingUser._id, { isDeleted: false });
      const otp = generateOTP();

      tempUsers[email] = {
        name,
        email,
        password,
        image,
        verificationCode: otp,
      };

      sendVerificationEmail(email, otp);

      return res.status(200).json({
        message:
          "Verification email sent. Please check your email for the OTP.",
      });
    }

    // If the email is not associated with a deleted account, proceed with normal registration
    const existingActiveUser = await User.findOne({ email });

    if (existingActiveUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const otp = generateOTP();

    tempUsers[email] = {
      name,
      email,
      password,
      phoneNumber,
      userType,
      companyName,
      verificationCode: otp,
    };

    sendVerificationEmail(email, otp);

    res.status(200).json({
      message: "Verification email sent. Please check your email for the OTP.",
    });
  } catch (error) {
    console.log("Error registering user", error);
    res.status(500).json({ message: "Error registering the user!" });
  }
});

app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const tempUser = tempUsers[email];

    if (!tempUser) {
      return res
        .status(400)
        .json({ message: "User not found. Register first." });
    }

    // Convert the stored OTP to a string for comparison
    if (String(tempUser.verificationCode) != otp) {
      console.log("Verification failed: Invalid OTP");
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (tempUser.isVerified) {
      console.log("Verification failed: User already verified");
      return res.status(400).json({ message: "User already verified" });
    }

    const newUser = new User({
      name: tempUser.name,
      email: tempUser.email,
      password: tempUser.password,
      phoneNumber: tempUser.phoneNumber,
      userType: tempUser.userType,
      companyName: tempUser.companyName,
      verificationCode: otp,
    });

    await newUser.save();

    tempUser.isVerified = true;

    delete tempUsers[email];

    console.log("Verification successful: User registered");

    res.status(200).json({ message: "User successfully registered" });
  } catch (error) {
    console.error("Error verifying OTP", error);
    res.status(500).json({ message: "Error verifying OTP" });
  }
});

const createToken = (userId, userName, isAdmin) => {
  const payload = {
    userId,
    userName,
    isAdmin,
  };

  const token = jwt.sign(payload, "Q$r2K6W8n!jCW%Zk", { expiresIn: "1h" });
  return token;
};

app.post("/login", (req, res) => {
  const { email, password, expoPushToken } = req.body;

  if (!email || !password) {
    return res
      .status(404)
      .json({ message: "Email and the password are required" });
  }

  User.findOne({ email })
    .then(async (user) => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.password !== password) {
        return res.status(404).json({ message: "Invalid Password!" });
      }

      await User.findOneAndUpdate(
        { email },
        { $push: { expoPushTokens: expoPushToken } }
      );

      const token = createToken(user._id, user.name, user.isAdmin);
      res.status(200).json({ token, userName: user.name });
    })
    .catch((error) => {
      console.log("error in finding the user", error);
      res.status(500).json({ message: "Internal server Error!" });
    });
});

app.get("/users/:userId", async (req, res) => {
  const loggedInUserId = req.params.userId;

  try {
    const loggedInUser = await User.findById(loggedInUserId);

    if (!loggedInUser)
      return res.status(404).json({ message: "User not found" });

    let usersQuery = {};

    if (loggedInUser.isAdmin) {
      // If the logged-in user is an admin, retrieve all users except the logged-in one
      usersQuery = { _id: { $ne: loggedInUserId } };
    } else {
      // If the logged-in user is not an admin, retrieve only admin users
      usersQuery = { isAdmin: true };
    }

    const users = await User.find(usersQuery);
    res.status(200).json(users);
  } catch (error) {
    console.log("Error retrieving users", error);
    res.status(500).json({ message: "Error retrieving users" });
  }
});

app.post("/friend-request", async (req, res) => {
  const { currentUserId, selectedUserId } = req.body;

  try {
    User.findById(currentUserId)
      .populate("friends")
      .then(async (user) => {
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const friendIds = user.friends.map((friend) => friend._id);
        if (!friendIds.some((friend) => friend == selectedUserId)) {
          await User.findByIdAndUpdate(selectedUserId, {
            $push: { freindRequests: currentUserId },
          });

          await User.findByIdAndUpdate(currentUserId, {
            $push: { sentFriendRequests: selectedUserId },
          });

          res.sendStatus(200);
        }
      });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.get("/friend-request/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate("freindRequests", "name email")
      .lean();

    const freindRequests = user.freindRequests;

    res.json(freindRequests);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/friend-request/accept", async (req, res) => {
  try {
    const { senderId, recepientId } = req.body;

    const sender = await User.findById(senderId);
    const recepient = await User.findById(recepientId);

    sender.friends.push(recepientId);
    recepient.friends.push(senderId);

    recepient.freindRequests = recepient.freindRequests.filter(
      (request) => request.toString() != senderId.toString()
    );

    sender.sentFriendRequests = sender.sentFriendRequests.filter(
      (request) => request.toString() != recepientId.toString()
    );

    await sender.save();
    await recepient.save();
    io.emit("friendRequestAccepted", { senderId, recepientId });

    res.status(200).json({ message: "Friend Request accepted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/accepted-friends/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate("friends", "name email");
    const acceptedFriends = user.friends;
    res.json(acceptedFriends);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./files/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post("/messages", upload.single("imageFile"), async (req, res) => {
  try {
    const { senderId, recepientId, messageType, messageText } = req.body;

    const newMessage = new Message({
      senderId,
      recepientId,
      messageType,
      message: messageText,
      timestamp: new Date(),
      imageUrl: messageType === "image" ? req.file.path : null,
    });

    await newMessage.save();

    await User.findByIdAndUpdate(recepientId, {
      $inc: { unreadMessages: 1 },
    });

    // Send back the saved message as a response
    res.status(200).json(newMessage);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const recepientId = await User.findById(userId);
    res.json(recepientId);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/messages/:senderId/:recepientId", async (req, res) => {
  try {
    const { senderId, recepientId } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: senderId, recepientId: recepientId },
        { senderId: recepientId, recepientId: senderId },
      ],
    }).populate("senderId", "_id name image");

    res.json(messages);
    await User.findByIdAndUpdate(recepientId, { unreadMessages: 0 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/deleteMessages", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "Invalid req body!" });
    }

    await Message.deleteMany({ _id: { $in: messages } });

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server" });
  }
});

app.get("/friend-requests/sent/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate("sentFriendRequests", "name email")
      .lean();

    const sentFriendRequests = user.sentFriendRequests;

    res.json(sentFriendRequests);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: "Internal Server" });
  }
});

app.get("/friends/:userId", (req, res) => {
  try {
    const { userId } = req.params;

    User.findById(userId)
      .populate("friends")
      .then((user) => {
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const friendIds = user.friends.map((friend) => friend._id);

        res.status(200).json(friendIds);
      });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "internal server error" });
  }
});
