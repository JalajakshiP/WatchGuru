CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    profile_picture TEXT DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_of_birth DATE NOT NULL,
    favorite_genres TEXT[] DEFAULT NULL,
    is_kid_friendly BOOLEAN DEFAULT FALSE
);

CREATE TABLE content (
content_id SERIAL PRIMARY KEY,
title VARCHAR(255) NOT NULL,
content_type VARCHAR(20) CHECK (content_type IN ('movie', 'show' , 'drama', 'anime')),
description TEXT,
release_date DATE,
genre TEXT[],
age_rating VARCHAR(10),
language VARCHAR(50),
duration INT,
director VARCHAR(100),
"cast" TEXT[], -- fixed
streaming_info TEXT[],
trailer_url TEXT,
poster_url TEXT,
rating_avg FLOAT DEFAULT 0.0
);

CREATE TABLE friends (
    friendship_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    friend_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- chats 
CREATE TABLE messages (
  message_id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(user_id),
  receiver_id INTEGER REFERENCES users(user_id),
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE
);
-- chats

-- reviews
CREATE TABLE Reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    content_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user
      FOREIGN KEY(user_id)
      REFERENCES Users(user_id)
      ON DELETE CASCADE,

    CONSTRAINT fk_content
      FOREIGN KEY(content_id)
      REFERENCES Content(content_id)
      ON DELETE CASCADE
);
-- reviews

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'friend_accept', 'message')),
  from_user INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);
-- notifications

CREATE TABLE IF NOT EXISTS collab_recommendations (
id SERIAL PRIMARY KEY,
user_id INT NOT NULL,
content_id INT NOT NULL,
predicted_rating FLOAT NOT NULL
);
-- collaborative recommendations
CREATE TABLE IF NOT EXISTS svd_user_factors (
user_id INT PRIMARY KEY REFERENCES users(user_id),
factors FLOAT[] NOT NULL
);

CREATE TABLE IF NOT EXISTS svd_item_factors (
content_id INT PRIMARY KEY REFERENCES content(content_id),
factors FLOAT[] NOT NULL
);

CREATE TABLE IF NOT EXISTS movie_similarity (
movie_id1 INT REFERENCES content(content_id),
movie_id2 INT REFERENCES content(content_id),
similarity FLOAT NOT NULL,
PRIMARY KEY (movie_id1, movie_id2)
);

CREATE TABLE IF NOT EXISTS user_similarity (
user_id1 INT REFERENCES users(user_id),
user_id2 INT REFERENCES users(user_id),
similarity FLOAT NOT NULL,
PRIMARY KEY (user_id1, user_id2)
);