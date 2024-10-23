const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../'))); // Serve static files from the root directory

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/PawTime');

// Define Schemas and Models
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    fullname: String,
    phoneNumber: String,
    role: String,
    plan: String,
    createdAt: Date,
    name: String,
    avatar: String,
    bio: String,
    birthday: Date,
    email: String,
    socialLinks: {
        facebook: String,
        instagram: String,
        tiktok: String,
        twitter: String,
    },
});

const petSchema = new mongoose.Schema({
    name: String,
    age: String,
    gender: String,
    imageURL: String,
});

const petBoardingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    petType: String,
    petCount: Number,
    address: String,
    dropOffDate: Date,
    pickUpDate: Date,
    condition: String,
    createdAt: { type: Date, default: Date.now }
});

const houseSittingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    petType: String,
    petCount: Number,
    address: String,
    dropOffDate: Date,
    pickUpDate: Date,
    condition: String,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Pet = mongoose.model('Pet', petSchema);
const PetBoarding = mongoose.model('PetBoarding', petBoardingSchema);
const HouseSitting = mongoose.model('HouseSitting', houseSittingSchema);

// Set up storage for uploaded images using multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage: storage });

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html')); // Serve index.html for the root route
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (user) {
            res.status(200).json({ message: 'Login successful', role: user.role, userId: user._id });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Register route
app.post('/register', async (req, res) => {
    const { username, password, fullname, phoneNumber } = req.body;
    try {
        const newUser = new User({
            username,
            password,
            fullname,
            phoneNumber,
            role: 'guest',
            plan: 'Guest',
            createdAt: new Date(),
            name: '',
            avatar: '',
            bio: '',
            birthday: null,
            email: '',
            socialLinks: {
                facebook: '',
                instagram: '',
                tiktok: '',
                twitter: '',
            },
        });
        await newUser.save();
        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to get all pets
app.get('/pets', async (req, res) => {
    try {
        const pets = await Pet.find();
        res.status(200).json(pets);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to get user profile
app.get('/profile/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId);
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to update user profile
app.put('/profile/:userId', async (req, res) => {
    const { userId } = req.params;
    const { fullname, phoneNumber, name, avatar, bio, birthday, email, socialLinks } = req.body;

    try {
        const user = await User.findByIdAndUpdate(userId, { fullname, phoneNumber, name, avatar, bio, birthday, email, socialLinks }, { new: true });
        if (user) {
            res.status(200).json({ message: 'Profile updated successfully', user });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to handle avatar upload
app.post('/upload-avatar/:userId', upload.single('avatar'), async (req, res) => {
    const { userId } = req.params;
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const avatarUrl = `/uploads/${req.file.filename}`;
        const user = await User.findByIdAndUpdate(userId, { avatar: avatarUrl }, { new: true });
        if (user) {
            res.status(200).json({ message: 'Avatar uploaded successfully', avatarUrl });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to handle pet boarding form submission
app.post('/pet-boarding', async (req, res) => {
    const { userId, petType, petCount, address, dropOffDate, pickUpDate, condition } = req.body;
    try {
        const newPetBoarding = new PetBoarding({
            userId,
            petType,
            petCount,
            address,
            dropOffDate,
            pickUpDate,
            condition
        });
        await newPetBoarding.save();
        res.status(201).json({ message: 'Booking successful' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to get pet boarding details for a specific user
app.get('/pet-boarding/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const petBoardingDetails = await PetBoarding.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(petBoardingDetails);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to get all pet boarding details
app.get('/pet-boarding', async (req, res) => {
    try {
        const petBoardingDetails = await PetBoarding.find().sort({ createdAt: -1 });
        res.status(200).json(petBoardingDetails);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to delete a pet boarding entry
app.delete('/pet-boarding/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await PetBoarding.findByIdAndDelete(id);
        res.status(200).json({ message: 'Pet boarding entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to upgrade user to pet sitter role
app.post('/upgrade-to-pet-sitter/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { role: 'pet_sitter' },
            { new: true }
        );
        
        if (user) {
            res.status(200).json({ 
                message: 'Successfully upgraded to pet sitter',
                user 
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Modify your login route to include more user information
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (user) {
            // Store more user information in the response
            res.status(200).json({ 
                message: 'Login successful',
                userId: user._id,
                role: user.role,
                username: user.username
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to get all pet boarding details
app.get('/all-pet-boarding', async (req, res) => {
    try {
        const petBoardingDetails = await PetBoarding.find().sort({ createdAt: -1 });
        res.status(200).json(petBoardingDetails);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to get user details by userId
app.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId);
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to handle pet boarding form submission
app.post('/pet-boarding', async (req, res) => {
    const { userId, petType, petCount, address, dropOffDate, pickUpDate, condition } = req.body;
    try {
        const newPetBoarding = new PetBoarding({
            userId,
            petType,
            petCount,
            address,
            dropOffDate,
            pickUpDate,
            condition
        });
        await newPetBoarding.save();
        res.status(201).json({ message: 'Booking successful' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to handle house sitting form submission
app.post('/house-sitting', async (req, res) => {
    const { userId, petType, petCount, address, dropOffDate, pickUpDate, condition } = req.body;
    try {
        const newHouseSitting = new HouseSitting({
            userId,
            petType,
            petCount,
            address,
            dropOffDate,
            pickUpDate,
            condition
        });
        await newHouseSitting.save();
        res.status(201).json({ message: 'Booking successful' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to get all house sitting details
app.get('/house-sitting', async (req, res) => {
    try {
        const houseSittingDetails = await HouseSitting.find().sort({ createdAt: -1 });
        res.status(200).json(houseSittingDetails);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to delete a house sitting entry
app.delete('/house-sitting/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await HouseSitting.findByIdAndDelete(id);
        res.status(200).json({ message: 'House sitting entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});