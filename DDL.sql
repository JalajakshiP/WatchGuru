CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    profile_picture TEXT DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_of_birth DATE NOT NULL,
    favorite_genres TEXT[] DEFAULT NULL,;
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
