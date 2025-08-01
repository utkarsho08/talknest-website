const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    title: { type: String, required: true, trim: true },
    text: { type: String },
    link: { type: String },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subreddit: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);