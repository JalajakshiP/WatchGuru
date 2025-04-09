import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { 
  Grid, Card, CardMedia, CardContent, 
  Typography, Chip, Box, Divider,
  CircularProgress
} from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { apiUrl } from "config/config";

function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("Fetching details for movie ID:", id); // Should log "4"
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        console.log("Making request to:", `${apiUrl}/content/${id}`);

        const response = await fetch(`${apiUrl}/content/${id}`, {
          method: "GET",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log("Response status:", response.status);


        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Response status:", response.status);
        

        if (!result.content) {
          throw new Error("No content data received");
        }

        setMovie(result.content);
        setSimilarMovies(result.similar || []);
        setError(null);
      } catch (error) {
        console.error("Fetch error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress color="secondary" />
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <Box p={4} color="white">
          <Typography variant="h5">Error loading movie</Typography>
          <Typography>{error}</Typography>
          <Typography>Please try again later.</Typography>
        </Box>
      </DashboardLayout>
    );
  }

  if (!movie) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <Box p={4} color="white">
          <Typography variant="h5">Movie not found</Typography>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <DashboardNavbar />
    <Box sx={{ p: 3, backgroundColor: "#ffffff", minHeight: "100vh", color: "white" }}>
      <Grid container spacing={4}>
        {/* Movie Poster Column */}
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: "background.paper" }}>
            <CardMedia
              component="img"
              image={movie.poster_url}
              alt={movie.title}
              sx={{ width: "100%", objectFit: "cover" }}
            />
          </Card>
        </Grid>

        {/* Movie Details Column */}
        <Grid item xs={12} md={8}>
          <Typography variant="h3" gutterBottom>
            {movie.title}
          </Typography>
          
          {/* Genres */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            {movie.genre.map((genre, index) => (
              <Chip 
                key={index} 
                label={genre} 
                sx={{ 
                  bgcolor: "primary.main", 
                  color: "white",
                  fontSize: "0.875rem",
                  height: 24
                }} 
              />
            ))}
          </Box>

          {/* Metadata */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {movie.description}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <Typography variant="subtitle2" color="textSecondary">
                  Release Date
                </Typography>
                <Typography>
                  {new Date(movie.release_date).toLocaleDateString()}
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={4}>
                <Typography variant="subtitle2" color="textSecondary">
                  Director
                </Typography>
                <Typography>
                  {movie.direction}
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={4}>
                <Typography variant="subtitle2" color="textSecondary">
                  Duration
                </Typography>
                <Typography>
                  {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={4}>
                <Typography variant="subtitle2" color="textSecondary">
                  Language
                </Typography>
                <Typography>
                  {movie.language}
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={4}>
                <Typography variant="subtitle2" color="textSecondary">
                  Age Rating
                </Typography>
                <Typography>
                  {movie.age_rating || "Not Rated"}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Cast */}
          {movie.cast && movie.cast.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Cast
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {movie.cast.map((actor, index) => (
                  <Chip
                    key={index}
                    label={actor}
                    sx={{ bgcolor: "secondary.main", color: "white" }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Streaming Info */}
          {movie.streaming_info && movie.streaming_info.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Available On
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {movie.streaming_info.map((platform, index) => (
                  <Chip
                    key={index}
                    label={platform}
                    sx={{ bgcolor: "success.main", color: "white" }}
                  />
                ))}
              </Box>
            </Box>
          )}
          {/* Trailer Link */}
{movie.trailer_url && (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h6" gutterBottom>
      Watch Trailer
    </Typography>
    <a
      href={movie.trailer_url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "#90caf9", textDecoration: "underline", fontSize: "1rem" }}
    >
      {movie.trailer_url}
    </a>
  </Box>
)}


          {/* Similar Movies */}
          {similarMovies.length > 0 && (
            <>
              <Divider sx={{ my: 4, bgcolor: "rgba(255,255,255,0.1)" }} />
              <Typography variant="h5" gutterBottom>
                Similar Movies
              </Typography>
              <Grid container spacing={2}>
                {similarMovies.map((similar) => (
                  <Grid item xs={6} sm={4} md={3} key={similar.content_id}>
                    <Card sx={{ bgcolor: "background.paper" }}>
                      <CardMedia
                        component="img"
                        image={similar.poster_url}
                        alt={similar.title}
                        height="200"
                      />
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2" noWrap>
                          {similar.title}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </Grid>
      </Grid>
    </Box>
  </DashboardLayout>
);

}

export default MovieDetails;