const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const topicRoutes = require('./routes/topics');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connection established successfully ✅'))
    .catch(err => console.error('🔴 MongoDB connection error:', err.message));

app.use('/users', userRoutes);
app.use('/posts', postRoutes);
app.use('/topics', topicRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});