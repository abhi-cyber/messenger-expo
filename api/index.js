const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const app = express();
const port = 8000;
const cors = require("cors");
app.use(cors());

const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(passport.initialize());
const jwt = require("jsonwebtoken");

mongoose
  .connect(
    "mongodb+srv://abhirajchatrath:abhirajmessenger@cluster0.wsz6c9u.mongodb.net/",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected to Mongo Db");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDb", err);
  });

// socket.io SETUP
io.on("connection", (socket) => {
  console.log("A user connected");

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

http.listen(port, "0.0.0.0", () => {
  console.log("Server running on port 8000");
});

const User = require("./models/user");
const Message = require("./models/message");

const sendVerificationEmail = (to, otp) => {
  const transporter = nodemailer.createTransport(
    smtpTransport({
      service: "gmail",
      auth: {
        user: "abhiraj.dev.work@gmail.com",
        pass: "aflnlzgaewkkalkd",
      },
    })
  );

  const mailOptions = {
    from: "abhiraj.dev.work@gmail.com",
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
  const {name, email, password, image} = req.body;

  try {
    // Check if the email is associated with a deleted account
    const existingUser = await User.findOne({email, isDeleted: true});

    if (existingUser) {
      await User.findByIdAndUpdate(existingUser._id, {isDeleted: false});
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
    const existingActiveUser = await User.findOne({email});

    if (existingActiveUser) {
      return res.status(400).json({message: "Email already registered"});
    }

    const otp = generateOTP();

    tempUsers[email] = {
      name,
      email,
      password,
      image,
      verificationCode: otp,
    };

    sendVerificationEmail(email, otp);

    res.status(200).json({
      message: "Verification email sent. Please check your email for the OTP.",
    });
  } catch (error) {
    console.log("Error registering user", error);
    res.status(500).json({message: "Error registering the user!"});
  }
});

app.post("/verify-otp", async (req, res) => {
  const {email, otp} = req.body;

  try {
    const tempUser = tempUsers[email];

    if (!tempUser) {
      return res.status(400).json({message: "User not found. Register first."});
    }

    console.log("Entered OTP:", otp);
    console.log("Stored OTP:", tempUser.verificationCode);

    // Convert the stored OTP to a string for comparison
    if (String(tempUser.verificationCode) !== otp) {
      console.log("Verification failed: Invalid OTP");
      return res.status(400).json({message: "Invalid OTP"});
    }

    if (tempUser.isVerified) {
      console.log("Verification failed: User already verified");
      return res.status(400).json({message: "User already verified"});
    }

    const newUser = new User({
      name: tempUser.name,
      email: tempUser.email,
      password: tempUser.password,
      image: tempUser.image,
      verificationCode: otp,
    });

    await newUser.save();

    tempUser.isVerified = true;

    delete tempUsers[email];

    console.log("Verification successful: User registered");

    res.status(200).json({message: "User successfully registered"});
  } catch (error) {
    console.error("Error verifying OTP", error);
    res.status(500).json({message: "Error verifying OTP"});
  }
});

app.post("/verify-email", async (req, res) => {
  const {email, verificationCode} = req.body;

  try {
    const user = await User.findOne({email, verificationCode});

    if (user) {
      user.verified = true;
      await user.save();

      res.status(200).json({message: "Email verified successfully"});
    } else {
      res.status(400).json({message: "Invalid verification code"});
    }
  } catch (error) {
    console.log("Error verifying email", error);
    res.status(500).json({message: "Error verifying email"});
  }
});

const createToken = (userId, userName, isAdmin) => {
  const payload = {
    userId: userId,
    userName: userName,
    isAdmin: isAdmin,
  };

  const token = jwt.sign(payload, "Q$r2K6W8n!jCW%Zk", {expiresIn: "1h"});

  return token;
};

app.post("/login", (req, res) => {
  const {email, password} = req.body;

  if (!email || !password) {
    return res
      .status(404)
      .json({message: "Email and the password are required"});
  }

  User.findOne({email})
    .then((user) => {
      if (!user) {
        return res.status(404).json({message: "User not found"});
      }

      if (user.password !== password) {
        return res.status(404).json({message: "Invalid Password!"});
      }

      const {_id, name, isAdmin} = user;
      const token = createToken(_id, name, isAdmin);
      res.status(200).json({token, userName: user.name, isAdmin});
    })
    .catch((error) => {
      console.log("error in finding the user", error);
      res.status(500).json({message: "Internal server Error!"});
    });
});

app.get("/users/:userId", (req, res) => {
  const loggedInUserId = req.params.userId;

  User.find({_id: {$ne: loggedInUserId}})
    .then((users) => {
      res.status(200).json(users);
    })
    .catch((err) => {
      console.log("Error retrieving users", err);
      res.status(500).json({message: "Error retrieving users"});
    });
});

app.post("/friend-request", async (req, res) => {
  const {currentUserId, selectedUserId} = req.body;

  try {
    await User.findByIdAndUpdate(selectedUserId, {
      $push: {freindRequests: currentUserId},
    });

    await User.findByIdAndUpdate(currentUserId, {
      $push: {sentFriendRequests: selectedUserId},
    });

    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.get("/friend-request/:userId", async (req, res) => {
  try {
    const {userId} = req.params;

    const user = await User.findById(userId)
      .populate("freindRequests", "name email image")
      .lean();

    const freindRequests = user.freindRequests;

    res.json(freindRequests);
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Internal Server Error"});
  }
});

app.post("/friend-request/accept", async (req, res) => {
  try {
    const {senderId, recepientId} = req.body;

    const sender = await User.findById(senderId);
    const recepient = await User.findById(recepientId);

    sender.friends.push(recepientId);
    recepient.friends.push(senderId);

    recepient.freindRequests = recepient.freindRequests.filter(
      (request) => request.toString() !== senderId.toString()
    );

    sender.sentFriendRequests = sender.sentFriendRequests.filter(
      (request) => request.toString() !== recepientId.toString()
    );

    await sender.save();
    await recepient.save();

    io.emit("friendRequestAccepted", {senderId, recepientId});

    res.status(200).json({message: "Friend Request accepted successfully"});
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Internal Server Error"});
  }
});

app.get("/accepted-friends/:userId", async (req, res) => {
  try {
    const {userId} = req.params;
    const user = await User.findById(userId).populate(
      "friends",
      "name email image"
    );
    const acceptedFriends = user.friends;
    res.json(acceptedFriends);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: "Internal Server Error"});
  }
});

const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "files/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({storage: storage});

app.post("/messages", upload.single("imageFile"), async (req, res) => {
  try {
    const {senderId, recepientId, messageType, messageText} = req.body;

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
      $inc: {unreadMessages: 1},
    });

    // Send back the saved message as a response
    res.status(200).json(newMessage);
  } catch (error) {
    console.log(error);
    res.status(500).json({error: "Internal Server Error"});
  }
});

app.get("/user/:userId", async (req, res) => {
  try {
    const {userId} = req.params;
    const recepientId = await User.findById(userId);
    res.json(recepientId);
  } catch (error) {
    console.log(error);
    res.status(500).json({error: "Internal Server Error"});
  }
});

app.delete("/users/:userId", async (req, res) => {
  try {
    const {userId} = req.params;
    await User.findByIdAndDelete(userId);
    res.status(200).json({message: "User deleted successfully"});
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({error: "Internal Server Error"});
  }
});

app.get("/messages/:senderId/:recepientId", async (req, res) => {
  try {
    const {senderId, recepientId} = req.params;
    const messages = await Message.find({
      $or: [
        {senderId: senderId, recepientId: recepientId},
        {senderId: recepientId, recepientId: senderId},
      ],
    }).populate("senderId", "_id name image");

    res.json(messages);

    await User.findByIdAndUpdate(recepientId, {unreadMessages: 0});
  } catch (error) {
    console.log(error);
    res.status(500).json({error: "Internal Server Error"});
  }
});

app.post("/deleteMessages", async (req, res) => {
  try {
    const {messages} = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({message: "Invalid req body!"});
    }

    await Message.deleteMany({_id: {$in: messages}});

    res.json({message: "Message deleted successfully"});
  } catch (error) {
    console.log(error);
    res.status(500).json({error: "Internal Server"});
  }
});

app.post("/forwardMessage", async (req, res) => {
  try {
    const {senderId, recepientId, forwardedMessages} = req.body;

    // Forward each selected message
    for (const messageId of forwardedMessages) {
      const message = await Message.findById(messageId);

      if (message) {
        const newForwardedMessage = new Message({
          senderId,
          recepientId,
          messageType: message.messageType,
          message: message.message,
          timestamp: new Date(),
          imageUrl: message.imageUrl,
          forwardedFrom: messageId, // Store the original message ID
        });

        await newForwardedMessage.save();

        // Emit the forwarded message to the recepient via socket.io
        io.emit("newForwardedMessage", newForwardedMessage);
      }
    }

    res.status(200).json({message: "Messages forwarded successfully"});
  } catch (error) {
    console.log(error);
    res.status(500).json({error: "Internal Server Error"});
  }
});

app.get("/friend-requests/sent/:userId", async (req, res) => {
  try {
    const {userId} = req.params;
    const user = await User.findById(userId)
      .populate("sentFriendRequests", "name email image")
      .lean();

    const sentFriendRequests = user.sentFriendRequests;

    res.json(sentFriendRequests);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({error: "Internal Server"});
  }
});

app.get("/friends/:userId", (req, res) => {
  try {
    const {userId} = req.params;

    User.findById(userId)
      .populate("friends")
      .then((user) => {
        if (!user) {
          return res.status(404).json({message: "User not found"});
        }

        const friendIds = user.friends.map((friend) => friend._id);

        res.status(200).json(friendIds);
      });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({message: "internal server error"});
  }
});
