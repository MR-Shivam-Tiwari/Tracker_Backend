const express = require('express');
const router = express.Router();
const User = require('../modules/UserSchema'); 
const bcrypt = require('bcrypt');

router.post('/confirm-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Check if all required parameters are present
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Find user by email
    const user = await User.findOne({ email });
  
    // If user not found, return error
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if OTP matches
    if (user.resetOTP !== otp ) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password and clear resetOTP
    user.password = hashedPassword;
    user.resetOTP = null;
    await user.save();

    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
