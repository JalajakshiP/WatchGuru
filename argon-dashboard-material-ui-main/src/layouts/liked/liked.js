import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MovieCard from "components/ScreenCards/moviecard";
import { apiUrl } from "config/config";

function LikedContent() {
  const [likedAnimes, setLikedAnimes] = useState([]);
  const [likedMovies, setLikedMovies] = useState([]);
  const [likedShows, setLikedShows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchLiked = async () => {
      try {
        const response = await fetch(`${apiUrl}/likes`, {
          credentials: "include",
        });
        const result = await response.json();
        const animes = result.filter((item) => item.content_type === "anime");
        const movies = result.filter((item) => item.content_type === "movie");
        const shows = result.filter((item) => item.content_type === "show" );

        setLikedAnimes(animes);
        setLikedMovies(movies);
        setLikedShows(shows);
      } catch (err) {
        console.error("Error fetching liked content", err);
      }
    };

    fetchLiked();
  }, []);

  const renderSection = (title, items) => (
    <>
      {items.length > 0 && (
        <>
          <ArgonTypography variant="h4" color="black" mt={4} mb={2}>
            {title}
          </ArgonTypography>
          <Grid container spacing={2}>
            {items
              .filter((item) =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((item, index) => (
                <Grid item xs={6} sm={4} md={3} lg={2.4} key={index}>
                  <MovieCard
                    image={item.poster_url}
                    title={item.title}
                    genres={item.genre}
                    contentId={item.content_id}
                    liked={item.liked}
                    inWatchlist={item.inwatchlist}
                    watched={item.watched}
                  />
                </Grid>
              ))}
          </Grid>
        </>
      )}
    </>
  );

  return (
    <DashboardLayout>
      <DashboardNavbar setSearchQuery={setSearchQuery} />
      <ArgonBox py={3} px={2} sx={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
        <ArgonTypography variant="h3" color="black" mb={4}>
          Your Liked Content
        </ArgonTypography>
        {renderSection("Liked Animes", likedAnimes)}
        {renderSection("Liked Movies", likedMovies)}
        {renderSection("Liked Shows & Dramas", likedShows)}
      </ArgonBox>
    </DashboardLayout>
  );
}

export default LikedContent;
