import React from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Button,
  InputLabel,
  FormControl,
} from "@mui/material";

// @mui material components
import Grid from "@mui/material/Grid";
import { useEffect, useState } from 'react';
import { apiUrl } from 'config/config';

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import ProfileInfoCard from "examples/Cards/InfoCards/ProfileInfoCard";

// Overview page components
import Header from "layouts/profile/components/Header";

const bgImage =
  "https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-dashboard-pro/assets/img/profile-layout-header.jpg";

function Overview() {

  const [bio, setBio] = useState("");
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await fetch(`${apiUrl}/profileInfo`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const result = await response.json();
        setBio(result.bio); // access .data from your response
        setGenres(result.genres); // access .data from your response
        // console.log(result.genres);
      } catch (error) {
        console.error("Error fetching content:", error);
      }
    };

    fetchInfo();
  }, []);

  return (
    <DashboardLayout
      sx={{
        backgroundImage: ({ functions: { rgba, linearGradient }, palette: { gradients } }) =>
          `${linearGradient(
            rgba(gradients.info.main, 0.6),
            rgba(gradients.info.state, 0.6)
          )}, url(${bgImage})`,
        backgroundPositionY: "50%",
      }}
    >
      <Header />
      <ArgonBox mt={5} mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} xl={4}>
            <ProfileInfoCard
              title="profile information"
              description= {bio}
              favoriteGenres={genres}
              /*info={{
                fullName: "Alec M. Thompson",
                mobile: "(44) 123 1234 123",
                email: "alecthompson@mail.com",
                location: "USA",
              }}
              social={[
                {
                  link: "https://www.facebook.com/CreativeTim/",
                  icon: <FacebookIcon />,
                  color: "facebook",
                },
              ]}*/
              action={{ route: "/update-profile", tooltip: "Edit Profile" }}
            />
          </Grid>
        </Grid>
      </ArgonBox>
      
    </DashboardLayout>
  );
}

export default Overview;
