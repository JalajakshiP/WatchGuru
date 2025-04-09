import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Box, Typography } from "@mui/material";
import { useEffect } from "react";
import { apiUrl } from "config/config";
import bgImage from "assets/images/background_images/4.jpg"; 


export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await fetch(`${apiUrl}/isLoggedIn`, {
          method: "GET",
          credentials: "include", // Important to send session cookie
        });

        if (res.status === 200) {
          // User is already logged in
          navigate("/dashboard"); // Redirect to wherever logged-in users go
        }
      } catch (err) {
        console.error("Error checking login status:", err);
        // Do nothing, stay on home page
      }
    };

    checkLogin();
  }, [navigate]);

  return (
    <Box
      sx={{
        height: "100vh",
        backgroundImage: `url(${bgImage})`,
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
          sx={{ color: "#000000", borderColor: "#6c5ce7" }} 
        >
          Already have an account?
        </Button>
      </Box>
    </Box>
  );
}
