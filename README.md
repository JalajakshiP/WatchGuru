# 🎬 WatchGuru

**A shared rating and recommendation platform for movies, dramas, and anime.**

![WatchGuru Banner](https://github.com/user-attachments/assets/39d71501-1183-4fe4-a65c-9d36816cddfc)  

## 🚀 About the Project
WatchGuru is an **entertainment-focused platform** designed to help users discover new movies, shows, and anime based on their preferences and social connections. Inspired by Goodreads, it enhances the content discovery experience by integrating **personalized recommendations, reviews, and social interactions**.

## ✨ Features
- 🔑 **User Authentication** – Secure signup/login with profile management.
- 🎞️ **Content Discovery** – Explore movies, shows, and anime with detailed summaries.
- ⭐ **Ratings & Reviews** – Public and friend-based reviews with optional anonymous posting.
- 🤝 **Social Connections** – Add friends and get personalized recommendations based on shared interests.
- 📝 **Watch History & Lists** – Keep track of what you’ve watched and create custom watchlists.
- 🔥 **Trending Content** – Find popular movies and shows based on global and local trends.
- 💬 **Discussions & Private Chats** – Open forums and DMs to share thoughts and recommendations.
- 🎁 **Merchandise Links** – Buy official merchandise or book adaptations.
- 👪 **Parental Control** – Kid-friendly mode with age-appropriate filters.
- 🎭 **Advanced Filters** – Search content by genre, mood, cast, and streaming availability.

## 🛠️ Tech Stack
- **Frontend**: React.js (with Tailwind CSS & ShadCN UI)
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (Hosted on Railway/Supabase)
- **Authentication**: JWT & bcrypt
- **External APIs**: TMDb / Jikan (for fetching movie & anime details)
- **Hosting**: Vercel (Frontend) & Render (Backend)

## 🎯 Project Setup
### Prerequisites
- [Node.js](https://nodejs.org/en/)
- [PostgreSQL](https://www.postgresql.org/)
- A cloud database (e.g., Railway, Supabase, Render)

### Installation
```sh
# Clone the repository
git clone https://github.com/your-username/watchguru.git
cd watchguru
```

#### Backend Setup
```sh
cd backend
npm install
# Create a .env file and add DB connection details
npm start
```

#### Frontend Setup
```sh
cd frontend
npm install
npm run dev
```

## 🎯 Database Schema (Initial Tables)
```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    profile_picture TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE content (
    content_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('movie', 'show', 'anime')),
    release_date DATE,
    genre TEXT[],
    poster_url TEXT,
    description TEXT,
    rating_avg FLOAT DEFAULT 0.0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE friends (
    friendship_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    friend_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🌱 Contributing
We welcome contributions! Feel free to fork this repo, open issues, and submit pull requests. See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).

## 🎉 Team Members
- **Bhavya Sri Mamidi** (22B0918)
- **Jasmitha Jajala** (22B0997)
- **Jalajakshi Palli** (22B1047)
- **Mahak Sahu** (22B1051)

## 💡 Support
If you like this project, ⭐ star the repo and spread the word!

---
🚀 *WatchGuru – Your Personalized Entertainment Guide!*