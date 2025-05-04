import React, { useEffect, useState, useMemo } from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { Refresh } from "@mui/icons-material";
import { Button, Popover } from "@mui/material";



import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MovieCard from "components/ScreenCards/moviecard";
import { apiUrl } from "config/config";
const GENRE_OPTIONS = ["Action", "Drama", "Comedy", "Horror", "Romance", "Sport", "Fantasy", "Thriller", "Sci-Fi", "Adventure", "Mystery", "Biography", "Historical", "Musical"];
const LANGUAGE_OPTIONS = ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Malayalam", "Thai", "Chinese", "Korean", "Japanese", "Mandarin"];

function Dashboard() {
  const [data, setData] = useState({ sections: [], exploreMore: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showGenres, setShowGenres] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);

  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const popoverOpen = Boolean(anchorEl);
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

  const matchesFilters = (movie) => {
    const lowerQuery = searchQuery.toLowerCase();
    const genres = movie.genre || []; // Default to an empty array if undefined
    const languages = movie.language || ''; // Default to an empty string if undefined
    const cast = movie.cast || []; // Default to an empty array if undefined

    // Handle search by title or cast
    const matchesSearch = movie.title.toLowerCase().includes(lowerQuery) ||
      (Array.isArray(movie.cast) && movie.cast.some(person => person.toLowerCase().includes(lowerQuery)));

    // Handle genre filter
    const matchesGenre = selectedGenres.length === 0 || selectedGenres.some(genre => movie.genre?.includes(genre));

    // Handle language filter
    const matchesLanguage = selectedLanguages.length === 0 || selectedLanguages.some(lang => movie.language?.toLowerCase().includes(lang.toLowerCase()));

    return matchesSearch && matchesGenre && matchesLanguage;
  };

  const filteredSections = useMemo(() => {

    return data.sections
      .map((section) => ({
        ...section,
        movies: section.movies.filter(matchesFilters)
      }))
      .filter((section) => section.movies.length > 0);
  }, [data.sections, searchQuery, selectedGenres, selectedLanguages]);

  const filteredExploreMore = useMemo(() => {
    return data.exploreMore.filter(matchesFilters);
  }, [data.exploreMore, searchQuery, selectedGenres, selectedLanguages]);

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
         {/* Filter Button and Popover placed above the recommendations */}
         <Box mb={3}>
          <Button
            variant="outlined"
            onClick={handleFilterClick}
            sx={{
              backgroundColor: "#ffffff",
              color: "#000000",
              border: "1px solid #ccc",
              "&:hover": {
                backgroundColor: "#f0f0f0",
              },
              mb: 2,
              cursor: "pointer",
            }}
          >
            Apply Filter🗃️
          </Button>
          <Popover
            open={popoverOpen}
            anchorEl={anchorEl}
            onClose={handlePopoverClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left"
            }}
            PaperProps={{
              sx: {
                backgroundColor: "#FFFFFF", // Changed to white for better visibility
                color: "black", // Ensured text color is black for visibility in white background
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                padding: "16px", // Increased padding for better layout
                minWidth: "250px" // Ensures the popover has a sufficient width to fit all options
              }
            }}
          >
            <Box sx={{ px: 2, py: 2, minWidth: 250 }}>
              {/* Genre Select as Buttons */}
              <Typography variant="h6" color="black" sx={{ mb: 1, cursor: "pointer"}} onClick={() => setShowGenres((prev) => !prev)}>
                Select Genres
              </Typography>
              {showGenres && (
                <Box sx={{ mb: 2 }}>
                  {GENRE_OPTIONS.map((genre) => (
                    <Button
                      key={genre}
                      variant={selectedGenres.includes(genre) ? "contained" : "outlined"}
                      onClick={() => {
                        setSelectedGenres((prev) =>
                          prev.includes(genre)
                            ? prev.filter((g) => g !== genre)
                            : [...prev, genre]
                        );
                      }}
                      sx={{
                        marginRight: 1,
                        mb: 1,
                        minWidth: "120px",
                        backgroundColor: selectedGenres.includes(genre) ? "#1976d2" : "#f5f5f5", // Light gray background for unselected
                        color: selectedGenres.includes(genre) ? "#fff" : "#000", // White for selected, black for unselected
                        border: "1px solid #ccc", // Light border for visibility
                        "&:hover": {
                          backgroundColor: selectedGenres.includes(genre) ? "#115293" : "#e0e0e0"
                        }
                      }}
                    >
                      {genre}
                    </Button>
                  ))}
                </Box>
              )}

              {/* Language Select as Buttons */}
              <Typography variant="h6" color="black" sx={{ mb: 1, mt: 2, cursor: "pointer"}} onClick={() => setShowLanguages((prev) => !prev)}>
                Select Languages
              </Typography>
              {showLanguages && (
                <Box>
                  {LANGUAGE_OPTIONS.map((language) => (
                    <Button
                      key={language}
                      variant={selectedLanguages.includes(language) ? "contained" : "outlined"}
                      onClick={() => {
                        setSelectedLanguages((prev) =>
                          prev.includes(language)
                            ? prev.filter((l) => l !== language)
                            : [...prev, language]
                        );
                      }}
                      sx={{
                        marginRight: 1,
                        mb: 1,
                        minWidth: "120px",
                        backgroundColor: selectedLanguages.includes(language) ? "#1976d2" : "#f5f5f5",
                        color: selectedLanguages.includes(language) ? "#fff" : "#000",
                        border: "1px solid #ccc",
                        "&:hover": {
                          backgroundColor: selectedLanguages.includes(language) ? "#115293" : "#e0e0e0",
                        },
                      }}
                    >
                      {language}
                    </Button>
                  ))}
                </Box>
              )}
            </Box>
          </Popover>
        </Box>

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
                    watched={movie.watched}
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
                    watched={movie.watched}
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
