const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const User = require('../models/adminNews'); // Adjust the path to your model
const fs = require('fs');

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Save file with current timestamp
    }
});

const upload = multer({ storage: storage }).single('image');

// User signup
exports.signup = async (req, res) => {
    try {
        const { email, phone, password } = req.body;
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });

        if (existingUser) {
            return res.status(400).json({ message: 'Email/Phone already exists' });
        }

        if (!password || !email || !phone) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            password: hashedPassword,
            email,
            phone,
        });
 
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).json({ message: error });
    }
};

// User login
exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_USER_SECRET, { expiresIn: '1h' });

        res.cookie('admins_token', token, {
            httpOnly: true,
            secure: true, // Set to true in production
            maxAge: 3 * 60 * 60 * 1000, // 3 hours
            sameSite: 'strict',
        });

        res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ message: error });
    }
};

// File upload (photo, title, and body text)
exports.uploadFile = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.log(err);
            
            return res.status(500).json({ message: 'Error uploading file' });
        }

        const { title, body } = req.body;
        const image = req.file;

        if (!title || !body || !image) {
            return res.status(400).json({ message: 'All fields are required (title, body, and image)' });
        }

        try {
            const userId = req.userId;  // Extracted from JWT in the middleware
            
            // Find the user by ID
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Check if user already has an image and delete it
            if (user.imageUrl) {
                const oldImagePath = path.join(__dirname, '..', 'uploads', path.basename(user.imageUrl));
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);  // Delete the old image file
                }
            }

            // Create the new image URL
            const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${image.filename}`;

            // Update the user with new title, body, and image URL
            user.title = title;
            user.body = body;
            user.imageUrl = imageUrl;
            await user.save();

            // Return a success response with the new image URL
            res.status(201).json({
                message: 'File uploaded and previous image deleted successfully!',
                imageUrl: imageUrl
            });
        } catch (error) {
            console.log(error);
            
            res.status(500).json({ message: 'Error saving data to the database' });
        }
    });
};

// Fetch and send news data without verification
exports.getNewsData = async (req, res) => {
    try {
        // Fetch the user's news data (without verifying userId)
        const user = await User.findOne().select('title body imageUrl');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return the news data
        res.status(200).json({
            title: user.title,
            body: user.body,
            imageUrl: user.imageUrl
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching data' });
    }
};