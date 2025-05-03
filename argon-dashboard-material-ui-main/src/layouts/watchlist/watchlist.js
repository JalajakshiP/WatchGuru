import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MovieCard from "components/ScreenCards/moviecard";
import { apiUrl } from "config/config";
import { Box } from "@mui/material";

function ListContent() {
  const [listAnimes, setListAnimes] = useState([]);
  const [listMovies, setListMovies] = useState([]);
  const [listShows, setListShows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchList = async () => {
      try {
        const response = await fetch(`${apiUrl}/watchlist`, {
          credentials: "include",
        });
        const result = await response.json();
        const animes = result.filter((item) => item.content_type === "anime");
        const movies = result.filter((item) => item.content_type === "movie");
        const shows = result.filter((item) => item.content_type === "show");

        setListAnimes(animes);
        setListMovies(movies);
        setListShows(shows);
      } catch (err) {
        console.error("Error fetching list content", err);
      }
    };

    fetchList();
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
  const nothing =
    listAnimes.length === 0 &&
    listMovies.length === 0 &&
    listShows.length === 0;
  return (
    <DashboardLayout>
      <DashboardNavbar setSearchQuery={setSearchQuery} />
      <ArgonBox py={3} px={2} sx={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
        <ArgonTypography variant="h3" color="black" mb={4}>
           Watchlist📃
        </ArgonTypography>

        {nothing ? (<Box textAlign="center" mt={6}>
          <img
            src="https://media.giphy.com/media/hhqLxYqC260vPlMPXI/giphy.gif"
            alt="Nothing Watched"
            style={{ width: "300px", maxWidth: "100%" }}
          />
          <ArgonTypography variant="h5" mt={2} color="text">
            Looks like you haven’t added anything to watch yet... Time to binge!
          </ArgonTypography>
        </Box>) : (<>
          {renderSection(" Animes", listAnimes)}
          {renderSection(" Movies", listMovies)}
          {renderSection(" Shows & Dramas", listShows)}
        </>
        )}
      </ArgonBox>
    </DashboardLayout>
  );
}

export default ListContent;
