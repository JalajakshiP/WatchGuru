import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MovieCard from "components/ScreenCards/moviecard"; // import your updated card
import { apiUrl } from "config/config";

function ShowList() {
  const [recommendedShows, setRecommendedShows] = useState([]);
    const [otherShows, setOtherShows] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch(`${apiUrl}/recommendshows`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const result = await response.json();
        setRecommendedShows(result.recommended); // access .data from your response
        setOtherShows(result.others);
      } catch (error) {
        console.error("Error fetching content:", error);
      }
    };

    fetchMovies();
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar setSearchQuery={setSearchQuery}/>
      <ArgonBox py={3} px={2} sx={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
        <ArgonTypography variant="h4" color="black" mb={4}>
           Shows For You
        </ArgonTypography>
        <Grid container spacing={2}>
          {recommendedShows
          .filter((movie) =>
            movie.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((movie, index) => (
            <Grid item xs={6} sm={4} md={3} lg={2.4} key={index}>
              <MovieCard
                image={movie.poster_url}
                title={movie.title}
                genres={movie.genre}
              />
            </Grid>
          ))}
        </Grid>

        <ArgonTypography variant="h4" color="black" mb={3}>
          Explore More Shows
        </ArgonTypography>
        <Grid container spacing={2}>
          {otherShows
          .filter((movie) =>
            movie.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((movie, index) => (
            <Grid item xs={6} sm={4} md={3} lg={2.4} key={`other-${index}`}>
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

export default ShowList;
