const jwt = require('jsonwebtoken');

// User login (name only)
const userLogin = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required' });
    }

    const token = jwt.sign(
      { name: name.trim(), type: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        name: name.trim(),
        type: 'user'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin login (key-based)
const adminLogin = async (req, res) => {
  try {
    const { key } = req.body;
    
    if (!key || key !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ message: 'Invalid admin key' });
    }

    const token = jwt.sign(
      { type: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        type: 'admin'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { userLogin, adminLogin };
