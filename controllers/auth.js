import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOTP, sendVerificationEmail } from "../utils/email.js";

export const signup = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const user = new User({
      email,
      password,
      role,
      otp,
      otpExpires: Date.now() + 10 * 60 * 1000,
    });
    await user.save();
    await sendOTP(email, otp);

    res
      .status(201)
      .json({ success: true, message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong" });
    console.log("Error in signup: ", error);
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email, otpExpires: { $gt: Date.now() } });
    if (!user || user.otp !== otp) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "User verified successfully" });

    await sendVerificationEmail(email);
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong" });
    console.log("Error in verifyOTP: ", error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your email first" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.json({
      success: true,
      message: "User logged in successfully",
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong" });
    console.log("Error in login: ", error);
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ sucess: false, message: "User does not exist" });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "User is already verified" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    await sendOTP(email, otp);

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong" });
    console.log("Error in resendOtp: ", error);
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    res
      .status(200)
      .json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong" });
    console.log("Error in logout: ", error);
  }
};
