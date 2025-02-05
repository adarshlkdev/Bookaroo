import Event from "../models/Event.js";

export const createEvent = async (req, res) => {
  try {
    const { title, description, date, venue, ticketTypes } = req.body;
    const banner = req.file ? req.file.path : undefined;

    const event = new Event({
      title,
      description,
      date,
      venue,
      organizer: req.user.userId,
      ticketTypes,
      banner,
    });

    await event.save();
    res
      .status(201)
      .json({ success: true, message: "Event created successfully", event });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong" });
    console.log("Error in createEvent: ", error);
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("organizer", "email");
    res.status(200).json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong" });
    console.log("Error in getEvents: ", error);
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.organizer.toString() !== req.user.userId) {
      return res
        .status(401)
        .json({ message: "You are not authorized to update this event" });
    }

    const updates = { ...req.body };
    if (req.file) {
      updates.banner = req.file.path;
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      updatedEvent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong" });
    console.log("Error in updateEvent: ", error);
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    if (event.organizer.toString() !== req.user.userId) {
      return res
        .status(401)
        .json({ message: "You are not authorized to delete this event" });
    }

    await Event.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong" });
    console.log("Error in deleteEvent: ", error);
  }
};
