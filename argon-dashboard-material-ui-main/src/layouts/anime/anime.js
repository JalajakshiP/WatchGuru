import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MovieCard from "components/ScreenCards/moviecard"; // import your updated card
import { apiUrl } from "config/config";

function AnimeList() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch(`${apiUrl}/recommendanimes`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const result = await response.json();
        setMovies(result.data); // access .data from your response
      } catch (error) {
        console.error("Error fetching content:", error);
      }
    };

    fetchMovies();
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3} px={2} sx={{ backgroundColor: "#121212", minHeight: "100vh" }}>
        <ArgonTypography variant="h4" color="white" mb={4}>
          Explore More Animes
        </ArgonTypography>
        <Grid container spacing={2}>
          {movies.map((movie, index) => (
            <Grid item xs={6} sm={4} md={3} lg={2.4} key={index}>
              <MovieCard
                image={movie.poster_url}
                title={movie.title}
                genres={movie.genre}
              />
            </Grid>
          ))}
        </Grid>
      </ArgonBox>
    </DashboardLayout>
  );
}

export default AnimeList;
