const mongoose = require("mongoose");
require("dotenv").config();

const url = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/internshala";

module.exports.connect = async () => {
  try {
    await mongoose.connect(url);
    console.log("Database is connected");
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
};