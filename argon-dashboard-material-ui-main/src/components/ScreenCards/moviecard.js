import React from "react";
import { Card, CardMedia, CardContent, Typography, Chip, Box } from "@mui/material";

function MovieCard({ image, title, genres }) {
  return (
    <Card
      sx={{
        width: 180,
        height: 320,
        borderRadius: 2,
        backgroundColor: "#1c1c1c",
        color: "white",
        overflow: "hidden",
        transition: "transform 0.3s",
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
        <Typography variant="body2" fontWeight="bold" noWrap>
          {title}
        </Typography>
        <Box mt={1} display="flex" gap={0.5} flexWrap="wrap">
          {genres.slice(0, 3).map((genre, idx) => (
            <Chip
              key={idx}
              label={genre}
              size="small"
              sx={{
                backgroundColor: "#333",
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
