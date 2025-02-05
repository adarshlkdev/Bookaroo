import express from "express";
import {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
} from "../controllers/event.js";
import { protect, authorize } from "../middlewares/auth.js";
import { upload } from "../utils/clodinary.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("organizer", "admin"),
  upload.single("banner"),
  createEvent
);

router.get("/", getEvents);

router.put(
  "/:id",
  protect,
  authorize("organizer", "admin"),
  upload.single("banner"),
  updateEvent
);

router.delete("/:id", protect, authorize("organizer", "admin"), deleteEvent);

export default router;
