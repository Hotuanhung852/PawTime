const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const PayOS = require('@payos/node');
const payos = new PayOS('d8fbeec4-8d3a-4a7c-b177-0a46e5fa0896', 'a09098fb-48b0-4d15-b074-d3800c8d2130', '7b5f734b79d1afeaee6d138c1f67dcca92443080cd56c23778f44f835faa1c50');
const YOUR_DOMAIN = 'http://localhost:3000';
require('dotenv').config();

const app = express();
const port = 3000;

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_CONNECT_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB successfully');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
};


connectDB();


// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../'))); // Serve static files from the root directory
app.use('/Admin', express.static(path.join(__dirname, 'Admin')));

// MongoDB connection
// mongoose.connect('mongodb://localhost:27017/PawTime');

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
    id: String,
    name: String, // Tên thú cưng
    isCat: Boolean, // Kiểu thú cưng (true là mèo, false là chó)
    weight: String, // Cân nặng thú cưng
    gender: String, // Giới tính thú cưng
    phone: String, // Số điện thoại liên lạc
    date: { type: Date, default: Date.now }, // Ngày (với giá trị mặc định là ngày hiện tại)
    imageURL: String, // URL hình ảnh
    details: String, // Chi tiết về thú cưng
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

const dropInVisitSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Add userId field
    petType: [String],
    spacesRequired: String,
    dropInVisitAddress: String,
    serviceFrequency: String,
    fromDate: String,
    toDate: String,
    startDate: String,
    dropInVisitCondition: String,
    days: [String],
    createdAt: { type: Date, default: Date.now }
});

const petSitterRequestSchema = new mongoose.Schema({
    petBoardingId: { type: mongoose.Schema.Types.ObjectId, ref: 'PetBoarding', required: true },
    petSitterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'approved', 'disapproved'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const houseSittingRequestSchema = new mongoose.Schema({
    houseSittingId: { type: mongoose.Schema.Types.ObjectId, ref: 'HouseSitting', required: true },
    petSitterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'approved', 'disapproved'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const transactionSchema = new mongoose.Schema({
    image: String,
    product: String,
    price: String,
    creation_date: String,
    description: String,
    account_number: String,
    account_name: String,
    order_code: String,
    status: String
});

const User = mongoose.model('User', userSchema);
const Pet = mongoose.model('Pet', petSchema);
const PetBoarding = mongoose.model('PetBoarding', petBoardingSchema);
const HouseSitting = mongoose.model('HouseSitting', houseSittingSchema);
const DropInVisit = mongoose.model('DropInVisit', dropInVisitSchema);
const PetSitterRequest = mongoose.model('PetSitterRequest', petSitterRequestSchema);
const HouseSittingRequest = mongoose.model('HouseSittingRequest', houseSittingRequestSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

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

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (user) {
            const redirectUrl = user.role === 'admin' ? '/Admin/admin.html' : '/index.html'; // Adjust the URL as needed
            res.status(200).json({ message: 'Login successful', role: user.role, userId: user._id, redirectUrl });
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
    console.log('Fetching profile for userId:', userId); // Debugging

    try {
        const user = await User.findById(userId);
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user profile:', error); // Debugging
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
        const avatarUrl = `uploads/${req.file.filename}`;
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
        console.log('Pet Boarding Details:', petBoardingDetails); // Log the details for debugging
        res.status(200).json(petBoardingDetails);
    } catch (error) {
        console.error('Error fetching pet boarding details:', error); // Log the error for debugging
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

// routes get pet by id
app.get("/pet/:id", async (req, res) => {
    const { id } = req.params; // Lấy id từ params
    try {
        // Tìm thú cưng theo trường id trong schema
        const pet = await Pet.findOne({ id: id });
        if (pet) {
            res.json(pet); // Trả về dữ liệu thú cưng
        } else {
            res.status(404).json({ message: "Pet not found" });
        }
    } catch (error) {
        console.error("Error fetching pet:", error); // Log lỗi để debug
        res.status(500).json({ message: "Something went wrong", error });
    }
});

// Route thêm thú cưng (nên là /pets)
app.post("/pets", async (req, res) => {
    try {
        // Tìm pet cuối cùng trong database để lấy id hiện tại
        const lastPet = await Pet.findOne().sort({ id: -1 });

        // Tự động tạo id mới, tăng thêm 1 so với id của pet cuối cùng
        const newId = lastPet ? parseInt(lastPet.id) + 1 : 1; // Nếu không có pet nào, id sẽ bắt đầu từ 1

        const petData = {
            id: newId.toString(), // Đảm bảo id là chuỗi
            name: req.body.name,
            isCat: req.body.isCat,
            weight: req.body.weight,
            gender: req.body.gender,
            phone: req.body.phone,
            date: req.body.date,
            imageURL: req.body.imageURL,
            details: req.body.details,
        };

        const newPet = new Pet(petData);
        await newPet.save();
        res.status(201).json({ message: "Pet added successfully", pet: newPet });
    } catch (error) {
        console.error("Error adding pet:", error);
        res
            .status(500)
            .json({ message: "Something went wrong", error: error.message });
    }
});

// delete pet route
app.delete("/pets/:id", async (req, res) => {
    const petId = req.params.id; // Lấy id từ tham số

    try {
        const result = await Pet.deleteOne({ id: petId });

        if (result.deletedCount > 0) {
            return res
                .status(200)
                .json({ message: `Pet with ID ${petId} deleted successfully.` });
        } else {
            return res.status(404).json({ message: "Pet not found." });
        }
    } catch (error) {
        console.error("Error deleting pet:", error);
        return res
            .status(500)
            .json({ message: "Something went wrong", error: error.message });
    }
});

// Update pet route
app.put("/pet/:id", async (req, res) => {
    const { id } = req.params;
    const { name, weight, gender, phone, date, imageURL, details } = req.body;

    console.log("Received update request for pet ID:", id); // In ID để kiểm tra
    console.log("Update data:", req.body); // In ra dữ liệu nhận được

    try {
        const updateData = {};

        // Thêm kiểm tra xem các trường có hợp lệ không
        if (name) updateData.name = name;
        if (weight) updateData.weight = weight;
        if (gender) updateData.gender = gender;
        if (phone) updateData.phone = phone;
        if (date) updateData.date = new Date(date); // Chuyển đổi date sang dạng Date
        if (imageURL) updateData.imageURL = imageURL;
        if (details) updateData.details = details;

        // Kiểm tra xem có trường nào để cập nhật không
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No fields to update" });
        }

        // Tìm và cập nhật pet
        const pet = await Pet.findOneAndUpdate({ id: id }, updateData, {
            new: true,
            runValidators: true, // Chạy các validator nếu có
        });

        if (pet) {
            res.status(200).json({ message: "Pet updated successfully", pet });
        } else {
            res.status(404).json({ message: "Pet not found" });
        }
    } catch (error) {
        console.error("Error updating pet:", error);
        res
            .status(500)
            .json({ message: "Something went wrong", error: error.message });
    }
});

// Route to get all pets
app.get("/pets", async (req, res) => {
    try {
        const pets = await Pet.find();
        res.status(200).json(pets);
    } catch (error) {
        res.status(500).json({ message: "Something went wrong", error });
    }
});

app.post('/api/drop-in-visits', async (req, res) => {
    try {
        const dropInVisit = new DropInVisit(req.body);
        await dropInVisit.save();
        res.status(201).send(dropInVisit);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.delete('/api/drop-in-visits/:id', async (req, res) => {
    try {
        const dropInVisit = await DropInVisit.findByIdAndDelete(req.params.id);
        if (!dropInVisit) {
            return res.status(404).send();
        }
        res.status(200).send(dropInVisit);
    } catch (error) {
        res.status(500).send(error);
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

// Route to get all drop-in visits
app.get('/api/drop-in-visits', async (req, res) => {
    try {
        const dropInVisits = await DropInVisit.find().sort({ createdAt: -1 });
        res.status(200).json(dropInVisits);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to get house sitting details for a specific user
app.get('/house-sitting/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const houseSittingDetails = await HouseSitting.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(houseSittingDetails);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to get drop-in visit details for a specific user
app.get('/api/drop-in-visits/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const dropInVisitDetails = await DropInVisit.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(dropInVisitDetails);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to create a pet sitter request
app.post('/pet-sitter-request', async (req, res) => {
    const { petBoardingId, petSitterId } = req.body;
    try {
        const newRequest = new PetSitterRequest({ petBoardingId, petSitterId });
        await newRequest.save();
        res.status(201).json({ message: 'Request submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to get pet sitter requests for a specific pet boarding
app.get('/pet-sitter-requests/:petBoardingId', async (req, res) => {
    const { petBoardingId } = req.params;
    try {
        const requests = await PetSitterRequest.find({ petBoardingId }).populate('petSitterId');
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to update the status of a pet sitter request
app.put('/pet-sitter-request/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const request = await PetSitterRequest.findByIdAndUpdate(id, { status }, { new: true });
        if (status === 'accepted') {
            await PetSitterRequest.updateMany({ petBoardingId: request.petBoardingId, _id: { $ne: id } }, { status: 'disapproved' });
        }
        res.status(200).json({ message: 'Request status updated successfully', request });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to cancel a pet sitter request
app.post('/pet-sitter-request/cancel', async (req, res) => {
    const { petBoardingId, petSitterId } = req.body;
    try {
        const result = await PetSitterRequest.deleteOne({ petBoardingId, petSitterId });
        if (result.deletedCount > 0) {
            res.status(200).json({ message: 'Request canceled successfully' });
        } else {
            res.status(404).json({ message: 'Request not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to get pet sitter requests for a specific pet sitter
app.get('/pet-sitter-requests/sitter/:petSitterId', async (req, res) => {
    const { petSitterId } = req.params;
    try {
        const requests = await PetSitterRequest.find({ petSitterId, status: 'pending' });
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to create a house sitting request
app.post('/house-sitting-request', async (req, res) => {
    const { houseSittingId, petSitterId } = req.body;
    try {
        const newRequest = new HouseSittingRequest({ houseSittingId, petSitterId });
        await newRequest.save();
        res.status(201).json({ message: 'Request submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to get house sitting requests for a specific house sitting
app.get('/house-sitting-requests/:houseSittingId', async (req, res) => {
    const { houseSittingId } = req.params;
    try {
        const requests = await HouseSittingRequest.find({ houseSittingId }).populate('petSitterId');
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to update the status of a house sitting request
app.put('/house-sitting-request/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const request = await HouseSittingRequest.findByIdAndUpdate(id, { status }, { new: true });
        if (status === 'accepted') {
            await HouseSittingRequest.updateMany({ houseSittingId: request.houseSittingId, _id: { $ne: id } }, { status: 'disapproved' });
        }
        res.status(200).json({ message: 'Request status updated successfully', request });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to cancel a house sitting request
app.post('/house-sitting-request/cancel', async (req, res) => {
    const { houseSittingId, petSitterId } = req.body;
    try {
        const result = await HouseSittingRequest.deleteOne({ houseSittingId, petSitterId });
        if (result.deletedCount > 0) {
            res.status(200).json({ message: 'Request canceled successfully' });
        } else {
            res.status(404).json({ message: 'Request not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to get house sitting requests for a specific pet sitter
app.get('/house-sitting-requests/sitter/:petSitterId', async (req, res) => {
    const { petSitterId } = req.params;
    try {
        const requests = await HouseSittingRequest.find({ petSitterId, status: 'pending' });
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to get user counts by role
app.get('/user-counts', async (req, res) => {
    try {
        const guestCount = await User.countDocuments({ role: 'guest' });
        const petSitterCount = await User.countDocuments({ role: 'pet_sitter' });
        res.status(200).json({ guestCount, petSitterCount });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to get all users with role "guest"
app.get('/users/guests', async (req, res) => {
    try {
        const users = await User.find({ role: 'guest' }, 'username fullname phoneNumber createdAt status avatar');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to delete a user by ID
app.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await User.findByIdAndDelete(id);
        if (result) {
            res.status(200).json({ message: 'User deleted successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Route to get all users with role "pet_sitter"
app.get('/users/petsitters', async (req, res) => {
    try {
        const users = await User.find({ role: 'pet_sitter' }, 'username fullname phoneNumber createdAt avatar');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

app.post('/create-payment-link0', async (req, res) => {
    const order = {
        amount: 10000,
        description: 'PawTime 1 Week Try Out',
        orderCode: Date.now(), // Use a timestamp to ensure uniqueness
        returnUrl: `https://pawtime-service.onrender.com/success.html`,
        cancelUrl: `https://pawtime-service.onrender.com`
    };

    try {
        const paymentLink = await payos.createPaymentLink(order);
        res.redirect(303, paymentLink.checkoutUrl);
    } catch (error) {
        console.error('Error creating payment link:', error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
});

app.post('/create-payment-link', async (req, res) => {
    const order = {
        amount: 600000,
        description: 'PawTime Basic Plan',
        orderCode: Date.now(), // Use a timestamp to ensure uniqueness
        returnUrl: `https://pawtime-service.onrender.com/success.html`,
        cancelUrl: `https://pawtime-service.onrender.com`
    };

    try {
        const paymentLink = await payos.createPaymentLink(order);
        res.redirect(303, paymentLink.checkoutUrl);
    } catch (error) {
        console.error('Error creating payment link:', error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
});

app.post('/create-payment-link2', async (req, res) => {
    const order = {
        amount: 3000000,
        description: 'PawTime Standard Plan',
        orderCode: Date.now(), // Use a timestamp to ensure uniqueness
        returnUrl: `https://pawtime-service.onrender.com/success.html`,
        cancelUrl: `https://pawtime-service.onrender.com`
    };

    try {
        const paymentLink = await payos.createPaymentLink(order);
        res.redirect(303, paymentLink.checkoutUrl);
    } catch (error) {
        console.error('Error creating payment link:', error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
});

app.post('/create-payment-link3', async (req, res) => {
    const order = {
        amount: 3600000,
        description: 'PawTime Premium Plan',
        orderCode: Date.now(), // Use a timestamp to ensure uniqueness
        returnUrl: `https://pawtime-service.onrender.com/success.html`,
        cancelUrl: `https://pawtime-service.onrender.com`
    };

    try {
        const paymentLink = await payos.createPaymentLink(order);
        res.redirect(303, paymentLink.checkoutUrl);
    } catch (error) {
        console.error('Error creating payment link:', error);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
});

app.post('/add-transactions', async (req, res) => {
    const transactions = req.body; // Assuming the JSON data is sent in the request body

    try {
        await Transaction.insertMany(transactions);
        res.status(201).json({ message: 'Transactions added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

app.get('/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find();
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Start the server
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
module.exports = connectDB;