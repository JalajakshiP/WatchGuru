import React from "react";
import { Card, CardMedia, CardContent, Typography } from "@mui/material";

function MovieCard({ image, title }) {
  return (
    <Card
      sx={{
        width: 180,
        height: 280,
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
      </CardContent>
    </Card>
  );
}

export default MovieCard;
