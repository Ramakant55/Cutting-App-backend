const User = require('../models/User');
const nodemailer = require('nodemailer');

// Create email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: true // Enable debug output
});

// Verify transporter connection
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Create user
    user = await User.create({
      name,
      email,
      phone,
      password
    });

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP via Email
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Your OTP Verification Code',
        html: `
          <h2>Welcome to ESI App!</h2>
          <p>Your OTP verification code is: <strong>${otp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        `
      };
      
      console.log('Sending email to:', email);
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully. Message ID:', info.messageId);
      
      // Log OTP to console for testing purposes
      console.log('=======================================');
      console.log(`OTP for ${email}: ${otp}`);
      console.log('=======================================');
    } catch (err) {
      console.error('Email sending failed. Detailed error:', err);
      // Continue with response even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'User registered. OTP sent for verification.',
      data: {
        userId: user._id
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if OTP is valid and not expired
    if (!user.otp.code || user.otp.code !== otp || new Date() > user.otp.expiresAt) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP'
      });
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp.code = null;
    user.otp.expiresAt = null;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      // Generate new OTP
      const otp = user.generateOTP();
      await user.save();

      // Send OTP via Email
      try {
        const mailOptions = {
          from: process.env.EMAIL_FROM,
          to: user.email,
          subject: 'Your OTP Verification Code',
          html: `
            <h2>Welcome to ESI App!</h2>
            <p>Your OTP verification code is: <strong>${otp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
          `
        };
        
        console.log('Sending login verification email to:', user.email);
        const info = await transporter.sendMail(mailOptions);
        console.log('Login verification email sent successfully. Message ID:', info.messageId);
        
        // Log OTP to console for testing purposes
        console.log('=======================================');
        console.log(`Login OTP for ${user.email}: ${otp}`);
        console.log('=======================================');
      } catch (err) {
        console.error('Login verification email sending failed. Detailed error:', err);
      }

      return res.status(401).json({
        success: false,
        error: 'Account not verified',
        data: {
          userId: user._id
        }
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP via Email
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: 'Your OTP Verification Code',
        html: `
          <h2>ESI App - OTP Resent</h2>
          <p>Your OTP verification code is: <strong>${otp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        `
      };
      
      console.log('Sending resend email to:', user.email);
      const info = await transporter.sendMail(mailOptions);
      console.log('Resend email sent successfully. Message ID:', info.messageId);
      
      // Log OTP to console for testing purposes
      console.log('=======================================');
      console.log(`Resend OTP for ${user.email}: ${otp}`);
      console.log('=======================================');
    } catch (err) {
      console.error('Resend email sending failed. Detailed error:', err);
    }

    res.status(200).json({
      success: true,
      message: 'OTP resent for verification'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  res
    .status(statusCode)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email
      }
    });
};
