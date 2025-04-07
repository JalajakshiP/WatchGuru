import React from "react";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import { Box } from "@mui/material";

const MovieRow = ({ title, movies }) => {
  return (
    <ArgonBox mb={4}>
      <ArgonTypography variant="h4" mb={2}>
        {title}
      </ArgonTypography>
      <Box
        display="flex"
        overflow="auto"
        sx={{
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
        {movies.map((movie, index) => (
          <ArgonBox
            key={index}
            mr={2}
            sx={{
              flex: "0 0 auto",
              width: "150px",
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            <img
              src={movie.poster_url}
              alt={movie.title}
              style={{ width: "100%", borderRadius: "10px" }}
            />
            <ArgonTypography variant="button" mt={1}>
              {movie.title}
            </ArgonTypography>
          </ArgonBox>
        ))}
      </Box>
    </ArgonBox>
  );
};

export default MovieRow;
