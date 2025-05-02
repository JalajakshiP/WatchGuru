import React, { useState } from "react";
import { apiUrl } from "config/config";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import { DoneAllTwoTone, DoneRounded, PanoramaFishEye, RemoveRedEye } from "@mui/icons-material";

function MovieCard({ image, title, genres, contentId, liked: likedProp, inWatchlist: inWatchlistProp, watched: watchedProp }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(likedProp || false);
  const [inList, setInList] = useState(inWatchlistProp || false);
  const [watched, setWatched] = useState(watchedProp || false);

  const handleClick = () => {
    navigate(`/movie/${contentId}`);
  };
  const handleLike = async (e) => {
    e.stopPropagation();
    const newLiked = !liked;
    setLiked(newLiked);
  
    try {
      const method = "POST" ;
      await fetch(`${apiUrl}/likes`, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ contentId: contentId }),
      });
    } catch (error) {
      console.error("Failed to update like:", error);
    }
  };
  

  const handleAddToList = async (e) => {
    e.stopPropagation();
    const newInList = !inList;
    setInList(newInList);
  
    try {
      const method =  "POST";
      await fetch(`${apiUrl}/watchlist`, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ contentId: contentId }),
      });
    } catch (error) {
      console.error("Failed to update watchlist:", error);
    }
  };

const handlewatch = async (e) => {
  e.stopPropagation();
  const newwatched = !watched;
  setWatched(newwatched);

  try {
    const method = "POST" ;
    await fetch(`${apiUrl}/history`, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ contentId: contentId }),
    });
  } catch (error) {
    console.error("Failed to update watched:", error);
  }
  };
  

  return (
    <Card
      onClick={handleClick}
      sx={{
        width: 180,
        height: 320,
        borderRadius: 2,
        backgroundColor: "#1c1c1c",
        color: "#f5f5f5",
        overflow: "hidden",
        transition: "transform 0.3s",
        cursor: "pointer",
        "&:hover": {
          transform: "scale(1.05)",
        },
      }}
    >
      <CardMedia
        component="img"
        height="220"
        image={image}
        alt={title}
        sx={{ objectFit: "cover" }}
      />
      <CardContent sx={{ p: 1 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography
            variant="body2"
            fontWeight="bold"
            noWrap
            sx={{ color: "#ffffff", flexGrow: 1 }}
          >
            {title}
          </Typography>
          <Box display="flex" gap={0.5}>
            <IconButton
              onClick={handleLike}
              sx={{ color: liked ? "red" : "beige", p: 0.5 }}
            >
              <FavoriteIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={handleAddToList}
              sx={{ color: inList ? "#fffc1c" : "beige", p: 0.5 }}
            >
              <BookmarkIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={handlewatch}
              sx={{ color: watched ? "#a9ff1c" : "beige", p: 0.5 }}
            >
              <DoneAllTwoTone fontSize="small" />
              </IconButton>
          </Box>
        </Box>
        <Box mt={1} display="flex" gap={0.5} flexWrap="wrap">
          {genres.slice(0, 3).map((genre, idx) => (
            <Chip
              key={idx}
              label={genre}
              size="small"
              sx={{
                backgroundColor: "#E2F5F6",
                color: "white",
                fontSize: "0.7rem",
                height: "20px",
              }}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export default MovieCard;