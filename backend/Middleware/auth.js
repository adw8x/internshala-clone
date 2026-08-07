const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const uid = req.header("x-user-id");
    if (!uid) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    let name = req.header("x-user-name") || "";
    let photo = req.header("x-user-photo") || "";
    let email = req.header("x-user-email") || "";
    try {
      name = decodeURIComponent(name);
      photo = decodeURIComponent(photo);
      email = decodeURIComponent(email);
    } catch (e) {
      // ignore malformed header values
    }

    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      user = await User.create({ firebaseUid: uid, name, photo, email });
    }

    req.user = {
      id: user._id,
      name: user.name || name,
      photo: user.photo || photo,
      email: user.email || email,
      friends: user.friends || [],
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = authMiddleware;
