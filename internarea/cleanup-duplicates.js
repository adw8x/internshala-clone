const mongoose = require("mongoose");

const MONGODB_URI = "mongodb+srv://1adwaith122333_db_user:Ulwr50Q3nqlOFkUC@cluster0.epnyqpy.mongodb.net/internshala?retryWrites=true&w=majority&appName=Cluster0";

async function cleanup() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const accounts = await db.collection("accounts").find({}).toArray();
  console.log("Total accounts: " + accounts.length);

  const seen = new Map();
  const toDelete = [];

  for (const acc of accounts) {
    const lowerName = (acc.name || "").toLowerCase().trim();
    if (!lowerName) continue;
    if (seen.has(lowerName)) {
      toDelete.push(acc._id);
      console.log("Duplicate: " + acc.name + " (" + acc.email + ") - keeping " + seen.get(lowerName).name + " (" + seen.get(lowerName).email + ")");
    } else {
      seen.set(lowerName, acc);
    }
  }

  if (toDelete.length === 0) {
    console.log("No duplicates found.");
  } else {
    const result = await db.collection("accounts").deleteMany({ _id: { $in: toDelete } });
    console.log("Deleted " + result.deletedCount + " duplicate accounts.");
  }

  await mongoose.disconnect();
}

cleanup().catch(console.error);
