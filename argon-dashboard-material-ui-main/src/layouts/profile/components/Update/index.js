import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Argon Dashboard Components
import ArgonBox from "components/ArgonBox";
import ArgonInput from "components/ArgonInput";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";

// Layout Components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import { apiUrl } from "config/config";
import { Select, MenuItem, InputLabel, FormControl, Chip, OutlinedInput, Box, Card, Grid } from "@mui/material";

function EditProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    bio: "",
    genres: []
  });

  useEffect(() => {
    const fetchInfo = async () => {
    try {
    const response = await fetch(`${apiUrl}/profileInfo`, {
        method: "GET",
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Network response was not ok");
    }

    const result = await response.json();
    setProfile({
        bio: result.bio,
        genres: result.genres,
    });
    
    } 
    catch (error) {
    console.error("Error fetching content:", error);
    }
    };

    fetchInfo();
    }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${apiUrl}/updateProfile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(profile),
    });

    if (res.ok) {
      alert("Profile updated successfully!");
      navigate("/profile");
    } 
    else {
      alert("Failed to update profile.");
    }
  };

  const handleCancel = () => {
    navigate("/profile"); // or close the modal if applicable
  };
  
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

  return (
    <DashboardLayout>
      <DashboardNavbar />
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
            Edit Your Profile
          </ArgonTypography>
          <ArgonTypography variant="body1" textAlign="center" mb={4}>
            Update your bio and favorite genres to get the best recommendations!
          </ArgonTypography>
    
          <form onSubmit={handleSubmit}>
            <ArgonBox mb={3}>
              <ArgonTypography variant="h6" fontWeight="medium" mb={1}>
                Bio
              </ArgonTypography>
              <ArgonInput
                component="textarea"
                name="bio"
                value={profile.bio || ""}
                onChange={handleChange}
                placeholder="Tell us something about yourself..."
                rows={4}
                fullWidth
              />
            </ArgonBox>
    
            <ArgonBox mb={3}>
              <ArgonTypography variant="h6" fontWeight="medium" mb={1}>
                Favorite Genres
              </ArgonTypography>
              <FormControl fullWidth>
                <InputLabel id="genre-label">Select Genres</InputLabel>
                <Select
                  labelId="genre-label"
                  multiple
                  name="genres"
                  value={profile.genres || []}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      genres: e.target.value,
                    }))
                  }
                  input={<OutlinedInput label="Select Genres" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  {GENRES.map((genre) => (
                    <MenuItem key={genre} value={genre}>
                      {genre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </ArgonBox>

            <ArgonBox display="flex" justifyContent="space-between" mt={3}>
              <ArgonButton color="secondary" onClick={handleCancel}>
                Cancel
              </ArgonButton>
              <ArgonButton type="submit" color="info" variant="gradient">
                Save Changes
              </ArgonButton>
            </ArgonBox>

          </form>
        </Card>
      </ArgonBox>
    </DashboardLayout>
  );
}

export default EditProfile;
