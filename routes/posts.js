const router = require('express').Router();
const auth = require('../middleware/auth');
const Post = require('../models/post.model');
const Comment = require('../models/comment.model');
const Topic = require('../models/topic.model');

router.post('/', auth, async (req, res) => {
    try {
        const { title, text, link, topicName } = req.body;

        if (!title || !topicName || (!text && !link)) {
            return res.status(400).json({ message: 'Post must have a title, a topic, and either text or a link.' });
        }

        const topic = await Topic.findOne({ name: topicName });
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found.' });
        }

        const newPost = new Post({
            title,
            text,
            link,
            author: req.user.id,
            subreddit: topic._id
        });
        await newPost.save();
        res.status(201).json(newPost);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'username')
            .populate('subreddit', 'name')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'username')
            .populate('subreddit', 'name')
            .populate({
                path: 'comments',
                populate: { path: 'author', select: 'username' }
            });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(post);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/:id/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const userId = req.user.id;

        if (post.dislikes.includes(userId)) {
            post.dislikes.pull(userId);
        }

        if (post.likes.includes(userId)) {
            post.likes.pull(userId);
        } else {
            post.likes.push(userId);
        }

        await post.save();
        res.json({
            likes: post.likes.length,
            dislikes: post.dislikes.length,
            userLiked: post.likes.includes(userId),
            userDisliked: post.dislikes.includes(userId)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/:id/dislike', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const userId = req.user.id;

        if (post.likes.includes(userId)) {
            post.likes.pull(userId);
        }

        if (post.dislikes.includes(userId)) {
            post.dislikes.pull(userId);
        } else {
            post.dislikes.push(userId);
        }

        await post.save();
        res.json({
            likes: post.likes.length,
            dislikes: post.dislikes.length,
            userLiked: post.likes.includes(userId),
            userDisliked: post.dislikes.includes(userId)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/:postId/comments', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const { text, parentCommentId } = req.body;
        const newComment = new Comment({ text, author: req.user.id, post: req.params.postId, parentComment: parentCommentId || null });
        await newComment.save();

        if (parentCommentId) {
            const parentComment = await Comment.findById(parentCommentId);
            if (!parentComment) return res.status(404).json({ message: 'Parent comment not found' });
            parentComment.children.push(newComment._id);
            await parentComment.save();
        } else {
            post.comments.push(newComment._id);
            await post.save();
        }
        res.status(201).json(newComment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.patch('/:id', auth, async (req, res) => {
    try {
        const { text, link } = req.body;
        const postId = req.params.id;
        const userId = req.user.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        if (post.author.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to edit this post.' });
        }

        if (text !== undefined) {
            post.text = text;
        }
        if (link !== undefined) {
            post.link = link;
        }

        await post.save();
        res.json({ message: 'Post updated successfully', post });
    } catch (err) {
        console.error("Edit Post Error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        if (post.author.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to delete this post.' });
        }

        await Comment.deleteMany({ post: postId });

        await Post.deleteOne({ _id: postId });

        res.json({ message: 'Post deleted successfully.' });
    } catch (err) {
        console.error("Delete Post Error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;