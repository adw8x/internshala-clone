const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Account = require("../models/Account");

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await Account.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const account = await Account.create({
      email: String(email).toLowerCase(),
      name: name || String(email).split("@")[0],
      passwordHash,
      role: role === "admin" ? "admin" : "user",
      provider: "password",
    });

    res.status(201).json({
      user: { email: account.email, name: account.name, role: account.role },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const account = await Account.findOne({ email: String(email).toLowerCase() });
    if (!account || !account.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(String(password), account.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({
      user: { email: account.email, name: account.name, role: account.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/google-login", async (req, res) => {
  try {
    const { email, name, photo, firebaseUid } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    let account = await Account.findOne({ email: String(email).toLowerCase() });
    let created = false;

    if (!account) {
      account = await Account.create({
        email: String(email).toLowerCase(),
        name: name || String(email).split("@")[0],
        photo,
        firebaseUid,
        role: "user",
        provider: "google",
      });
      created = true;
    } else {
      account.name = name || account.name;
      account.photo = photo || account.photo;
      account.firebaseUid = firebaseUid;
      account.provider = "google";
      await account.save();
    }

    res.json({
      user: {
        email: account.email,
        name: account.name,
        role: account.role,
        created,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
