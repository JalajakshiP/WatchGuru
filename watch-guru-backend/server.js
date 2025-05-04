const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { Pool } = require("pg");
// const { error } = require("ajv/dist/vocabularies/applicator/dependencies");
const app = express();
const math = require("mathjs");
// const schedule = require("node-schedule");

const port = 4000;
const { spawn } = require('child_process');
const path = require('path');

// PostgreSQL connection
// NOTE: use YOUR postgres username and password here
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'watchguru',
  password: 'chocolate',
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


function isAuthenticated(req, res, next) {
  req.session.userId ? next() : res.status(400).json({ message: "Unauthorized" });

}


console.log("Starting backend...");
app.get("/", (req, res) => {
  res.send("Backend is up and running!");
});

app.post('/signup', async (req, res) => {
  const { name, email, password, birthdate, genres } = req.body;

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

    res.status(200).json({name: name, message: "User registered successfully" });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



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

    res.status(200).json({ name: user.username, message: "Login successful" });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in" });
  }
});


app.get("/isLoggedIn", async (req, res) => {
  if (req.session.userId) {
    person = await pool.query("SELECT username FROM Users WHERE user_id = $1", [req.session.userId]);
    username = person.rows[0].username;
    res.status(200).json({ message: "Logged in", username }); // Send username if logged in
  } else {
    res.status(400).json({ message: "Not logged in" }); // Send error if not logged in
  }
});


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


// 1. SVD-Based Collaborative Filtering
async function trainSVDFiltering() {
  try {
    console.log("Starting SVD training...");
    
    // Get all ratings
    const { rows: ratings } = await pool.query(
      "SELECT user_id, content_id, rating FROM reviews"
    );

    if (ratings.length < 100) {
      console.log("Not enough ratings for SVD (minimum 100 required)");
      return;
    }

    // Create mappings
    const users = [...new Set(ratings.map(r => r.user_id))];
    const items = [...new Set(ratings.map(r => r.content_id))];
    
    const userIndex = {};
    const itemIndex = {};
    users.forEach((user, idx) => userIndex[user] = idx);
    items.forEach((item, idx) => itemIndex[item] = idx);

    // Create dense matrix (fill missing with 0)
    const matrix = math.zeros(users.length, items.length);
    ratings.forEach(r => {
      matrix.set([userIndex[r.user_id], itemIndex[r.content_id]], r.rating);
    });

    // Compute SVD
    console.log("Computing SVD...");
    const { U, S, V } = math.svd(matrix);
    
    // Truncate to 10 latent factors
    const k = 10;
    const U_k = U.map(row => row.slice(0, k));
    const S_k = math.diag(S.slice(0, k));
    const V_k = V.map(row => row.slice(0, k));

    // Compute reduced matrices
    const userFactors = math.multiply(U_k, S_k);
    const itemFactors = math.multiply(math.transpose(V_k), S_k);

    // Store in database
    await pool.query("TRUNCATE svd_user_factors");
    await pool.query("TRUNCATE svd_item_factors");

    // Batch insert user factors
    const userBatches = [];
    users.forEach((userId, i) => {
      userBatches.push({
        userId,
        factors: userFactors[i]
      });
    });
    
    // Batch insert item factors
    const itemBatches = [];
    items.forEach((itemId, i) => {
      itemBatches.push({
        itemId,
        factors: itemFactors[i]
      });
    });

    // Execute in parallel
    await Promise.all([
      pool.query(
        "INSERT INTO svd_user_factors (user_id, factors) VALUES " +
        userBatches.map(b => `(${b.userId}, ARRAY[${b.factors.join(',')}])`).join(',')
      ),
      pool.query(
        "INSERT INTO svd_item_factors (content_id, factors) VALUES " +
        itemBatches.map(b => `(${b.itemId}, ARRAY[${b.factors.join(',')}])`).join(',')
      )
    ]);

    console.log("SVD training completed successfully");
  } catch (error) {
    console.error("Error in SVD training:", error);
  }
}

// 2. Item-Based Collaborative Filtering
async function trainItemBasedCF() {
  try {
    console.log("Training item-based CF...");
    const { rows: ratings } = await pool.query(
      "SELECT user_id, content_id, rating FROM reviews"
    );

    // Create user-item and item-user matrices
    const userItemMatrix = {};
    const itemUsers = {};

    ratings.forEach(r => {
      userItemMatrix[r.user_id] = userItemMatrix[r.user_id] || {};
      userItemMatrix[r.user_id][r.content_id] = r.rating;
      
      itemUsers[r.content_id] = itemUsers[r.content_id] || [];
      itemUsers[r.content_id].push(r.user_id);
    });

    const items = Object.keys(itemUsers);
    await pool.query("TRUNCATE movie_similarity");

    // Process in batches for memory efficiency
    const batchSize = 50;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const inserts = [];
      
      for (const item1 of batch) {
        for (const item2 of items) {
          if (item1 === item2) continue;
          
          const commonUsers = itemUsers[item1].filter(u => itemUsers[item2].includes(u));
          if (commonUsers.length < 3) continue;
          
          // Cosine similarity
          let dot = 0, mag1 = 0, mag2 = 0;
          commonUsers.forEach(u => {
            const r1 = userItemMatrix[u][item1];
            const r2 = userItemMatrix[u][item2];
            dot += r1 * r2;
            mag1 += r1 * r1;
            mag2 += r2 * r2;
          });
          
          const sim = dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
          if (sim > 0.2) {
            inserts.push(`(${item1}, ${item2}, ${sim})`);
          }
        }
      }
      
      if (inserts.length > 0) {
        await pool.query(
          `INSERT INTO movie_similarity (movie_id1, movie_id2, similarity) VALUES ${inserts.join(',')}`
        );
      }
    }
    
    console.log("Item-based CF training completed");
  } catch (error) {
    console.error("Error in item-based CF training:", error);
  }
}

// 3. User-Based Collaborative Filtering
async function trainUserBasedCF() {
  try {
    console.log("Training user-based CF...");
    const { rows: ratings } = await pool.query(
      "SELECT user_id, content_id, rating FROM reviews"
    );

    // Create user-item and user-user matrices
    const userItems = {};
    const itemUsers = {};
    
    ratings.forEach(r => {
      userItems[r.user_id] = userItems[r.user_id] || [];
      userItems[r.user_id].push(r.content_id);
      
      itemUsers[r.content_id] = itemUsers[r.content_id] || [];
      itemUsers[r.content_id].push(r.user_id);
    });

    const users = Object.keys(userItems);
    await pool.query("TRUNCATE user_similarity");

    // Process in batches
    const batchSize = 50;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const inserts = [];
      
      for (const user1 of batch) {
        for (const user2 of users) {
          if (user1 === user2) continue;
          
          const commonItems = userItems[user1].filter(i => userItems[user2].includes(i));
          if (commonItems.length < 3) continue;
          
          // Cosine similarity
          let dot = 0, mag1 = 0, mag2 = 0;
          commonItems.forEach(i => {
            const r1 = ratings.find(r => r.user_id == user1 && r.content_id == i)?.rating || 0;
            const r2 = ratings.find(r => r.user_id == user2 && r.content_id == i)?.rating || 0;
            dot += r1 * r2;
            mag1 += r1 * r1;
            mag2 += r2 * r2;
          });
          
          const sim = dot / (Math.sqrt(mag1) * Math.sqrt(mag2));
          if (sim > 0.2) {
            inserts.push(`(${user1}, ${user2}, ${sim})`);
          }
        }
      }
      
    if (inserts.length > 0) {
        await pool.query(
          `INSERT INTO user_similarity (user_id1, user_id2, similarity) VALUES ${inserts.join(',')}`
        );
      }
    }
    
    console.log("User-based CF training completed");
  } catch (error) {
    console.error("Error in user-based CF training:", error);
  }
}

// Training scheduler
async function trainAllModels() {
  console.log("\n=== Starting model training ===");
  await Promise.all([
    trainSVDFiltering(),
    trainItemBasedCF(),
    trainUserBasedCF()
  ]);
  console.log("=== Model training completed ===\n");
}

// Schedule training every 10 minutes
setInterval(trainAllModels, 10 * 60 * 1000);
trainAllModels(); // Initial training


app.get("/recommendations", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Get all recommendation types
    const [contentBased, itemCF, userCF, svdBased, popular,friendsTopRated] = await Promise.all([
      getContentBasedRecs(userId),
      getItemBasedCFRecs(userId),
      getUserBasedCFRecs(userId),
      getSVDRecs(userId),
      getPopularRecs(userId),
      getFriendsTopRatedRecs(userId),
    ]);

    // Process each recommendation type
    const processSection = (recs, type) => {
      const seen = new Set();
      return recs
        .filter(rec => {
          if (seen.has(rec.content_id)) return false;
          seen.add(rec.content_id);
          return true;
        })
        .map(rec => ({ ...rec, recommendationType: type }))
        .slice(0, 10); // Limit to 10 per section
    };
  

    const sections = [
      {
        title: "Popular Right Now",
        type: "popular",
        movies: processSection(popular, 'popular')
      },
      {
        title: "Based on Your Favorite Genres",
        type: "genre",
        movies: processSection(contentBased, 'genre')
      },
      {
        title: "Similar to Your Taste",
        type: "user",
        movies: processSection(userCF, 'user')
      },
      {
        title: "Because You Liked Similar Content",
        type: "item",
        movies: processSection(itemCF, 'item')
      },
      {
        title: "Top Rated By Your Friends",
        type: "friends",
        movies: processSection(friendsTopRated, 'friends')
      },
      {
        title: "Our Special Picks For You",
        type: "svd",
        movies: processSection(svdBased, 'svd')
      }
    ];

    // Collect all content_ids that are already recommended
    const recommendedIds = new Set();
    sections.forEach(section => {
      section.movies.forEach(movie => recommendedIds.add(movie.content_id));
    });

    // Query for exploreMore (everything else from the content table)
    const { rows: exploreMore } = await pool.query(
      `SELECT DISTINCT on (title) content_id, title, language, poster_url, genre, "cast", EXISTS (
    SELECT 1 
    FROM likes 
    WHERE user_id = $1 AND content_id = content.content_id
  ) AS liked, EXISTS (
    SELECT 1 
    FROM watchlist 
    WHERE user_id = $1 AND content_id = content.content_id
  ) AS inwatchlist,
   EXISTS (
    SELECT 1 
    FROM watch_history 
    WHERE user_id = $1 AND content_id = content.content_id
  ) AS watched
       FROM content
       WHERE content_id <> ALL ($2::int[])
       `, // Optional: adjust limit or remove for full list
      [userId,Array.from(recommendedIds)]
    );

    res.json({
      sections,
      exploreMore
    });

  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({
      message: "Error generating recommendations",
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});
app.post("/group-recommendations", isAuthenticated, async (req, res) => {
  try {
    const { friendIds, exclude = [], contentType } = req.body;
    const userId = req.session.userId;
    const allUserIds = [userId, ...friendIds];
    console.log(contentType)
    // Validate content type[]
    const validContentTypes = ['movie', 'show', 'anime'];
    const filteredContentType = validContentTypes.includes(contentType) ? contentType : null;

    // 1. First check for common watchlist items (filtered by type)
    const commonWatchlistItems = await getCommonWatchlistItems(allUserIds, filteredContentType);
    const availableCommonWatchlist = commonWatchlistItems.filter(
      item => !exclude.includes(item.content_id)
    );

    if (availableCommonWatchlist.length > 0) {
      return res.json({
        type: 'common-watchlist',
        content_type: availableCommonWatchlist[0].content_type,
        message: `This ${availableCommonWatchlist[0].content_type} is in all group members' watchlists`,
        items: [availableCommonWatchlist[0]]
      });
    }

    // 2. Get recommendations for all group members (strictly filtered by content type)
    const allRecommendations = await Promise.all(
      allUserIds.map(userId => getCombinedRecommendations(userId, filteredContentType))
    );

    // 3. Find intersection of all recommendations
    let commonRecommendations = findCommonRecommendations(allRecommendations)
      .filter(item => !exclude.includes(item.content_id));

    // 4. If no common recommendations, find content with highest overlap
    if (commonRecommendations.length === 0) {
      const overlapRecommendations = findRecommendationOverlap(allRecommendations)
        .filter(item => !exclude.includes(item.content_id));
      
      if (overlapRecommendations.length > 0) {
        return res.json({
          type: 'overlap',
          content_type: filteredContentType,
          message: `This ${filteredContentType} was liked by ${overlapRecommendations[0].overlap} of ${allUserIds.length} members`,
          items: [overlapRecommendations[0]]
        });
      }
    }

    // 5. If still nothing, get one popular item not in exclude list
    if (commonRecommendations.length === 0) {
      const popular = await getPopularRecs(userId, filteredContentType);
      const availablePopular = popular.filter(item => 
        !exclude.includes(item.content_id)
      );
      
      if (availablePopular.length > 0) {
        return res.json({
          type: 'popular',
          content_type: filteredContentType,
          message: `No common favorites found - here's a popular ${filteredContentType}`,
          items: [availablePopular[0]]
        });
      }
      
      // 6. If absolutely nothing left
      return res.json({
        type: 'exhausted',
        content_type: filteredContentType,
        message: `No more ${filteredContentType} recommendations available for your group`,
        items: []
      });
    }

    // Return one common recommendation
    res.json({
      type: 'common',
      content_type: filteredContentType,
      message: `This ${filteredContentType} was recommended for all group members`,
      items: [commonRecommendations[0]]
    });

  } catch (error) {
    console.error("Group recommendation error:", error);
    res.status(500).json({
      message: "Error generating group recommendations",
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});
async function getCommonWatchlistItems(userIds, contentType = null) {
  if (userIds.length === 0) return [];

  let query = `
    SELECT c.content_id, c.title, c.poster_url, c.genre, c.content_type
    FROM watchlist w
    JOIN content c ON w.content_id = c.content_id
    WHERE w.user_id = $1
    ${contentType ? 'AND c.content_type = $2' : ''}
  `;

  console.log("\n=== WATCHLIST ANALYSIS ===");
  
  // Get watchlist items for all users (for debugging)
  const allUserWatchlists = [];
  
  for (let i = 0; i < userIds.length; i++) {
    const userParams = [userIds[i]];
    if (contentType) userParams.push(contentType);
    
    const { rows: userItems } = await pool.query(query, userParams);
    allUserWatchlists.push({
      userId: userIds[i],
      items: userItems
    });
    
    console.log(`\nUser ${userIds[i]} watchlist (${contentType || 'all types'}):`);
    console.log(userItems.map(item => `${item.title} (${item.content_type})`).join('\n'));
  }

  // Get common items (original logic)
  const firstUserParams = [userIds[0]];
  if (contentType) firstUserParams.push(contentType);
  const { rows: commonItems } = await pool.query(query, firstUserParams);

  for (let i = 1; i < userIds.length; i++) {
    if (commonItems.length === 0) break;
    
    const userParams = [userIds[i]];
    if (contentType) userParams.push(contentType);
    
    const { rows: userItems } = await pool.query(query, userParams);
    const userItemsSet = new Set(userItems.map(item => item.content_id));
    
    for (let j = commonItems.length - 1; j >= 0; j--) {
      if (!userItemsSet.has(commonItems[j].content_id)) {
        commonItems.splice(j, 1);
      }
    }
  }

  console.log('\nFinal common watchlist items:');
  console.log(commonItems.map(item => `${item.title} (${item.content_type})`).join('\n') || 'No common items found');
  console.log("=======================\n");

  return commonItems;
}
// Updated helper function to get combined recommendations for a single user
// Updated helper function to get combined recommendations for a single user
async function getCombinedRecommendations(userId, contentType = null) {
  // Get all recommendations without content type filtering
  const [contentBased, itemCF, userCF, svdBased, popular] = await Promise.all([
    getContentBasedRecs(userId),
    getItemBasedCFRecs(userId),
    getUserBasedCFRecs(userId),
    getSVDRecs(userId),
    getPopularRecs(userId)
  ]);
  
  // Combine all recommendations and deduplicate
  const allRecs = [...contentBased, ...itemCF, ...userCF, ...svdBased, ...popular];
  const seen = new Set();
  
  // First deduplicate
  const uniqueRecs = allRecs.filter(rec => {
    if (seen.has(rec.content_id)) return false;
    seen.add(rec.content_id);
    return true;
  });

  // If no content type filter needed, return all
  if (!contentType) return uniqueRecs;

  // Get content types for these recommendations in a single query
  const contentIds = uniqueRecs.map(rec => rec.content_id);
  if (contentIds.length === 0) return [];
  
  const { rows } = await pool.query(
    'SELECT content_id FROM content WHERE content_id = ANY($1) AND content_type = $2',
    [contentIds, contentType]
  );
  
  const validIds = new Set(rows.map(r => r.content_id));
  
  // Filter by content type
  return uniqueRecs.filter(rec => validIds.has(rec.content_id));
}

// Find recommendations with highest overlap when no perfect matches exist
function findRecommendationOverlap(allRecommendations) {
  const recommendationCounts = new Map();
  
  allRecommendations.forEach(userRecs => {
    userRecs.forEach(rec => {
      recommendationCounts.set(rec.content_id, {
        count: (recommendationCounts.get(rec.content_id)?.count || 0) + 1,
        details: rec // Store the recommendation details
      });
    });
  });
  
  // Convert to array and sort by overlap count
  return Array.from(recommendationCounts.entries())
    .map(([contentId, {count, details}]) => ({
      ...details,
      overlap: count,
      overlapPercentage: Math.round((count / allRecommendations.length) * 100)
    }))
    .sort((a, b) => b.overlap - a.overlap);
}
// Find recommendations that appear in all users' lists
function findCommonRecommendations(allRecommendations) {
  if (allRecommendations.length === 0) return [];
  
  // Create a map of content_id to count
  const recommendationCounts = new Map();
  
  allRecommendations.forEach(userRecs => {
    const userRecsSet = new Set(userRecs.map(r => r.content_id));
    userRecsSet.forEach(contentId => {
      recommendationCounts.set(contentId, (recommendationCounts.get(contentId) || 0) + 1);
    });
  });
  
  // Filter for content recommended to all users
  const commonRecs = [];
  const totalUsers = allRecommendations.length;
  
  recommendationCounts.forEach((count, contentId) => {
    if (count === totalUsers) {
      // Find the first occurrence to get details
      const rec = allRecommendations[0].find(r => r.content_id === contentId);
      if (rec) {
        commonRecs.push(rec);
      }
    }
  });
  
  return commonRecs;
}

// Helper functions for recommendations
async function getContentBasedRecs(userId) {
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (c.title)
  c.content_id,
  c.title,
  c.poster_url,
  c.genre,
  'content' as type,
  1.0 as score,
   EXISTS (
    SELECT 1 
    FROM likes 
    WHERE user_id = $1 AND content_id = c.content_id
  ) AS liked, EXISTS (
    SELECT 1 
    FROM watchlist 
    WHERE user_id = $1 AND content_id = c.content_id
  ) AS inwatchlist,
   EXISTS (
    SELECT 1 
    FROM watch_history 
    WHERE user_id = $1 AND content_id = c.content_id
  ) AS watched
FROM content c
JOIN users u ON c.genre && u.favorite_genres
WHERE u.user_id = $1
ORDER BY c.title, c.content_id -- Ensure we order by title and content_id for uniqueness
LIMIT 20;


`,

    [userId]
  );
console.log(rows)
  return rows;
}

async function getItemBasedCFRecs(userId) {
  const { rows } = await pool.query(
    `WITH user_highly_rated AS (
       SELECT content_id FROM reviews 
       WHERE user_id = $1 AND rating >= 7
       LIMIT 5
     )
     SELECT c.content_id, c.title, c.poster_url, c.genre,
       'item_cf' as type, AVG(ms.similarity) as score, EXISTS (
    SELECT 1 
    FROM likes 
    WHERE user_id = $1 AND content_id = c.content_id
  ) AS liked, EXISTS (
    SELECT 1 
    FROM watchlist 
    WHERE user_id = $1 AND content_id = c.content_id
  ) AS inwatchlist,
   EXISTS (
    SELECT 1 
    FROM watch_history 
    WHERE user_id = $1 AND content_id = c.content_id
  ) AS watched
     FROM movie_similarity ms
     JOIN content c ON ms.movie_id2 = c.content_id
     WHERE ms.movie_id1 IN (SELECT content_id FROM user_highly_rated)
     AND c.content_id NOT IN (SELECT content_id FROM reviews WHERE user_id = $1)
     GROUP BY c.content_id, c.title, c.poster_url, c.genre
     ORDER BY score DESC
     LIMIT 20`,
    [userId]
  );
  return rows;
}

async function getUserBasedCFRecs(userId) {
  const { rows } = await pool.query(
    `WITH similar_users AS (
       SELECT user_id2 as user_id, similarity
       FROM user_similarity
       WHERE user_id1 = $1
       ORDER BY similarity DESC
       LIMIT 5
     )
     SELECT 
       c.content_id, c.title, c.poster_url, c.genre,
       'user_cf' as type, AVG(r.rating) as score
      , EXISTS (
    SELECT 1 
    FROM likes 
    WHERE user_id = $1 AND content_id = c.content_id
  ) AS liked, EXISTS (
    SELECT 1 
    FROM watchlist 
    WHERE user_id = $1 AND content_id = c.content_id
  ) AS inwatchlist,
   EXISTS (
    SELECT 1 
    FROM watch_history 
    WHERE user_id = $1 AND content_id = c.content_id
  ) AS watched
     FROM reviews r
     JOIN content c ON r.content_id = c.content_id
     WHERE r.user_id IN (SELECT user_id FROM similar_users)
     AND r.rating >= 7
     AND r.content_id NOT IN (SELECT content_id FROM reviews WHERE user_id = $1)
     GROUP BY c.content_id, c.title, c.poster_url, c.genre
     ORDER BY score DESC, COUNT(*) DESC
     LIMIT 20`,
    [userId]
  );
  return rows;
}
async function getSVDRecs(userId) {
  try {
    const { rows } = await pool.query(
      `WITH user_vec AS (
         SELECT factors FROM svd_user_factors WHERE user_id = $1
       ),
       item_factors AS (
         SELECT 
           it.content_id, 
           c.title, 
           c.poster_url, 
           c.genre,
           it.factors
           ,EXISTS (
    SELECT 1 
    FROM likes 
    WHERE user_id = $1 AND content_id = c.content_id
  ) AS liked, EXISTS (
    SELECT 1 
    FROM watchlist 
    WHERE user_id = $1 AND content_id = c.content_id
  ) AS inwatchlist,
   EXISTS (
    SELECT 1 
    FROM watch_history 
    WHERE user_id = $1 AND content_id = c.content_id
  ) AS watched
         FROM svd_item_factors it
         JOIN content c ON it.content_id = c.content_id
         WHERE it.content_id NOT IN (
           SELECT content_id FROM reviews WHERE user_id = $1
         )
       )
       SELECT 
         i.content_id,
         i.title,
         i.poster_url,
         i.genre,
         'svd' AS type,
         (
           SELECT SUM(u.factors[n] * i.factors[n])
           FROM generate_series(1, array_length(u.factors, 1)) AS n
         ) AS score
       FROM item_factors i
       CROSS JOIN user_vec u
       ORDER BY score DESC
       LIMIT 20`,
      [userId]
    );
    return rows;
  } catch (error) {
    console.error("Error in SVD recommendations:", error);
    return [];
  }
}

async function getPopularRecs(userId) {
  try {
    const { rows } = await pool.query(
      `SELECT 
  c.content_id, 
  c.title, 
  c.poster_url, 
  c.genre,
  'top_rated' AS type,
  AVG(r.rating) AS avg_rating,
  EXISTS (
    SELECT 1 
    FROM likes 
    WHERE user_id = $1 AND content_id = c.content_id
  ) AS liked, EXISTS (
    SELECT 1 
    FROM watchlist 
    WHERE user_id = $1 AND content_id = c.content_id
  ) AS inwatchlist,
   EXISTS (
    SELECT 1 
    FROM watch_history 
    WHERE user_id = $1 AND content_id = c.content_id
  ) AS watched
FROM content c
JOIN reviews r ON c.content_id = r.content_id
GROUP BY c.content_id, c.title, c.poster_url, c.genre
HAVING AVG(r.rating) > 0
ORDER BY avg_rating DESC
LIMIT 10;
`,[userId]
    );
    return rows;
  } catch (error) {
    console.error("Error in popular recommendations:", error);
    return [];
  }
}






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
      `SELECT DISTINCT ON (title) content_id, title, poster_url, genre ,
      EXISTS (
    SELECT 1 
    FROM likes 
    WHERE user_id = $2 AND content_id = content.content_id
  ) AS liked, EXISTS (
    SELECT 1 
    FROM watchlist 
    WHERE user_id = $2 AND content_id = content.content_id
  ) AS inwatchlist,
   EXISTS (
    SELECT 1 
    FROM watch_history 
    WHERE user_id = $2 AND content_id = content.content_id
  ) AS watched
       FROM content 
       WHERE content_type = 'movie' AND genre && $1::text[]`,
      [userGenres,userId]
    );

    const recommendedMovies = recommendationsResult.rows;
    const recommendedIds = recommendedMovies.map((movie) => movie.content_id);

    let othersResult;
    if (recommendedIds.length > 0) {

      othersResult = await pool.query(
        `SELECT DISTINCT ON (title) content_id, title, poster_url, genre,
        EXISTS (
    SELECT 1 
    FROM likes 
    WHERE user_id = $2 AND content_id = content.content_id
  ) AS liked, EXISTS (
    SELECT 1 
    FROM watchlist 
    WHERE user_id = $2 AND content_id = content.content_id
  ) AS inwatchlist,
   EXISTS (
    SELECT 1 
    FROM watch_history 
    WHERE user_id = $2 AND content_id = content.content_id
  ) AS watched
         FROM content
         WHERE content_type = 'movie' AND content_id != ALL($1::int[])`,
        [recommendedIds,userId]
      );
    } else {
      // If no recommended IDs, just fetch all movies
      othersResult = await pool.query(
        `SELECT DISTINCT ON (title) content_id, title, poster_url, genre 
        FROM content WHERE content_type = 'movie'`
      );
    }
    const otherMovies = othersResult.rows;
    res.status(200).json({ 
      recommended: recommendedMovies,
      others: otherMovies,
     });
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
      `SELECT DISTINCT ON (title) content_id, title, poster_url, genre ,
      EXISTS (
    SELECT 1 
    FROM likes 
    WHERE user_id = $2 AND content_id = content.content_id
  ) AS liked, EXISTS (
    SELECT 1 
    FROM watchlist 
    WHERE user_id = $2 AND content_id = content.content_id
  ) AS inwatchlist,
   EXISTS (
    SELECT 1 
    FROM watch_history 
    WHERE user_id = $2 AND content_id = content.content_id
  ) AS watched
       FROM content 
       WHERE content_type = 'anime' AND genre && $1::text[]`,
      [userGenres,userId]
    );

    const recommendedAnimes = recommendationsResult.rows;
    const recommendedIds = recommendedAnimes.map((anime) => anime.content_id);

    let othersResult;
    if (recommendedIds.length > 0) {

      othersResult = await pool.query(
        `SELECT DISTINCT ON (title) content_id, title, poster_url, genre,
        EXISTS (
    SELECT 1 
    FROM likes 
    WHERE user_id = $2 AND content_id = content.content_id
  ) AS liked, EXISTS (
    SELECT 1 
    FROM watchlist 
    WHERE user_id = $2 AND content_id = content.content_id
  ) AS inwatchlist,
   EXISTS (
    SELECT 1 
    FROM watch_history 
    WHERE user_id = $2 AND content_id = content.content_id
  ) AS watched
         FROM content
         WHERE content_type = 'anime' AND content_id != ALL($1::int[])`,
        [recommendedIds,userId]
      );
    } else {
      // If no recommended IDs, just fetch all movies
      othersResult = await pool.query(
        `SELECT DISTINCT ON (title) content_id, title, poster_url, genre,
        EXISTS (
    SELECT 1 
    FROM likes 
    WHERE user_id = $1 AND content_id = content.content_id
  ) AS liked, EXISTS (
    SELECT 1 
    FROM watchlist 
    WHERE user_id = $1 AND content_id = content.content_id
  ) AS inwatchlist,
   EXISTS (
    SELECT 1 
    FROM watch_history 
    WHERE user_id = $1 AND content_id = content.content_id
  ) AS watched
        FROM content WHERE content_type = 'anime'`,[userId]
      );
    }
    const otherAnimes = othersResult.rows;
    res.status(200).json({ 
      recommended: recommendedAnimes,
      others: otherAnimes,
     });
  } catch (error) {
    console.error("Error fetching recommended animes:", error);
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
      `SELECT DISTINCT ON (title) content_id, title, poster_url, genre,
      EXISTS (
    SELECT 1 
    FROM likes 
    WHERE user_id = $2 AND content_id = content.content_id
  ) AS liked, EXISTS (
    SELECT 1 
    FROM watchlist 
    WHERE user_id = $2 AND content_id = content.content_id
  ) AS inwatchlist,
   EXISTS (
    SELECT 1 
    FROM watch_history 
    WHERE user_id = $2 AND content_id = content.content_id
  ) AS watched
       FROM content 
       WHERE content_type = 'show' AND genre && $1::text[]`,
      [userGenres,userId]
    );

    const recommendedShows = recommendationsResult.rows;
    const recommendedIds = recommendedShows.map((show) => show.content_id);

    let othersResult;
    if (recommendedIds.length > 0) {

      othersResult = await pool.query(
        `SELECT DISTINCT ON (title) content_id, title, poster_url, genre,
        EXISTS (
    SELECT 1 
    FROM likes 
    WHERE user_id = $2 AND content_id = content.content_id
  ) AS liked, EXISTS (
    SELECT 1 
    FROM watchlist 
    WHERE user_id = $2 AND content_id = content.content_id
  ) AS inwatchlist,
   EXISTS (
    SELECT 1 
    FROM watch_history 
    WHERE user_id = $2 AND content_id = content.content_id
  ) AS watched
         FROM content
         WHERE content_type = 'show' AND content_id != ALL($1::int[])`,
        [recommendedIds,userId]
      );
    } else {
      // If no recommended IDs, just fetch all movies
      othersResult = await pool.query(
        `SELECT DISTINCT ON (title) content_id, title, poster_url, genre,
         EXISTS (
    SELECT 1 
    FROM likes 
    WHERE user_id = $1 AND content_id = c.content_id
  ) AS liked, EXISTS (
    SELECT 1 
    FROM watchlist 
    WHERE user_id = $1 AND content_id = c.content_id
  ) AS inwatchlist,
   EXISTS (
    SELECT 1 
    FROM watch_history 
    WHERE user_id = $1 AND content_id = c.content_id
  ) AS watched
        FROM content WHERE content_type = 'show'`,[userId]
      );
    }
    const otherMovies = othersResult.rows;
    res.status(200).json({ 
      recommended: recommendedShows,
      others: otherMovies,
     });
  } catch (error) {
    console.error("Error fetching recommended shows:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Simplified friends endpoints
// Enhanced friend suggestions endpoint
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

    // Incoming friend requests (others requesting current user)
    const incomingRequests = await pool.query(
      `SELECT u.user_id, u.username, u.profile_picture, f.created_at 
       FROM friends f JOIN users u ON f.user_id = u.user_id 
       WHERE f.friend_id = $1 AND f.status = 'pending'`,
      [userId]
    );

    // Outgoing friend requests (current user requesting others)
    const outgoingRequests = await pool.query(
      `SELECT u.user_id, u.username, u.profile_picture, f.created_at 
       FROM friends f JOIN users u ON f.friend_id = u.user_id 
       WHERE f.user_id = $1 AND f.status = 'pending'`,
      [userId]
    );

    // Suggestions (same as before)
    const suggestions = await pool.query(
      `WITH 
       -- Current user's favorite genres
       my_genres AS (
         SELECT unnest(favorite_genres) AS genre 
         FROM users 
         WHERE user_id = $1
       ),
       
       -- Current user's friends
       my_friends AS (
         SELECT friend_id FROM friends 
         WHERE user_id = $1 AND status = 'accepted'
         UNION
         SELECT user_id FROM friends 
         WHERE friend_id = $1 AND status = 'accepted'
       ),
       
       -- Friends of friends (excluding direct friends)
       fof AS (
         SELECT DISTINCT u.user_id, u.username, u.profile_picture, u.favorite_genres
         FROM friends f1
         JOIN friends f2 ON f1.friend_id = f2.user_id
         JOIN users u ON f2.friend_id = u.user_id
         WHERE f1.user_id = $1
         AND f2.status = 'accepted'
         AND u.user_id != $1
         AND u.user_id NOT IN (SELECT friend_id FROM my_friends)
       ),
       
       -- Users with matching genres (excluding friends)
       genre_matches AS (
         SELECT u.user_id, u.username, u.profile_picture, u.favorite_genres
         FROM users u
         WHERE u.user_id != $1
         AND u.user_id NOT IN (SELECT friend_id FROM my_friends)
         AND (
           SELECT COUNT(*) 
           FROM unnest(u.favorite_genres) AS genre
           WHERE genre IN (SELECT genre FROM my_genres)
         ) >= 2
       ),
       
       -- Combined suggestions with scoring
       combined AS (
         -- Friends of friends get higher base score
         SELECT 
           user_id,
           username,
           profile_picture,
           favorite_genres,
           50 AS base_score,
           'fof' AS source
         FROM fof
         
         UNION ALL
         
         -- Genre matches get standard score
         SELECT 
           user_id,
           username,
           profile_picture,
           favorite_genres,
           (
             SELECT COUNT(*) 
             FROM unnest(favorite_genres) AS genre
             WHERE genre IN (SELECT genre FROM my_genres)
           ) * 10 AS base_score,
           'genre' AS source
         FROM genre_matches
       )
       
       SELECT 
         user_id,
         username,
         profile_picture,
         base_score + (
           SELECT COUNT(*) 
           FROM unnest(favorite_genres) AS genre
           WHERE genre IN (SELECT genre FROM my_genres)
         ) * 5 AS total_score,
         source
       FROM combined
       ORDER BY total_score DESC
       LIMIT 20`,
      [userId]
    );
    
    res.status(200).json({
      friends: friends.rows,
      incomingRequests: incomingRequests.rows,
      outgoingRequests: outgoingRequests.rows,
      suggestions: suggestions.rows
    });
  } catch (error) {
    console.error("Error fetching friends data:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});
// Send Friend Request
app.post("/send-friend-request", isAuthenticated, async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.session.userId;

    if (userId === friendId) {
      return res.status(400).json({ message: "Cannot send request to yourself" });
    }

    // Check if user exists
    const userExists = await pool.query(
      "SELECT 1 FROM users WHERE user_id = $1",
      [friendId]
    );
    if (userExists.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if request already exists
    const existing = await pool.query(
      `SELECT status FROM friends 
       WHERE (user_id = $1 AND friend_id = $2)
       OR (user_id = $2 AND friend_id = $1)`,
      [userId, friendId]
    );

    if (existing.rows.length > 0) {
      const status = existing.rows[0].status;
      if (status === 'pending') {
        return res.status(400).json({
          message: userId === existing.rows[0].user_id
            ? "Request already sent"
            : "You have a pending request from this user"
        });
      }
      if (status === 'accepted') {
        return res.status(400).json({ message: "Already friends" });
      }
    }
    const sender = await pool.query(
      "SELECT username FROM users WHERE user_id = $1",
      [userId]
    );
    const senderName = sender.rows[0]?.username || `User ${userId}`;

    await pool.query(
      "INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, 'pending')",
      [userId, friendId]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, type, from_user, content)
       VALUES ($1, 'friend_request', $2, $3)`,
      [friendId, userId, `New friend request from ${senderName}`]
    );
    

    res.status(200).json({ message: "Friend request sent" });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.post("/cancel-friend-request", isAuthenticated, async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.session.userId;

    const result = await pool.query(
      `DELETE FROM friends 
       WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'`,
      [userId, friendId]
    );
    await pool.query(
      `DELETE FROM notifications
       WHERE user_id = $1 AND type = 'friend_request' AND from_user = $2`,
      [friendId, userId]
    );
    if (result.rowCount === 0) {
      return res.status(400).json({ message: "No pending request to cancel" });
    }

    res.status(200).json({ message: "Friend request cancelled" });
  } catch (error) {
    console.error("Error cancelling friend request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Respond to Friend Request
app.post("/respond-friend-request", isAuthenticated, async (req, res) => {
  try {
    const { friendId, accept } = req.body;
    const userId = req.session.userId;

    // Check if request exists
    const request = await pool.query(
      `SELECT * FROM friends 
       WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'`,
      [friendId, userId]
    );

    if (request.rows.length === 0) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (accept) {
      await pool.query(
        `UPDATE friends SET status = 'accepted' 
         WHERE user_id = $1 AND friend_id = $2`,
        [friendId, userId]
      );
      const responder = await pool.query(
        "SELECT username FROM users WHERE user_id = $1",
        [userId]
      );
      const responderName = responder.rows[0]?.username || `User ${userId}`;
    
      await pool.query(
        `INSERT INTO notifications (user_id, type, from_user, content)
         VALUES ($1, 'friend_accept', $2, $3)`,
        [friendId, userId, `${responderName} accepted your friend request`]
      );
      
    } else {
      await pool.query(
        `DELETE FROM friends 
         WHERE user_id = $1 AND friend_id = $2`,
        [friendId, userId]
      );
    }

    res.status(200).json({
      message: accept ? "Friend request accepted" : "Friend request declined"
    });
  } catch (error) {
    console.error("Error responding to friend request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
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
// Get content details by ID
app.get("/content/:contentId", isAuthenticated, async (req, res) => {
  try {
    const { contentId } = req.params;

    const contentResult = await pool.query(
      `SELECT * FROM content WHERE content_id = $1`,
      [contentId]
    );

    if (contentResult.rows.length === 0) {
      return res.status(404).json({ message: "Content not found" });
    }

    const content = contentResult.rows[0];

    // Get similar content based on genres
    const similarContent = await pool.query(
      `SELECT content_id, title, poster_url 
       FROM content 
       WHERE content_id != $1 
       AND genre && $2
       LIMIT 6`,
      [contentId, content.genre]
    );
    
    //console.log("Content fetched successfully:", content);

    res.status(200).json({
      content,
      similar: similarContent.rows,
      userId: req.session.userId
    });

  } catch (error) {
    console.error("Error fetching content:", error);
  }
});
// Fetch user profile information
app.get("/profileInfo", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const profileResult = await pool.query(
      `SELECT favorite_genres, bio 
       FROM users 
       WHERE user_id = $1`,
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({bio: profileResult.rows[0].bio, genres: profileResult.rows[0].favorite_genres});

  } catch (error) {
    console.error("Error fetching profile information:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//chats corresponding
// Get all messages between logged-in user and a friend
app.get("/messages", async (req, res) => {
  const userId = req.session.userId;
  const { friendId } = req.query; // <- Changed from req.params to req.query

  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const messages = await pool.query(
      `SELECT sender_id, receiver_id, message, timestamp
       FROM messages 
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1) and not is_read 
       ORDER BY timestamp ASC`,
      [userId, friendId]
    );

    res.status(200).json({message:messages.rows,user : userId});
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});



app.post("/messages", async (req, res) => {
  const senderId = req.session.userId;
  const friendId = req.body.friend;
  const msg = req.body.msg;

  if (!senderId || !friendId || !msg) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message)
       VALUES ($1, $2, $3)`,
      [senderId, friendId, msg]
    );
    const sender = await pool.query(
      "SELECT username FROM users WHERE user_id = $1",
      [senderId]
    );
    const senderName = sender.rows[0]?.username || `User ${senderId}`;
    
    await pool.query(
      `INSERT INTO notifications (user_id, type, from_user, content)
       VALUES ($1, 'message', $2, $3)`,
      [friendId, senderId, `New message from ${senderName}`]
    );
    
    res.status(201).json({ message: "Message sent" });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});




//chats end
// Update user profile information
app.post("/updateProfile", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { bio, genres } = req.body;

    // Basic validation
    if (!bio || !genres || !Array.isArray(genres) || genres.length < 3) {
      return res.status(400).json({ message: "Please provide a valid bio and at least 3 favorite genres." });
    }

    await pool.query(
      `UPDATE users 
       SET bio = $1, favorite_genres = $2 
       WHERE user_id = $3`,
      [bio, genres, userId]
    );

    res.status(200).json({ message: "Profile updated successfully" });

  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Reviews API
// POST: Create a new review
app.post("/reviews", isAuthenticated, async (req, res) => {
  try {
    const user_id = req.session.userId;
    const {content_id, rating, review_text } = req.body;

    // Insert new review
    const result = await pool.query(
      `INSERT INTO Reviews (user_id, content_id, rating, review_text)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, content_id, rating, review_text]
    );


    // Update the content's average rating
    const avgResult = await pool.query(
      `SELECT AVG(rating) AS average_rating
       FROM Reviews
       WHERE content_id = $1`,
      [content_id]
    );

    const averageRating = avgResult.rows[0].average_rating;

    await pool.query(
      `UPDATE Content
       SET rating_avg = $1
       WHERE content_id = $2`,
      [averageRating, content_id]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Reviews for a specific content
app.get("/reviews/:content_id", isAuthenticated, async (req, res) => {
  try {
    const { content_id } = req.params;
    console.log("hello");
    const result = await pool.query(
      `SELECT r.*, u.username
       FROM Reviews r
       JOIN Users u ON r.user_id = u.user_id
       WHERE r.content_id = $1
       ORDER BY r.created_at DESC`,
      [content_id]
    );
    console.log("hello");
    console.log(result.rows);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Edit a review
app.put("/reviews/:review_id", isAuthenticated, async (req, res) => {
  try {
    const { review_id } = req.params;
    const { rating, review_text } = req.body;

    const result = await pool.query(
      `UPDATE Reviews
       SET rating = $1, review_text = $2, updated_at = CURRENT_TIMESTAMP
       WHERE review_id = $3
       RETURNING *`,
      [rating, review_text, review_id]
    );
    
    // Recalculate and update content's average rating
    const avgResult = await pool.query(
      `SELECT AVG(rating) AS average_rating
       FROM Reviews
       WHERE content_id = (SELECT content_id FROM Reviews WHERE review_id = $1)`,
      [review_id]
    );
    const averageRating = avgResult.rows[0].average_rating;

    await pool.query(
      `UPDATE Content
       SET rating_avg = $1
       WHERE content_id = (SELECT content_id FROM Reviews WHERE review_id = $2)`,
      [averageRating, review_id]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Delete a review
app.delete("/reviews/:review_id", async (req, res) => {
  try {

    const { review_id } = req.params;

    const contentIdResult = await pool.query(
      `SELECT content_id FROM Reviews WHERE review_id = $1`,
      [review_id]
    );
    const content_id = contentIdResult.rows[0].content_id;

    await pool.query(`DELETE FROM Reviews WHERE review_id = $1`, [review_id]);

    // Recalculate and update content's average rating
    const avgResult = await pool.query(
      `SELECT AVG(rating) AS average_rating
       FROM Reviews
       WHERE content_id = $1`,
      [content_id]
    );
    const averageRating = avgResult.rows[0].average_rating;

    await pool.query(
      `UPDATE Content
       SET rating_avg = $1
       WHERE content_id = $2`,
      [averageRating, content_id]
    );

    res.status(200).json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/notifications", isAuthenticated, async (req, res) => {
  const { user } = req.query;  // Extracting the 'user' from the query parameter
  if (!user) {
    return res.status(400).json({ error: "User ID is required" });
  }
  try {
    const userResult = await pool.query(
      'SELECT user_id FROM users WHERE username = $1',
      [user]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userResult.rows[0].user_id;
    const notificationsQuery = `
      SELECT n.id, n.type, n.content, n.created_at, n.is_read, n.from_user,
             u.username AS from_username, n.movie_id
      FROM notifications n
      LEFT JOIN users u ON n.from_user = u.user_id
      WHERE n.user_id = $1 AND n.is_read = false
      ORDER BY n.created_at DESC
    `;
    const notificationsResult = await pool.query(notificationsQuery, [userId]);

    return res.json({ notifications: notificationsResult.rows });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Mark notifications as read
app.post("/notifications/read", async (req, res) => {
  const { notificationId } = req.body;

  if (!notificationId) {
    return res.status(400).json({ error: "Notification ID is required" });
  }

  try {
    await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = $1",
      [notificationId]
    );
    res.status(200).json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Collaborative filtering recommendations endpoint
app.get("/collab-recommendations", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const recs = await pool.query(
      `SELECT c.content_id, c.title, c.poster_url, r.predicted_rating
       FROM collab_recommendations r
       JOIN content c ON r.content_id = c.content_id
       WHERE r.user_id = $1
       ORDER BY r.predicted_rating DESC
       LIMIT 20`,
      [userId]
    );

    res.status(200).json({ data: recs.rows });
  } catch (error) {
    console.error("Error fetching collaborative recommendations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//likes, watchlist and history
// ---------- Likes ----------
app.post("/likes", async (req, res) => {
  const { contentId } = req.body;
  console.log("contentId",contentId);
  const userId = req.session.userId
  console.log("userId",userId);
  if (!userId || !contentId) return res.status(400).json({ error: "Missing user or content ID" });

  try {
    const existing = await pool.query(
      "SELECT * FROM likes WHERE user_id = $1 AND content_id = $2",
      [userId, contentId]
    );

    if (existing.rows.length > 0) {
      await pool.query("DELETE FROM likes WHERE user_id = $1 AND content_id = $2", [userId, contentId]);
      console.log("unliked",contentId);
      return res.json({ liked: false });
    } else {
      await pool.query("INSERT INTO likes (user_id, content_id) VALUES ($1, $2)", [userId, contentId]);
      console.log("liked",contentId);
      return res.json({ liked: true });
    }
  } catch (err) {
    console.error("Error handling likes:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/likes", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { rows } = await pool.query(
      `SELECT content.*,TRUE AS liked,
      EXISTS (
    SELECT 1 
    FROM watchlist 
    WHERE user_id = $1 AND content_id = likes.content_id
  ) AS inwatchlist
   ,
   EXISTS (
    SELECT 1 
    FROM watch_history 
    WHERE user_id = $1 AND content_id = likes.content_id
  ) AS watched FROM likes JOIN content ON likes.content_id = content.content_id WHERE likes.user_id = $1`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching liked content:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ---------- Watchlist ----------
app.post("/watchlist", async (req, res) => {
  const { contentId } = req.body;
  const userId = req.session.userId;

  if (!userId || !contentId) return res.status(400).json({ error: "Missing user or content ID" });

  try {
    const existing = await pool.query(
      "SELECT * FROM watchlist WHERE user_id = $1 AND content_id = $2",
      [userId, contentId]
    );

    if (existing.rows.length > 0) {
      await pool.query("DELETE FROM watchlist WHERE user_id = $1 AND content_id = $2", [userId, contentId]);
      return res.json({ inWatchlist: false });
    } else {
      await pool.query("INSERT INTO watchlist (user_id, content_id) VALUES ($1, $2)", [userId, contentId]);
      return res.json({ inWatchlist: true });
    }
  } catch (err) {
    console.error("Error handling watchlist:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/watchlist", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { rows } = await pool.query(
      `SELECT content.*,EXISTS (
    SELECT 1 
    FROM likes 
    WHERE user_id = $1 AND content_id = watchlist.content_id
  ) AS liked,
      TRUE AS inwatchlist,
   EXISTS (
    SELECT 1 
    FROM watch_history 
    WHERE user_id = $1 AND content_id = watchlist.content_id
  ) AS watched FROM watchlist JOIN content ON watchlist.content_id = content.content_id WHERE watchlist.user_id = $1`,
      [userId]
    );
    
    res.json(rows);
  } catch (err) {
    console.error("Error fetching watchlist:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// ---------- Watch History ----------
app.post("/history", async (req, res) => {
  const { contentId } = req.body;
  const userId = req.session.userId;

  if (!userId || !contentId) return res.status(400).json({ error: "Missing user or content ID" });

  try {
    const existing = await pool.query(
      "SELECT * FROM watch_history WHERE user_id = $1 AND content_id = $2",
      [userId, contentId]
    );
    if (existing.rows.length > 0) {
      await pool.query("DELETE FROM watch_history WHERE user_id = $1 AND content_id = $2", [userId, contentId]);
      console.log("unwatched",contentId);
      return res.json({ watched: false });
    }
    else{
    await pool.query(
      `INSERT INTO watch_history (user_id, content_id, watched_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, content_id) DO UPDATE SET watched_at = NOW()`,
      [userId, contentId]
    );
    await pool.query("DELETE FROM watchlist WHERE user_id = $1 AND content_id = $2", [userId, contentId]);
    res.json({ watched: true });}
  } catch (err) {
    console.error("Error adding to watch history:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/history", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { rows } = await pool.query(
      `SELECT content.*, wh.watched_at,
      EXISTS (
    SELECT 1 
    FROM likes 
    WHERE user_id = $1 AND content_id = content.content_id
  ) AS liked, EXISTS (
    SELECT 1 
    FROM watchlist 
    WHERE user_id = $1 AND content_id = content.content_id
  ) AS inwatchlist ,
   TRUE AS watched
       FROM watch_history wh JOIN content ON wh.content_id = content.content_id WHERE wh.user_id = $1 ORDER BY wh.watched_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching watch history:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
  app.post("/notify-friends", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated." });
    }
    console.log("notify-friends endpoint hit");
  
    const { content_id, friend_ids } = req.body;
    if (!content_id || !Array.isArray(friend_ids) || friend_ids.length === 0) {
      return res.status(400).json({ error: "Missing content_id or friend_ids" });
    }
  
    try {
      // Get movie title
      const contentResult = await pool.query(
        `SELECT title FROM content WHERE content_id = $1`,
        [content_id]
      );
      const movieTitle = contentResult.rows[0]?.title || "a movie";
  
      // Get sender username
      const userResult = await pool.query(
        `SELECT username FROM users WHERE user_id = $1`,
        [userId]
      );
      const senderName = userResult.rows[0]?.username || "Someone";
  
      // Prepare message
      const notificationText = `${senderName} shared the movie "${movieTitle}" with you.`;
  
      for (const friendId of friend_ids) {
        console.log("friendId:", friendId, "userId:", userId, "notificationText:", notificationText);
        await pool.query(
          `INSERT INTO notifications (user_id, type, from_user, content, movie_id)
           VALUES ($1, 'movie_shared', $2, $3, $4)`,
          [friendId, userId, notificationText, content_id]
        );
      }
  
      res.status(200).json({ message: "Notifications sent successfully." });
    } catch (err) {
      console.error("Error sending notifications:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  //--reviews--
app.get("/reviews", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const query = `
      SELECT 
        c.title AS "contentTitle",
        c.content_id AS "contentId",
        r.review_text AS "reviewText",
        r.rating
      FROM Reviews r
      JOIN content c ON r.content_id = c.content_id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC;
    `;

    const { rows } = await pool.query(query, [userId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching user reviews:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
//frined profiles
app.get('/friend/:id/profile', async (req, res) => {
  const friendId = req.params.id;

  try {
    const user = await pool.query(
      'SELECT username,favorite_genres, bio FROM users WHERE user_id = $1',
      [friendId]
    );


    if (user.rows.length === 0) return res.status(404).json({ error: "User not found" });
    console.log("lala",user.rows);
    res.json({
      username: user.rows[0].username,
      bio: user.rows[0].bio,
      genres: user.rows[0].favorite_genres,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});
app.get('/friend/:id/reviews', async (req, res) => {
  const friendId = req.params.id;

  try {
    const reviews = await pool.query(
      `SELECT r.rating, r.review_text, c.title AS contentTitle, c.content_id
       FROM reviews r
       JOIN content c ON r.content_id = c.content_id
       WHERE r.user_id = $1`,
      [friendId]
    );
    console.log("rev",reviews.rows);
    res.json(reviews.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching reviews' });
  }
});


async function generateBotRecommendations(title, description, genres) {
  console.log("Generating bot recommendations...");
  console.log("Title:", title);
  console.log("Description:", description);
  console.log("Genres:", genres);
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'bot_recom.py');
    const process = spawn('python', [scriptPath, title, description, JSON.stringify(genres)]);

    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Python script error:\n${errorOutput}`));
      }
    });
  });
}

app.post('/questions', isAuthenticated, async (req, res) => {
  try {
    const { title, body, tags } = req.body;
    const userId = req.session.userId;

    if (!title || !body) {
      return res.status(400).json({ message: "Title and body are required" });
    }

    // Insert question
    const questionResult = await pool.query(
      `INSERT INTO questions (user_id, title, body, tags)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, title, body, tags || []]
    );

    // Generate bot response
    const botResponse = await generateBotRecommendations(title, body, tags || []);
     
    // Insert bot answer with fallback
    try {
      await pool.query(
        `INSERT INTO answers (question_id, user_id, body, is_bot)
         VALUES ($1, 0, $2, true)`,
        [questionResult.rows[0].question_id, botResponse]
      );
    } catch (err) {
      if (err.code === '23503') { // Foreign key violation
        await pool.query(
          `INSERT INTO answers (question_id, body, is_bot)
           VALUES ($1, $2, true)`,
          [questionResult.rows[0].question_id, botResponse]
        );
      } else {
        throw err;
      }
    }

    res.status(201).json(questionResult.rows[0]);
  } catch (error) {
    console.error("Error in /questions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// Get all questions
app.get('/questions', async (req, res) => {
    console.log("Received question:", req.body); // Add this log
 
  try {
    const { search } = req.query;
    let query = `
      SELECT q.*, u.username, u.profile_picture,
             (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.question_id) as answer_count
      FROM questions q
      JOIN users u ON q.user_id = u.user_id
    `;
    const params = [];

    if (search) {
      query += ` WHERE q.title ILIKE $1 OR q.body ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY q.created_at DESC`;

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single question with answers
app.get('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get question
    const questionResult = await pool.query(
      `SELECT q.*, u.username, u.profile_picture
       FROM questions q
       JOIN users u ON q.user_id = u.user_id
       WHERE q.question_id = $1`,
      [id]
    );

    if (questionResult.rows.length === 0) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Get answers
    const answersResult = await pool.query(
      `SELECT a.*, u.username, u.profile_picture,
              COALESCE((
                SELECT SUM(value)
                FROM votes v
                WHERE v.answer_id = a.answer_id
              ), 0) as votes
       FROM answers a
       LEFT JOIN users u ON a.user_id = u.user_id
       WHERE a.question_id = $1
       ORDER BY votes DESC, a.created_at DESC`,
      [id]
    );

    res.status(200).json({
      question: questionResult.rows[0],
      answers: answersResult.rows
    });
  } catch (error) {
    console.error("Error fetching question:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Post answer
app.post('/questions/:id/answers', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req.body;
    const userId = req.session.userId;

    if (!body) {
      return res.status(400).json({ message: "Answer body is required" });
    }

    const result = await pool.query(
      `INSERT INTO answers (question_id, user_id, body)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, userId, body]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error posting answer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Vote on answer
app.post('/votes', isAuthenticated, async (req, res) => {
  try {
    const { answerId, value } = req.body;
    const userId = req.session.userId;

    if (![-1, 1].includes(value)) {
      return res.status(400).json({ message: "Invalid vote value" });
    }

    // Check if user already voted
    const existingVote = await pool.query(
      `SELECT * FROM votes
       WHERE answer_id = $1 AND user_id = $2`,
      [answerId, userId]
    );

    if (existingVote.rows.length > 0) {
      // Update existing vote
      await pool.query(
        `UPDATE votes SET value = $1
         WHERE answer_id = $2 AND user_id = $3`,
        [value, answerId, userId]
      );
    } else {
      // Create new vote
      await pool.query(
        `INSERT INTO votes (answer_id, user_id, value)
         VALUES ($1, $2, $3)`,
        [answerId, userId, value]
      );
    }

    // Get updated vote count
    const voteCount = await pool.query(
      `SELECT COALESCE(SUM(value), 0) as total
       FROM votes
       WHERE answer_id = $1`,
      [answerId]
    );

    res.status(200).json({ votes: voteCount.rows[0].total });
  } catch (error) {
    console.error("Error voting:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
async function getFriendsTopRatedRecs(userId) {
  try {
    const { rows } = await pool.query(
      `SELECT 
        c.content_id, 
        c.title, 
        c.poster_url, 
        c.genre,
        'friends_top_rated' AS type,
        AVG(r.rating) AS avg_rating,
        COUNT(r.review_id) AS rating_count,
        EXISTS (
          SELECT 1 
          FROM likes 
          WHERE user_id = $1 AND content_id = c.content_id
        ) AS liked,
        EXISTS (
          SELECT 1 
          FROM watchlist 
          WHERE user_id = $1 AND content_id = c.content_id
        ) AS inwatchlist,
        EXISTS (
          SELECT 1 
          FROM watch_history 
          WHERE user_id = $1 AND content_id = c.content_id
        ) AS watched
      FROM content c
      JOIN reviews r ON c.content_id = r.content_id
      WHERE r.user_id IN (
        -- Get all accepted friends (both directions)
        SELECT CASE 
          WHEN f.user_id = $1 THEN f.friend_id
          WHEN f.friend_id = $1 THEN f.user_id
        END AS friend_id
        FROM friends f
        WHERE (f.user_id = $1 OR f.friend_id = $1)
        AND f.status = 'accepted'
      )
      AND r.user_id != $1  -- Exclude the user's own ratings
      GROUP BY c.content_id, c.title, c.poster_url, c.genre
      HAVING AVG(r.rating) > 0
      ORDER BY avg_rating DESC, rating_count DESC
      LIMIT 10`,
      [userId]
    );
    return rows;
  } catch (error) {
    console.error("Error in friends top rated recommendations:", error);
    return [];
  }
}

