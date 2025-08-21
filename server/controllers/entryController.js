const Entry = require('../models/Entry');

// Create new entry
const createEntry = async (req, res) => {
  try {
    const { distributor, inOut, location, barcode } = req.body;
    const userName = req.user.name;

    // Validation
    if (!distributor || !inOut || !location || !barcode) {
      return res.status(400).json({ 
        message: 'All fields are required: distributor, inOut, location, barcode' 
      });
    }


    const entry = new Entry({
      userName,
      distributor,
      inOut,
      location,
      barcode
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
    const { search, distributor, inOut, startDate, endDate } = req.query;
    
    let filter = {};
    
    // Apply filters
    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (distributor && distributor !== 'all') {
      filter.distributor = distributor;
    }
    
    if (inOut && inOut !== 'all') {
      filter.inOut = inOut;
    }
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
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
