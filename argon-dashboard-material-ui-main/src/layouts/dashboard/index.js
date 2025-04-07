import React from 'react';
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

// Argon Dashboard 2 MUI base styles
import typography from "assets/theme/base/typography";
import MovieRow from 'components/ScreenCards/movierow';
import { apiUrl } from "config/config"; // your base URL
import { useEffect, useState } from "react";

function Default() {
  const { size } = typography;
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch(`${apiUrl}/recommendations`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        setMovies(response.data);
      } catch (error) {
        console.error('Error fetching content:', error);
      }
    };

    fetchMovies();
  }, []);

  const groupedByGenre = movies.reduce((acc, movie) => {
    if (!acc[movie.genre]) acc[movie.genre] = [];
    acc[movie.genre].push(movie);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3} px={2} sx={{ backgroundColor: "#121212", minHeight: "100vh" }}>
        <ArgonTypography variant="h4" color="white" mb={4}>
          Welcome to WatchGuru
        </ArgonTypography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {Object.entries(groupedByGenre).map(([genre, genreMovies]) => (
              <MovieRow key={genre} title={genre} movies={genreMovies} />
            ))}
          </Grid>
        </Grid>
      </ArgonBox>
    </DashboardLayout>
  );
}

export default Default;
