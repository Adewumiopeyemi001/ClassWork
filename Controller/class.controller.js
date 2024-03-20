const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('../public/cloudinary');
const jwt = require("jsonwebtoken");
const User = require('../Models/class.model');
const OTP_EXPIRATION_TIME_MINUTES = 5;




exports.signup = async (req, res) => {
    try {
      const { userName, password, email } = req.body;
  
      if (!userName || !password || !email) { 
        return res
          .status(400)
          .json({ message: "Please provide username, password, and email" });
      }
  
      // Password validation: Must contain at least one uppercase, one lowercase, one number, and one special character
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message:
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
        });
      }
  
      const user = await User.findOne({ email });
      if (user) {
        return res.status(409).json({ message: "User already exists" });
      };
  
      // Generate OTP
      const generateOTP = () => {
        const digits = '0123456789';
        let OTP = '';
        for (let i = 0; i < 6; i++) {
          OTP += digits[Math.floor(Math.random() * 10)];
        }
        return OTP;
      };
  
      const otp = generateOTP();
  
      const otpExpiration = new Date();
      otpExpiration.setMinutes(otpExpiration.getMinutes() + OTP_EXPIRATION_TIME_MINUTES); // Set expiration time
  
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      const newUser = new User({
        userName,
        password: hashedPassword,
        email,
        otp,
        otpExpiration,
        token,
      });
      await newUser.save();
  

      return res
        .status(201)
        .json({ message: "User saved successfully", newUser });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error saving user", err });
    }
  };

  exports.login = async (req, res) => {
    try {
      const {userName, password} = req.body;
      if(!userName || !password) {
        res.status(400).json({message: "Please input your username and password"});
      }
  // Find The User By Email In the Database
      const user = await User.findOne({ userName });
    
      // If you are not a user, sign up
      if(!user) {
        res.status(404).json({message: "User Not Found, Please SignUp"});
      }
  
      if (!user.isVerified) {
        return res.status(404).json({ message: "User Not Verified, Please check your email"});
      }
  
      const correctPassword = await bcrypt.compare(password, user.password);
      if (!correctPassword) {
        return res.status(400).json({message: "Incorrect Password"});
      }
  
      // Generate a token
      const token = jwt.sign({ userId: user._id}, process.env.SECRET_KEY, {
        expiresIn: "2h"  // Token expiration time
      });
      return res.status(200).json({message: "User Logged in Successfully", token: token, user});
  
    }catch (err) {
      console.log(err);
      return res.status(500).json({message: "Error Logging In User", err})
    }
  };

  exports.isVerifyOtp = async (req, res) => {
    try {
      const otp = req.query.otp;
    if (!otp) {
      return res.status(400).json({message: "Please input Your Otp"})
    }console.log(otp)
    const user = await User.findOne({otp: otp});
    if (!user) {
      return res.status(400).json({message: "User With That Otp Not Found"});
    }
  
  // Check if the OTP has expired
  const currentTime = new Date();
  if (user.otpExpiration && currentTime > user.otpExpiration) {
    return res.status(400).json({ message: "OTP has expired, please request a new one" });
  }
  
    if (user.otp !== otp) {
      return res.status(400).json({message: "Invalid OTP"});
    }
    user.isVerified = true;
    user.otpExpiration = null;
    user.otp = null;
  
    await user.save();
  
    return res.status(200).json({message: "OTP Verified successfully"});
    }catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Error Verfying OTP"});
    }
  };

  exports.resendOtp = async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "User Not Found" });
      }
      
      // Check if previous OTP has expired
      const now = new Date();
      if (user.otpExpiration && user.otpExpiration > now) {
        return res.status(400).json({ message: "Previous OTP has not expired yet" });
      }
  
      const generateOTP = () => {
      const digits = '0123456789';
      let OTP = '';
      for (let i = 0; i < 6; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
      }
      return OTP;
      };
  
      // Generate new OTP and update expiration time
      const otp = generateOTP();
      const otpExpiration = new Date();
      otpExpiration.setMinutes(otpExpiration.getMinutes() + OTP_EXPIRATION_TIME_MINUTES);
  
      user.otp = otp;
      user.otpExpiration = otpExpiration;
      user.isVerified = false;
      await user.save();
    
      return res.status(200).json({ message: "New OTP sent successfully", user });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error sending OTP" });
    }
  };

  exports.forgetPassword = async (req, res) => {
    try {
        const {email} = req.body;
        if (!email) {
          return res.status(400).json({message: "Please Input Your Email"});
        }
        const user = await User.findOne({ email });
        if (!user) {
          return res.status(400).json({message: "User Not Found"});
        }
        // Generate a token for password reset
      const token = uuidv4(); // Generate UUID token
  
      // Save the token in the user document (if necessary)
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; // Token expiration time (1 hour)
  
      await user.save();

      return res.status(200).json({ message: "Check Your Mail To Reset Your Password", user});
  
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error resetting password", err });
    }
  };

  exports.resetPassword = async (req, res) => {
    try {
      const token = req.params.token;
      const { newPassword, confirmPassword} = req.body;
      if (!token) {
        return res.status(400).json({message: "Please Input Your Reset Token"});
      }
      const user = await User.findOne({ resetPasswordToken: token });
      if (!user) {
        return res.status(400).json({message: "User Not Found"});
      }
      
      if (newPassword !== confirmPassword) {
        return res.status(400).json({message: "Password Does Not Match"});
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.resetPasswordExpires = null,
      user.resetPasswordExpires = null,
      user.save();
  
      return res.status(200).json({message: "Password Reset Successfully", user})
  
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Error Updating password", err });
    }
  };

  exports.updateEmail = async (req, res) => {
    try {
      const id = req.params.id;
      const { newEmail } = req.body;
  
      if (!newEmail) {
        return res.status(404).json({message: "Please provide your New Email"});
      }
      const user = await User.findByIdAndUpdate({_id: id}, {email: newEmail}, {new: true});
      if (!user) {
        return res.status(404).json({message: "User Not Found"});
      }
      user.email = newEmail;
      await user.save();
      return res.status(200).json({message: "Email Updated Successfully", user});
    }catch (err) {
      return res.status(500).json({message: "Error Updating Email", err});
    }
  };

  exports.uploadPicture = async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.params.id });
      if (!user) {
        return errorResMsg(res, 400, "User not found");
      }
      const result = await cloudinary.v2.uploader.upload(req.file.path);
      const updatedUser = await User.findByIdAndUpdate(
        {
          _id: req.params.id,
        },
        { profilePic: result.secure_url },
        {
          isNew: true,
        }
      );
  
      return res
        .status(200)
        .json({
          message: "Profile Pictur Saved Successfully",
          data: updatedUser,
        });
    } catch (err) {
      // console.log(error);
      console.error(err);
      return res
        .status(500)
        .json({ message: "Error Uploading Profile Picture", err });
    }
  };