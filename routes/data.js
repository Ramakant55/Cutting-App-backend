const express = require('express');
const {
  createData,
  getData,
  getSingleData,
  updateData,
  deleteData
} = require('../controllers/dataController');

// Import Data model for the edit route
const Data = require('../models/Data');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

router
  .route('/')
  .get(getData)
  .post(createData);

// Add edit route
router.route('/edit').put((req, res) => {
  // For now, let's implement the edit logic directly in the route
  // Later you can move this to a proper controller function
  try {
    const userId = req.user.id;
    
    // Check if this is a clearAll request
    if (req.body.clearAll === true) {
      Data.findOne({ user: userId }).then(data => {
        if (data) {
          // Reset the numbers map to empty
          data.numbers = new Map();
          data.save();
          return res.status(200).json({ success: true, numbers: {} });
        }
        return res.status(200).json({ success: true, numbers: {} });
      });
      return;
    }
    
    // Regular edit request
    const numberKey = req.body.numberKey;
    const value = Number(req.body.value);
    if (!numberKey || isNaN(value)) {
      return res.status(400).json({ success: false, error: 'numberKey (string) and value (number) are required.' });
    }
    
    Data.findOne({ user: userId }).then(data => {
      if (!data) {
        // Create data entry if it doesn't exist
        Data.create({ user: userId, numbers: { [numberKey]: value } }).then(newData => {
          res.status(200).json({ success: true, numbers: Object.fromEntries(newData.numbers) });
        });
      } else {
        data.numbers.set(numberKey, value);
        data.save().then(() => {
          res.status(200).json({ success: true, numbers: Object.fromEntries(data.numbers) });
        });
      }
    }).catch(err => {
      console.error(err);
      res.status(500).json({ success: false, error: 'Server error' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Add route to reset a specific number's value
router.route('/reset/:numberKey').put((req, res) => {
  try {
    const userId = req.user.id;
    const numberKey = req.params.numberKey;
    const value = Number(req.body.value || 50); // Default to 50 if not specified
    
    if (!numberKey) {
      return res.status(400).json({ success: false, error: 'Number key is required' });
    }
    
    Data.findOne({ user: userId }).then(data => {
      if (!data) {
        return res.status(404).json({ success: false, error: 'No data found for this user' });
      }
      
      // Set the number to the specified value directly
      data.numbers.set(numberKey, value);
      data.save().then(() => {
        res.status(200).json({ success: true, numbers: Object.fromEntries(data.numbers) });
      });
    }).catch(err => {
      console.error(err);
      res.status(500).json({ success: false, error: 'Server error' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Add delete number route
router.route('/delete/:numberKey').delete((req, res) => {
  try {
    const userId = req.user.id;
    const numberKey = req.params.numberKey;
    
    if (!numberKey) {
      return res.status(400).json({ success: false, error: 'Number key is required' });
    }
    
    Data.findOne({ user: userId }).then(data => {
      if (!data || !data.numbers.has(numberKey)) {
        return res.status(404).json({ success: false, error: 'Number key not found' });
      }
      
      // Delete the number key from the map
      data.numbers.delete(numberKey);
      data.save().then(() => {
        res.status(200).json({ success: true, numbers: Object.fromEntries(data.numbers) });
      });
    }).catch(err => {
      console.error(err);
      res.status(500).json({ success: false, error: 'Server error' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router
  .route('/:id')
  .get(getSingleData)
  .put(updateData)
  .delete(deleteData);

module.exports = router;
