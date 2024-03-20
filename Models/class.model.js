const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    userName: {
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
    otp: {
        type: String,
        // required: true,
    },
    resetPasswordToken: {
        type: String,
        // required: true,
    },
    resetPasswordExpires: {
        type: Date,
    },
    isVerified: {
        type: Boolean,
        required: true,
        default: false,
    },
    profilePic: {
        type: String,
        // required: true,
      },
    otpExpiration: {
        type: Date,
    },
 
}, {
    versionKey: false,
    timestamps: true,
});

const user = mongoose.model("user", userSchema);
module.exports = user;