const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/PawTime');

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    fullname: String,
    phoneNumber: String,
    role: String,
    plan: String,
    createdAt: Date,
    name: String,
    avatar: String
});

const petSchema = new mongoose.Schema({
    name: String,
    age: String,
    gender: String,
    imageURL: String
});

const User = mongoose.model('User', userSchema);
const Pet = mongoose.model('Pet', petSchema);

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to PawTime API');
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (user) {
            res.status(200).json({ message: 'Login successful', role: user.role });
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
            plan: 'none',
            createdAt: new Date(),
            name: '',
            avatar: ''
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});