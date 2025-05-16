const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = req.user;
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update user details
// @route   PUT /api/users/updatedetails
// @access  Private
router.put('/updatedetails', protect, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Fields to update
    const fieldsToUpdate = {
      name: name || req.user.name,
      email: email || req.user.email
    };
    
    const user = await req.user.constructor.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
