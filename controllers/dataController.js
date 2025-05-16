const Data = require('../models/Data');
const User = require('../models/User');

// @desc    Create new data entry
// @route   POST /api/data
// @access  Private
exports.createData = async (req, res) => {
  try {
    const userId = req.user.id;
    const numberKey = req.body.numberKey; // e.g., '01'
    const value = Number(req.body.value); // e.g., 50
    if (!numberKey || isNaN(value)) {
      return res.status(400).json({ success: false, error: 'numberKey (string) and value (number) are required.' });
    }
    let data = await Data.findOne({ user: userId });
    if (!data) {
      data = await Data.create({ user: userId, numbers: { [numberKey]: value } });
    } else {
      // If isAddValue is true, add to existing value, otherwise just set the value
      const isAddValue = req.body.isAddValue === true;
      if (isAddValue) {
        data.numbers.set(numberKey, (data.numbers.get(numberKey) || 0) + value);
      } else {
        data.numbers.set(numberKey, value);
      }
      await data.save();
    }
    res.status(201).json({
      success: true,
      numbers: Object.fromEntries(data.numbers)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get all data for logged in user
// @route   GET /api/data
// @access  Private
exports.getData = async (req, res) => {
  try {
    const data = await Data.findOne({ user: req.user.id });
    res.status(200).json({
      success: true,
      numbers: data ? Object.fromEntries(data.numbers) : {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get single data entry
// @route   GET /api/data/:id
// @access  Private
exports.getSingleData = async (req, res) => {
  try {
    const data = await Data.findById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Data not found'
      });
    }

    // Make sure user owns the data
    if (data.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this data'
      });
    }

    res.status(200).json({
      success: true,
      data: data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Update data entry
// @route   PUT /api/data/:id
// @access  Private
exports.updateData = async (req, res) => {
  try {
    let data = await Data.findById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Data not found'
      });
    }

    // Make sure user owns the data
    if (data.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this data'
      });
    }

    data = await Data.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Delete data entry
// @route   DELETE /api/data/:id
// @access  Private
exports.deleteData = async (req, res) => {
  try {
    const data = await Data.findById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Data not found'
      });
    }

    // Make sure user owns the data
    if (data.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this data'
      });
    }

    await data.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};
