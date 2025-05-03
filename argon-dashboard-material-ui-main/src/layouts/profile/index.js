import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import ProfileInfoCard from "examples/Cards/InfoCards/ProfileInfoCard";

// Overview page components
import Header from "layouts/profile/components/Header";
import { apiUrl } from "config/config";
import bgImage from "assets/images/background_images/4.jpg"; // Replace with your image path  

// const bgImage = "https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-dashboard-pro/assets/img/profile-layout-header.jpg";

function Overview() {
  const [bio, setBio] = useState("");
  const [genres, setGenres] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [tabValue, setTabValue] = useState(3); // Profile tab selected by default
  const navigate = useNavigate();
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(`${apiUrl}/profileInfo`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch profile info");
        const data = await res.json();
        setBio(data.bio);
        setGenres(data.genres);
      } catch (error) {
        console.error("Error fetching profile info:", error);
      }
    };

    fetchInfo();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${apiUrl}/reviews`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data = await res.json();
        setReviews(data);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    if (tabValue === 2) fetchReviews();
  }, [tabValue]);

  return (
    <DashboardLayout
      sx={{
        backgroundImage: ({ functions: { rgba, linearGradient }, palette: { gradients } }) =>
          `${linearGradient(
            rgba(gradients.info.main, 0.1),
            rgba(gradients.info.state, 0.1)
          )}, url(${bgImage})`,
        backgroundPositionY: "center"
      }}
    >
      <Header tabValue={tabValue} setTabValue={setTabValue} />
      <ArgonBox mt={5} mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8} xl={12}>
            {tabValue === 3 && (
              <ProfileInfoCard
                title="profile information"
                description={bio}
                favoriteGenres={genres}
                action={{ route: "/update-profile", tooltip: "Edit Profile" }}
              />
            )}

            {tabValue === 2 && (
              <Card sx={{ p: 3, boxShadow: 3, borderRadius: 3 }}>
              <ArgonTypography variant="h5" mb={3} fontWeight="bold">
                💫 Your Reviews 💫
              </ArgonTypography>
                {reviews.length === 0 ? (
                  <ArgonTypography variant="body2">
                    You haven&apos;t written any reviews yet.
                  </ArgonTypography>
                ) : (
                  <List>
                    {reviews.map((r, i) => (
                      <React.Fragment key={i}>
                        <ListItem 
                        alignItems="flex-start"
                        sx={{
                          backgroundColor: "#f9f9f9",
                          borderRadius: 2,
                          mb: 2,
                          boxShadow: 1,
                          transition: "0.3s",
                          "&:hover": {
                            backgroundColor: "#e8f0fe",
                            boxShadow: 3,
                          },
                        }}>
                        <ListItemButton onClick={() => navigate(`/movie/${r.contentId}`)}>
                          <ListItemText
                            primary={
                              <ArgonTypography variant="h6" color="dark" fontWeight="medium">
                              {r.contentTitle}  — ⭐ {r.rating}
                            </ArgonTypography>
                          }
                          secondary={
                            <ArgonTypography variant="body2" color="text">
                              {r.reviewText}
                            </ArgonTypography>
                          }
                          />
                          </ListItemButton>
                        </ListItem>
                        {i !== reviews.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Card>
            )}
          </Grid>
        </Grid>
      </ArgonBox>
    </DashboardLayout>
  );
}

export default Overview;
