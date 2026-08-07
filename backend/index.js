const bodyParser = require("body-parser");
const path = require("path");
const express = require("express");
const app = express();
const cors = require("cors");
const { connect } = require("./db");
const router = require("./Routes/index");
const port = 5000;

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("hello this is internshala backend");
});
app.use("/api", router);

connect().catch(() => {
  console.log("Continuing without a database connection");
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on the port ${port}`);
  });
}

module.exports = app;