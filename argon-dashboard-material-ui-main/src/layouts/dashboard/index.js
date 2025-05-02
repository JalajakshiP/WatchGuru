import React, { useEffect, useState, useMemo } from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { Refresh } from "@mui/icons-material";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MovieCard from "components/ScreenCards/moviecard";
import { apiUrl } from "config/config";

function Dashboard() {
  const [data, setData] = useState({ sections: [], exploreMore: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/recommendations`, {
        credentials: "include"
      });
  
      if (!response.ok) throw new Error("Failed to load recommendations");
  
      const result = await response.json();
  
      // NO manual filtering or slicing anymore
      setData(result);
  
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRecommendations();
  }, []);

  const filteredSections = useMemo(() => {
    if (!searchQuery) return data.sections;

    return data.sections
      .map(section => ({
        ...section,
        movies: section.movies.filter(movie =>
          movie.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }))
      .filter(section => section.movies.length > 0);
  }, [data.sections, searchQuery]);

  const filteredExploreMore = useMemo(() => {
    if (!searchQuery) return data.exploreMore;
    return data.exploreMore.filter(movie =>
      movie.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data.exploreMore, searchQuery]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress size={60} />
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <Box p={3}>
          <Alert
            severity="error"
            action={
              <IconButton onClick={fetchRecommendations} color="inherit">
                <Refresh />
              </IconButton>
            }
          >
            {error}
          </Alert>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar setSearchQuery={setSearchQuery} />
      <Box sx={{ p: 3, backgroundColor: "#FFFFF", minHeight: "100vh" }}>
        <Typography variant="h4" color="white" gutterBottom>
          Your Personalized Recommendations
        </Typography>

        {filteredSections.map((section) => (
          <Box key={section.type} sx={{ mb: 4 }}>
            <Typography variant="h5" color="white" gutterBottom>
              {section.title}
            </Typography>
            <Grid container spacing={2}>
              {section.movies.map((movie) => (
                <Grid item xs={6} sm={4} md={3} lg={2.4} key={`${section.type}-${movie.content_id}`}>
                  <MovieCard
                    image={movie.poster_url}
                    title={movie.title}
                    genres={movie.genre}
                    contentId={movie.content_id}
                    rating={movie.rating || movie.score}
                    liked={movie.liked}
                    inWatchlist={movie.inwatchlist}
                    history={movie.history}
                    type={section.type}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}

        {filteredExploreMore.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" color="white" gutterBottom>
              More to Explore
            </Typography>
            <Grid container spacing={2}>
              {filteredExploreMore.map((movie) => (
                <Grid item xs={6} sm={4} md={3} lg={2.4} key={`explore-${movie.content_id}`}>
                  <MovieCard
                    image={movie.poster_url}
                    title={movie.title}
                    genres={movie.genre}
                    contentId={movie.content_id}
                    rating={movie.rating || movie.score}
                    type="explore"
                    liked={movie.liked}
                    inWatchlist={movie.inwatchlist}
                    history={movie.history}
                  />


                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {filteredSections.length === 0 && filteredExploreMore.length === 0 && (
          <Typography color="white">
            No results found for "{searchQuery}"
          </Typography>
        )}
      </Box>
    </DashboardLayout>
  );
}

export default Dashboard;
