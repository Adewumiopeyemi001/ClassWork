const express = require('express');
const { signup, login, isVerifyOtp, resendOtp, forgetPassword, resetPassword, updateEmail, uploadPicture } = require('../Controller/class.controller');
const upload = require('../public/multer');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify', isVerifyOtp),
router.post('/newotp', resendOtp);
router.post('/forgetpassword', forgetPassword);
router.post('/resetpassword/:token', resetPassword);
router.put('/updateemail/:id', updateEmail);
router.put("/profilepic/:id", upload.single("profilePic"), uploadPicture);





module.exports = router;