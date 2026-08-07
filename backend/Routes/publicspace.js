const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Share = require('../models/Share');
const PostingLimit = require('../Middleware/postingLimit');
const auth = require('../Middleware/auth');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter,
});

router.post('/upload', auth, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(201).json({ url, filename: req.file.filename });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(400).json({ error: 'Upload failed' });
  }
});

router.post('/', auth, PostingLimit, async (req, res) => {
  try {
    const { content, media } = req.body;
    const userId = req.user.id;

    const post = new Post({
      content,
      media,
      author: userId,
    });

    await post.save();
    await post.populate('author', 'name photo');
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: 'Invalid request' });
  }
});

router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'name photo')
      .lean();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.get('/:postId/comments', async (req, res) => {
  try {
    const postId = req.params.postId;
    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: 1 })
      .populate('author', 'name photo')
      .lean();
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/:postId/comment', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.postId;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = await Comment.create({
      content,
      post: postId,
      author: userId,
    });

    await comment.populate('author', 'name photo');
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ error: 'Invalid request' });
  }
});

router.post('/:postId/like', auth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const existingLike = await Like.findOne({ post: postId, user: userId });
    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });
      const post = await Post.findById(postId).select('likesCount');
      return res.status(200).json({ message: 'Unliked', likesCount: post.likesCount });
    }

    const like = new Like({ post: postId, user: userId });
    await like.save();
    await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });
    const post = await Post.findById(postId).select('likesCount');
    res.status(201).json({ message: 'Liked', likesCount: post.likesCount });
  } catch (error) {
    res.status(400).json({ error: 'Invalid request' });
  }
});

router.post('/:postId/share', auth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const share = new Share({
      post: postId,
      user: userId,
    });

    await share.save();
    await Post.findByIdAndUpdate(postId, { $inc: { sharesCount: 1 } });
    const updatedPost = await Post.findById(postId).select('sharesCount');
    res.status(201).json({ message: 'Shared', sharesCount: updatedPost.sharesCount });
  } catch (error) {
    res.status(400).json({ error: 'Invalid request' });
  }
});

router.delete('/:postId', auth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await post.deleteOne();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
