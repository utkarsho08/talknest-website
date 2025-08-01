const router = require('express').Router();
const auth = require('../middleware/auth');
const Topic = require('../models/topic.model');
const Post = require('../models/post.model');

router.post('/', auth, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Topic must have a name.' });
        }

        const existingTopic = await Topic.findOne({ name });
        if (existingTopic) {
            return res.status(400).json({ message: 'A topic with this name already exists.' });
        }

        const newTopic = new Topic({ name, creator: req.user.id, members: [req.user.id] });
        await newTopic.save();
        res.status(201).json(newTopic);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const topics = await Topic.find().sort({ name: 1 });
        res.json(topics);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/:name', async (req, res) => {
    try {
        const topic = await Topic.findOne({ name: req.params.name });
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found.' });
        }
        res.json(topic);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/:name/posts', async (req, res) => {
    try {
        const topic = await Topic.findOne({ name: req.params.name });
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found.' });
        }

        const posts = await Post.find({ subreddit: topic._id })
            .populate('author', 'username')
            .populate('subreddit', 'name')
            .sort({ createdAt: -1 });

        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;