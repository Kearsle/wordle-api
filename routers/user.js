const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const auth = require("../middleware/auth");
const { access } = require("fs");

const loginRateLimit = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 1000000, // change to 10
  message: { error: "Too many login attempts. Please try again later." },
});
const registerRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50000000, // change to 5
  message: { error: "Too many register attempts. Please try again later." },
});

// Ping
router.get("/", async (req, res) => {
  console.log("Status 200: Ping");
  res.status(200).send({ message: "pong" });
});

// User Create

router.post("/user/create", registerRateLimit, async (req, res) => {
  try {
    var userData = req.body;
    userData.role = 0;
    userData.tokens = [];
    // Check if username or email is taken
    if (!userData.username || !userData.email) {
      return res.status(400).send({ error: "Failed to create a new user!" });
    }
    const usernameAvailable = await User.usernameAvailablity(userData.username);
    const emailAvailable = await User.emailAvailablity(userData.email);

    if (!usernameAvailable && !emailAvailable) {
      return res
        .status(401)
        .send({ error: "Username and Email is already used." });
    } else if (!usernameAvailable) {
      return res.status(401).send({ error: "Username is already used." });
    } else if (!emailAvailable) {
      return res.status(401).send({ error: "Email is already used." });
    }

    const user = new User(userData);
    await user.save();
    console.log("Status 201: Created a new user!");
    res.status(201).send({ success: "User Registered" });
  } catch (errors) {
    console.log("Status 400: Failed to create a new user!");
    res.status(400).send({ error: "Failed to create account." });
  }
});

// User Login

router.post("/user/login", loginRateLimit, async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    // User authentication
    const user = await User.findByCredentials(username.toLowerCase(), password);
    if (!user) {
      return res
        .status(401)
        .send({ error: "Login Failed! Check your Credentials" });
    }

    // Tokens
    const userID = user._id;
    const accessToken = await User.createAccessToken(userID);
    const refreshToken = await User.createRefreshToken(userID);

    console.log(`Status 200: ${username} successfully logged in!`);
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(200).send({
      userID: userID,
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (errors) {
    console.log(`Status 400: Login failed for ${req.body.username}`);
    console.log(errors);
    res.status(400).send({ errors });
  }
});

// User Logout

router.delete("/user/logout", auth.authenticateToken, async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const userID = req.userToken.userID;
    if (!refreshToken) {
      return res.status(401).send({ error: "Refresh Token was not sent." });
    }
    if (!(await User.checkRefreshToken(userID, refreshToken))) {
      return res.status(403).send({ error: "Refresh Token Incorrect." });
    }
    await User.deleteRefreshToken(userID, refreshToken);
    res.cookie("accessToken", "", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      expires: new Date(0),
    });
    res.cookie("refreshToken", "", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      expires: new Date(0),
    });
    res.status(200).send({ success: "User logged out." });
  } catch (errors) {
    console.log(errors);
    res.status(400).send({ errors });
  }
});

// User Logout All

router.delete("/user/logoutAll", auth.authenticateToken, async (req, res) => {
  try {
    const userID = req.userToken.userID;
    const deletedRefreshTokens = await User.deleteAllRefreshTokens(userID);
    if (!deletedRefreshTokens) {
      return res.status(403).send({ error: "Incorrect information." });
    }
    res.status(200).send({ success: "User logged out of all devices." });
  } catch (errors) {
    res.status(400).send({ errors });
  }
});

// User Delete

router.delete("/user/delete", auth.authenticateToken, async (req, res) => {
  try {
    const userID = req.userToken.userID;
    const userDeleted = await User.deleteUser(userID);

    if (!userDeleted) {
      console.log("Status 401: Failed to delete user.");
      return res.status(401).send({ error: "Failed to delete user." });
    }

    res.status(200).send({ success: "Account deleted." });
  } catch (errors) {
    console.log("Status 401: Failed to delete user.");
    res.status(401).send({ error: "Failed to delete user." });
  }
});

// New Access Token

router.get("/user/loggedIn", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.send(false);
    }
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (error, userToken) => {
        if (error) {
          return res.send(false);
        }
        if (!(await User.checkRefreshToken(userToken.userID, refreshToken))) {
          return res.send(false);
        }
        const accessToken = await User.createAccessToken(userToken.userID);
        res.cookie("accessToken", accessToken, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
        });
        res.send(true);
      }
    );
  } catch (errors) {
    res.send(false);
  }
});

module.exports = router;
