const Event = require('../models/event');

// @desc    Create a new mentor workshop/event
// @route   POST /api/events/create
// @access  Private (Mentors only)
const createEvent = async (req, res) => {
  const { title, description, date, duration, meetingLink } = req.body;
  const mentorId = req.user._id;

  try {
    if (!title || !description || !date) {
      return res.status(400).json({ success: false, message: 'Title, description, and date are required' });
    }

    const event = await Event.create({
      title,
      description,
      mentorId,
      date: new Date(date),
      duration: duration || 60,
      meetingLink: meetingLink || ''
    });

    res.status(201).json({
      success: true,
      message: 'Mentorship event created successfully!',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Get all active mentorship events
// @route   GET /api/events/all
// @access  Private
const getAllEvents = async (req, res) => {
  try {
    // Return all events scheduled for today or in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = await Event.find({ date: { $gte: today } })
      .populate('mentorId', 'name email profilePhoto department')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Fetch events error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Register for an event
// @route   POST /api/events/register/:id
// @access  Private
const registerForEvent = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.mentorId.toString() === userId.toString()) {
      return res.status(400).json({ success: false, message: 'You are the mentor hosting this event' });
    }

    if (event.attendees.includes(userId)) {
      return res.status(400).json({ success: false, message: 'You are already registered for this event' });
    }

    event.attendees.push(userId);
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Registered for event successfully!',
      event
    });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  registerForEvent
};
