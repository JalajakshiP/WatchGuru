import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { apiUrl } from "config/config"; 
import React from "react";
// react-router-dom components
import { Link } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonInput from "components/ArgonInput";
import ArgonButton from "components/ArgonButton";

// Authentication layout components
import CoverLayout from "layouts/authentication/components/CoverLayout";
import Separator from "layouts/authentication/components/Separator";



// All available genres
const GENRES = [
  "Art", "Biography", "Business", "Chick Lit", "Children's",
  "Christian", "Classics", "Comics", "Contemporary", "Cookbooks",
  "Crime", "Ebooks", "Fantasy", "Fiction", "Gay and Lesbian",
  "Graphic Novels", "Historical Fiction", "History", "Horror", "Humor and Comedy",
  "Manga", "Memoir", "Music", "Mystery", "Nonfiction",
  "Paranormal", "Philosophy", "Poetry", "Psychology", "Religion",
  "Romance", "Science", "Science Fiction", "Self Help", "Suspense",
  "Spirituality", "Sports", "Thriller", "Travel", "Young Adult"
];

function SelectGenres() {
  const location = useLocation();
  const { name, email, password, birthdate } = location.state || {};
  const navigate = useNavigate();
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!name || !email || !password || !birthdate) {
      navigate("/authentication/sign-up");
    }
  }, []);
  

  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleSubmit = async () => {
    if (selectedGenres.length < 3) {
      setError("Please select at least 3 genres");
      return;
    }
  
    try {
      const response = await fetch(`${apiUrl}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          password,
          birthdate,
          genres: selectedGenres,
        }),
      });
  
      if (!response.ok) throw new Error("Signup failed");
      
      const data = await response.json();
      localStorage.setItem("user", data.name);
      
      navigate("/dashboard"); // or /recommendations if that’s your next step
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <ArgonBox
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      p={3}
    >
      <Card sx={{ p: 4, maxWidth: "800px", width: "100%" }}>
        <ArgonTypography variant="h3" textAlign="center" mb={3}>
          Select Your Favorite Genres
        </ArgonTypography>
        <ArgonTypography variant="body1" textAlign="center" mb={4}>
          Choose at least one genre to get personalized recommendations
        </ArgonTypography>

        <ArgonBox
          display="grid"
          gridTemplateColumns={{ xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" }}
          gap={2}
          mb={4}
        >
          {GENRES.map(genre => (
            <ArgonButton
              key={genre}
              variant={selectedGenres.includes(genre) ? "contained" : "outlined"}
              color="dark"
              size="small"
              fullWidth
              onClick={() => toggleGenre(genre)}
            >
              {genre}
            </ArgonButton>
          ))}
        </ArgonBox>

        {error && (
          <ArgonTypography variant="caption" color="error" textAlign="center" display="block" mb={2}>
            {error}
          </ArgonTypography>
        )}

        <ArgonBox display="flex" justifyContent="center">
          <ArgonButton
            variant="gradient"
            color="dark"
            size="large"
            onClick={handleSubmit}
            disabled={selectedGenres.length === 0}
          >
            Continue
          </ArgonButton>
        </ArgonBox>
      </Card>
    </ArgonBox>
  );
}

export default SelectGenres;