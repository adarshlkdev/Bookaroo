import express from "express";
import {
  createBooking,
  getBooking,
  confirmBooking,
} from "../controllers/booking.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.post("/confirm", protect, confirmBooking);
router.get("/:id", protect, getBooking);

export default router;
