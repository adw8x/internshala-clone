const Post = require('../models/Post');
const User = require('../models/User');

const postingLimitMiddleware = async (req, res, next) => {
  try {
    // 1. Get the user ID from the request (assumes auth middleware sets req.user)
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    // 2. Fetch the user document to get friend count
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const friendCount = user.friends?.length || 0;

    // 3. Count posts made by this user today
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

    const postCount = await Post.countDocuments({
      author: userId,
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });

    // 4. Apply posting limits based on friend count
    // - 0 friends: cannot post
    // - 1 friend: 1 post per day
    // - 2 friends: 2 posts per day
    // - 3-10 friends: one post per friend per day
    // - More than 10 friends: unlimited posts
    let maxPosts;
    if (friendCount === 0) {
      return res.status(403).json({
        error:
          "You need at least 1 friend to post in Public Space. Add friends to unlock posting!"
      });
    } else if (friendCount === 1) {
      maxPosts = 1;
    } else if (friendCount === 2) {
      maxPosts = 2;
    } else if (friendCount >= 3 && friendCount <= 10) {
      maxPosts = friendCount;
    } else {
      // friendCount > 10
      maxPosts = 1000; // effectively unlimited for practical purposes
    }

    if (postCount >= maxPosts) {
      return res.status(429).json({
        error: `Daily posting limit exceeded (max ${maxPosts} posts per day)`
      });
    }

    next();
  } catch (error) {
    console.error('Posting limit middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = postingLimitMiddleware;