const Entry = require('../models/Entry');

// Create new entry
const createEntry = async (req, res) => {
  try {
    const { distributor, inOut, location, barcodes } = req.body;
    const userName = req.user.name;

    // Validation
    if (!distributor || !inOut || !location || !barcodes || barcodes.length === 0) {
      return res.status(400).json({ 
        message: 'All fields are required: distributor, inOut, location, barcodes' 
      });
    }


    const entry = new Entry({
      userName,
      distributor,
      inOut,
      location,
      barcodes
    });

    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all entries (admin only)
const getAllEntries = async (req, res) => {
  try {
    const { search, distributor, inOut, date } = req.query;
    
    let filter = {};
    
    // Apply filters
    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { barcodes: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (distributor && distributor !== 'all') {
      filter.distributor = distributor;
    }
    
    if (inOut && inOut !== 'all') {
      filter.inOut = inOut;
    }
    
    if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
      filter.timestamp = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    const entries = await Entry.find(filter).sort({ timestamp: -1 });
    res.json(entries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's entries
const getUserEntries = async (req, res) => {
  try {
    const userName = req.user.name;
    const entries = await Entry.find({ userName }).sort({ timestamp: -1 });
    res.json(entries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createEntry, getAllEntries, getUserEntries };
