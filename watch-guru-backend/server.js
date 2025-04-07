const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { Pool } = require("pg");
// const { error } = require("ajv/dist/vocabularies/applicator/dependencies");
const app = express();
const port =3000;

// PostgreSQL connection
// NOTE: use YOUR postgres username and password here
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'watchguru',
  password: 'Mahakkidata',
  port: 5432,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// CORS: Give permission to localhost:3000 (ie our React app)
// to use this backend API
app.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true,
  })
);

// Session information
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

/////////////////////////////////////////////////////////////
// Authentication APIs
// Signup, Login, IsLoggedIn and Logout

// TODO: Implement authentication middleware
// Redirect unauthenticated users to the login page with respective status code
function isAuthenticated(req, res, next) {
  req.session.userId ? next() : res.status(400).send({ message: "Unauthorized" });

}

// TODO: Implement user signup logic
// return JSON object with the following fields: {username, email, password}
// use correct status codes and messages mentioned in the lab document
console.log("Starting backend...");
app.get("/", (req, res) => {
  res.send("Backend is up and running!");
});

app.post('/signup', async (req, res) => {
  const {name, email, password, birthdate, genres } = req.body;
  console.log(name);
  console.log(email);
  console.log(password);
  console.log(birthdate);
  console.log(genres);

  // Basic validation
  if (!name || !email || !password || birthdate === undefined) {
    return res.status(400).json({ message: "Error: All fields are required (username, email, password, date of birth)." });
  }
  if (!genres || !Array.isArray(genres) || genres.length < 3) {
    return res.status(400).json({ message: "Please select at least 3 favorite genres." });
  }
  try {
    // Check for existing email or username
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email.toLowerCase(), name]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Error: Email or username already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `INSERT INTO users (username, email, password_hash, date_of_birth, favorite_genres)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id`,
      [name, email.toLowerCase(), hashedPassword, birthdate, genres]
    );

    req.session.userId = newUser.rows[0].user_id;

    res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// TODO: Implement user signup logic
// return JSON object with the following fields: {email, password}
// use correct status codes and messages mentioned in the lab document
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Error: Email and password are required." });
  }

  try {
    // Check if the user exists
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = userResult.rows[0];

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Store user ID in session to keep the user logged in
    req.session.userId = user.user_id;

    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in" });
  }
});


// TODO: Implement API used to check if the client is currently logged in or not.
// use correct status codes and messages mentioned in the lab document
app.get("/isLoggedIn", async (req, res) => {
  // console.log(req.session.userId);
  if (req.session.userId) {
    person = await pool.query("SELECT username FROM Users WHERE user_id = $1", [req.session.userId]);
    // console.log(person.rows[0].username);
    username = person.rows[0].username;
    res.status(200).json({ message: "Logged in", username }); // Send username if logged in
  } else {
    res.status(400).json({ message: "Not logged in" }); // Send error if not logged in
  }
});

// TODO: Implement API used to logout the user
// use correct status codes and messages mentioned in the lab document
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).json({ message: "Failed to log out" });
    }
    res.clearCookie("connect.sid"); // Important: Clear the session cookie
    res.status(200).json({ message: "Logged out successfully" });
  });
});
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
