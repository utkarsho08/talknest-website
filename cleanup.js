const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const DB_URI = process.env.MONGO_URI;

const Topic = require('./models/topic.model');
const Post = require('./models/post.model');
const Comment = require('./models/comment.model');
const User = require('./models/user.model');

async function cleanDatabase() {
    if (!DB_URI) {
        console.error('Error: MONGO_URI is not defined in your .env file.');
        console.error('Please ensure your .env file has MONGO_URI set.');
        process.exit(1);
    }

    try {
        await mongoose.connect(DB_URI);
        console.log('MongoDB connection established successfully.');
        console.log(`Connected to database: ${mongoose.connection.db.databaseName}`);

        console.log('Deleting data from collections...');

        const commentsResult = await Comment.deleteMany({});
        console.log(`Deleted ${commentsResult.deletedCount} comments.`);

        const postsResult = await Post.deleteMany({});
        console.log(`Deleted ${postsResult.deletedCount} posts.`);

        const topicsResult = await Topic.deleteMany({});
        console.log(`Deleted ${topicsResult.deletedCount} topics.`);

        const usersResult = await User.deleteMany({});
        console.log(`Deleted ${usersResult.deletedCount} users.`);

        console.log('Database cleanup complete!');

    } catch (error) {
        console.error('Error during database cleanup:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

cleanDatabase();