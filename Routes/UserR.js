const express = require("express");
const UserSchema = require("../modules/UserSchema");
const bcrypt = require("bcrypt");

const Router = express.Router();

// Registration route
Router.post("/registration", async (req, res) => {
  const { name, mobilenumber, email, password, userRole } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await UserSchema.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: "User already registered" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new UserSchema({
      name,
      mobilenumber,
      email,
      password: hashedPassword,
      userRole,
    });

    await newUser.save();
    res.status(201).json({ message: "Registration successful" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user route
Router.put("/users/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Find the user by ID
    const user = await UserSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user properties
    if (req.body.name) user.name = req.body.name;
    if (req.body.mobilenumber) user.mobilenumber = req.body.mobilenumber;
    if (req.body.profilePic) user.profilePic = req.body.profilePic;
    if (req.body.department) user.department = req.body.department;
    if (req.body.designation) user.designation = req.body.designation;

    await user.save();

    res.json(user);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get user by ID route
Router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await UserSchema.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get all user data route
Router.get("/userData", async (req, res) => {
  try {
    const allUserData = await UserSchema.find({}, { _id: 1, name: 1, email: 1, userRole: 1 });
    res.json(allUserData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get user names and emails route
Router.get("/registeredNames", async (req, res) => {
  try {
    const userNamesEmail = await UserSchema.find({}, { _id: 1, name: 1, email: 1 });
    res.json(userNamesEmail);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update user role by ID route
Router.put("/updateUserRole/:id", async (req, res) => {
  const { id } = req.params;
  const { userRole } = req.body;

  try {
    if (!userRole) {
      return res.status(400).json({ message: "userRole is required" });
    }

    const updatedUser = await UserSchema.findByIdAndUpdate(id, { userRole: userRole }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete user by ID route
Router.delete("/users/:id", async (req, res) => {
  try {
    const user = await UserSchema.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = Router;
