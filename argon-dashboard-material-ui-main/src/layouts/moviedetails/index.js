import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { 
  Button, Grid, Card, CardMedia, CardContent, 
  Typography, Chip, Box, Divider,
  CircularProgress, Rating, TextField, Avatar
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
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviews, setReviews] = useState([]);
  const [ratingAvg, setRatingAvg] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

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


        setUserId(result.userId);
        setMovie(result.content);
        setSimilarMovies(result.similar || []);
        setRatingAvg(result.rating_avg);

        const reviewResponse = await fetch(`${apiUrl}/reviews/${id}`, {
          method: "GET",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log("Response status:", reviewResponse.status);
        const reviewData = await reviewResponse.json();

        setReviews(reviewData);
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

  const submitReview = async () => {
    if (userRating === 0 || reviewText.trim() === "") {
      alert("Please provide a rating and review text.");
      return;
    }

    const reviewData = {
      content_id: id,
      rating: userRating,
      review_text: reviewText,
    };

    try {
      const response = await fetch(`${apiUrl}/reviews`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        const newReview = await response.json();
        setReviews([newReview, ...reviews]);
        setShowReviewForm(false);
        setReviewText("");
        setUserRating(0);
        // Optionally, update the content's rating_avg if needed here
      } else {
        alert("Failed to submit review.");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

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
                  {movie.director}
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

              <Grid item xs={6} sm={4}>
                <Typography variant="h6">Average Rating: {movie.rating_avg.toFixed(1)} / 10</Typography>
                </Grid>
            </Grid>
          </Box>
          
          {/* Reviews */}
          <Button onClick={() => setShowReviewForm((prev) => !prev)}>
            {showReviewForm ? "Cancel" : "Give a rating?"}
          </Button>

          {showReviewForm && (
            <Box mt={2}>
              <Typography variant="subtitle1">Your Rating:</Typography>
              <Rating
                name="user-rating"
                max={10}
                value={userRating}
                onChange={(e, newValue) => setUserRating(newValue)}
              />
              <TextField
                label="Your Review"
                multiline
                rows={3}
                fullWidth
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                sx={{ mt: 2 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={submitReview}
                sx={{ mt: 2 }}
              >
                Submit Review
              </Button>
            </Box>
          )}

          {/* Display Existing Reviews */}
          <Box mt={4}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Reviews
            </Typography>
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <Box
                  key={review.review_id}
                  sx={{
                    mb: 3,
                    borderBottom: "1px solid #ccc",
                    pb: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {/* User Avatar */}
                    <Avatar alt={review.username} sx={{ width: 40, height: 40 }} />
                    
                    {/* Username and Rating */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {review.username}
                      </Typography>
                      <Rating value={review.rating} max={10} readOnly sx={{ fontSize: 20 }} />
                    </Box>

                    {/* Date */}
                    {review.created_at && (
                      <Typography variant="body2" sx={{ fontSize: 12, color: "gray" }}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>

                  {/* Review Text */}
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      lineHeight: 1.6,
                      maxHeight: 100,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {review.review_text}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography>No reviews yet</Typography>
            )}
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
                    <Card 
                    sx={{ bgcolor: "background.paper", cursor: "pointer" }}
                    onClick={() => navigate(`/movie/${similar.content_id}`)}>
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