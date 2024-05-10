const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Register = require('../modules/UserSchema');
const Router = express.Router();
const secretKey = 'mytestsecretkey';

Router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await Register.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Create a JSON Web Token (JWT)
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      secretKey,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    res.status(200).json({ userId: user._id, token });
  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = Router;
