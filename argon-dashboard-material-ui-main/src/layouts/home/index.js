import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Box, Typography } from "@mui/material";

const backgroundImage =
  "https://images.unsplash.com/photo-1581905764498-d52c7f7d4bcf?auto=format&fit=crop&w=1470&q=80"; // You can replace this with your own

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        height: "100vh",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        color: "#fff",
        px: 2,
      }}
    >
      <Typography variant="h3" fontWeight="bold" mb={2}>
        Welcome to WatchGuru
      </Typography>
      <Typography variant="h5" mb={4}>
        The sage of screens
      </Typography>

      <Box display="flex" gap={2} flexDirection={{ xs: "column", sm: "row" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/authentication/sign-up")}
        >
          Create an account
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => navigate("/authentication/sign-in")}
        >
          Already have an account?
        </Button>
      </Box>
    </Box>
  );
}
