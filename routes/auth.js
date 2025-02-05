import express from "express";
import {
  signup,
  login,
  logout,
  verifyOTP,
  resendOtp,
} from "../controllers/auth.js";


const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOtp);
router.post("/logout", logout);

export default router;
