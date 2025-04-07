const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { Pool } = require("pg");
// const { error } = require("ajv/dist/vocabularies/applicator/dependencies");
const app = express();
const port = 4000;

// PostgreSQL connection
// NOTE: use YOUR postgres username and password here
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'watchguru',
  password: '12345678',
  port: 5432,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// CORS: Give permission to localhost:3000 (ie our React app)
// to use this backend API
app.use(
  cors({
    origin: "http://localhost:3000",
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
  req.session.userId ? next() : res.status(400).json({ message: "Unauthorized" });

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

app.get("/recommendations", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Fetch the user's favorite genres
    const userGenresResult = await pool.query(
      "SELECT favorite_genres FROM users WHERE user_id = $1",
      [userId]
    );

    if (userGenresResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userGenres = userGenresResult.rows[0].favorite_genres;

    // Fetch movie recommendations based on the user's favorite genres
    const recommendationsResult = await pool.query(
      `SELECT content_id, title, poster_url, genre FROM content WHERE genre && $1::text[]`,
      [userGenres]
    );
    console.log(recommendationsResult.rows);
    res.status(200).json({data: recommendationsResult.rows});
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/recommendmovies", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Fetch the user's favorite genres
    const userGenresResult = await pool.query(
      "SELECT favorite_genres FROM users WHERE user_id = $1",
      [userId]
    );

    if (userGenresResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userGenres = userGenresResult.rows[0].favorite_genres;

    const recommendationsResult = await pool.query(
      `SELECT content_id, title, poster_url, genre 
       FROM content 
       WHERE content_type = 'movie' AND genre && $1::text[]`,
      [userGenres]
    );

    console.log(recommendationsResult.rows);
    res.status(200).json({ data: recommendationsResult.rows });
  } catch (error) {
    console.error("Error fetching recommended movies:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/recommendanimes", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Fetch the user's favorite genres
    const userGenresResult = await pool.query(
      "SELECT favorite_genres FROM users WHERE user_id = $1",
      [userId]
    );

    if (userGenresResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userGenres = userGenresResult.rows[0].favorite_genres;

    const recommendationsResult = await pool.query(
      `SELECT content_id, title, poster_url, genre 
       FROM content 
       WHERE content_type = 'anime' AND genre && $1::text[]`,
      [userGenres]
    );

    console.log(recommendationsResult.rows);
    res.status(200).json({ data: recommendationsResult.rows });
  } catch (error) {
    console.error("Error fetching recommended movies:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/recommendshows", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Fetch the user's favorite genres
    const userGenresResult = await pool.query(
      "SELECT favorite_genres FROM users WHERE user_id = $1",
      [userId]
    );

    if (userGenresResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userGenres = userGenresResult.rows[0].favorite_genres;

    const recommendationsResult = await pool.query(
      `SELECT content_id, title, poster_url, genre 
       FROM content 
       WHERE content_type = 'show' AND genre && $1::text[]`,
      [userGenres]
    );

    console.log(recommendationsResult.rows);
    res.status(200).json({ data: recommendationsResult.rows });
  } catch (error) {
    console.error("Error fetching recommended movies:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Simplified friends endpoints
app.get("/friends", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Current friends
    const friends = await pool.query(
      `SELECT u.user_id, u.username, u.profile_picture 
       FROM friends f JOIN users u ON 
       (f.user_id = u.user_id OR f.friend_id = u.user_id) 
       WHERE (f.user_id = $1 OR f.friend_id = $1) 
       AND f.status = 'accepted' 
       AND u.user_id != $1`,
      [userId]
    );

    // Friend requests
    const requests = await pool.query(
      `SELECT u.user_id, u.username, u.profile_picture, f.created_at 
       FROM friends f JOIN users u ON f.user_id = u.user_id 
       WHERE f.friend_id = $1 AND f.status = 'pending'`,
      [userId]
    );

    // Suggestions (friends of friends)
    const suggestions = await pool.query(
      `SELECT DISTINCT u.user_id, u.username, u.profile_picture 
       FROM friends f1 
       JOIN friends f2 ON f1.friend_id = f2.user_id 
       JOIN users u ON f2.friend_id = u.user_id 
       WHERE f1.user_id = $1 
       AND f2.friend_id != $1 
       AND NOT EXISTS (
         SELECT 1 FROM friends 
         WHERE (user_id = $1 AND friend_id = f2.friend_id) 
         OR (user_id = f2.friend_id AND friend_id = $1)
       )
       LIMIT 10`,
      [userId]
    );

    res.status(200).json({
      friends: friends.rows,
      requests: requests.rows,
      suggestions: suggestions.rows
    });
  } catch (error) {
    console.error("Error fetching friends data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Keep existing friend request endpoints
app.post("/send-friend-request", isAuthenticated, async (req, res) => {
  // ... existing implementation ...
});

app.post("/respond-friend-request", isAuthenticated, async (req, res) => {
  // ... existing implementation ...
});

// Search users endpoint
app.get("/search-users", isAuthenticated, async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.session.userId;
    
    const results = await pool.query(
      `SELECT user_id, username, profile_picture 
       FROM users 
       WHERE username ILIKE $1 
       AND user_id != $2
       LIMIT 10`,
      [`%${q}%`, userId]
    );

    res.status(200).json(results.rows);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});