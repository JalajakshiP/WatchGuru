require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./src/config/db");

const userRoutes = require("./src/routes/userRoutes");

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/users", userRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await sequelize.sync();  // Ensures DB tables exist
});
app.get('/', (req, res) => {
  res.send('WatchGuru backend is running!');
});

