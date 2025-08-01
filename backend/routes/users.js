const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/user.model');
const Post = require('../models/post.model');
const Comment = require('../models/comment.model');

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) return res.status(400).json({ message: "Please enter all fields." });
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) return res.status(400).json({ message: "User with this email or username already exists." });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Please enter all fields." });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "Server configuration error: JWT_SECRET not set." });
        }

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user._id, username: user.username } });
    } catch (err) {
        console.error("LOGIN CATCH ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id/profile', auth, async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const userPosts = await Post.find({ author: userId })
            .populate('subreddit', 'name')
            .sort({ createdAt: -1 });

        const userComments = await Comment.find({ author: userId, parentComment: null })
            .populate('post', 'title')
            .sort({ createdAt: -1 });

        res.json({
            user,
            posts: userPosts,
            comments: userComments
        });
    } catch (err) {
        console.error("Profile Fetch Error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;