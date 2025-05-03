import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MovieCard from "components/ScreenCards/moviecard";
import { apiUrl } from "config/config";
import { Box } from "@mui/material";

function WatchedContent() {
  const [WatchedAnimes, setWatchedAnimes] = useState([]);
  const [WatchedMovies, setWatchedMovies] = useState([]);
  const [WatchedShows, setWatchedShows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchWatched = async () => {
      try {
        const response = await fetch(`${apiUrl}/history`, {
          credentials: "include",
        });
        const result = await response.json();
        const animes = result.filter((item) => item.content_type === "anime");
        const movies = result.filter((item) => item.content_type === "movie");
        const shows = result.filter(
          (item) =>
            item.content_type === "show" || item.content_type === "drama"
        );

        setWatchedAnimes(animes);
        setWatchedMovies(movies);
        setWatchedShows(shows);
      } catch (err) {
        console.error("Error fetching Watched content", err);
      }
    };

    fetchWatched();
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
                    watched={true}
                  />
                </Grid>
              ))}
          </Grid>
        </>
      )}
    </>
  );

  const nothingWatched =
    WatchedAnimes.length === 0 &&
    WatchedMovies.length === 0 &&
    WatchedShows.length === 0;

  return (
    <DashboardLayout>
      <DashboardNavbar setSearchQuery={setSearchQuery} />
      <ArgonBox py={3} px={2} sx={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
        <ArgonTypography variant="h3" color="black" mb={4}>
          Previously Watched⌛
        </ArgonTypography>

        {nothingWatched ? (
          <Box textAlign="center" mt={6}>
            <img
              src="https://media.giphy.com/media/hhqLxYqC260vPlMPXI/giphy.gif"
              alt="Nothing Watched"
              style={{ width: "300px", maxWidth: "100%" }}
            />
            <ArgonTypography variant="h5" mt={2} color="text">
              Looks like you haven’t watched anything yet... Time to binge!
            </ArgonTypography>
          </Box>
        ) : (
          <>
            {renderSection("Watched Animes", WatchedAnimes)}
            {renderSection("Watched Movies", WatchedMovies)}
            {renderSection("Watched Shows & Dramas", WatchedShows)}
          </>
        )}
      </ArgonBox>
    </DashboardLayout>
  );
}

export default WatchedContent;
