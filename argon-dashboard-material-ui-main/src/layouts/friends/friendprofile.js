import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
    Box,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import ProfileInfoCard from 'examples/Cards/InfoCards/ProfileInfoCard';

import { apiUrl } from 'config/config';

function FriendProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [friendInfo, setFriendInfo] = useState({ username: '', bio: '', genres: [] });
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchFriendInfo = async () => {
      try {
        const res = await fetch(`${apiUrl}/friend/${id}/profile`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch friend info');
        const data = await res.json();
        setFriendInfo(data);
      } catch (err) {
        console.error('Error fetching friend profile:', err);
      }
    };

    const fetchFriendReviews = async () => {
      try {
        const res = await fetch(`${apiUrl}/friend/${id}/reviews`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch friend reviews');
        const data = await res.json();
        setReviews(data);
      } catch (err) {
        console.error('Error fetching friend reviews:', err);
      }
    };

    fetchFriendInfo();
    fetchFriendReviews();
  }, [id]);

  return (
    <DashboardLayout>
      <ArgonBox mt={5} mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <ArgonBox display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <ArgonTypography variant="h4" >
                {friendInfo.username}'s Profile
              </ArgonTypography>
              <Tooltip title="Back to Friends">
                <IconButton onClick={() => navigate(-1)}>
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
            </ArgonBox>
          </Grid>

          <Box display="flex" gap={3} flexDirection={{ xs: "column", md: "row" }}>
            {/* Left Side: Profile Info */}
            <Box flex={1}>
            <ProfileInfoCard
              title="Profile Information"
              description={friendInfo.bio}
              favoriteGenres={friendInfo.genres}
            //   action={{}}
              hideEdit={true}
            />
            </Box>
             <Card sx={{ flex: 2, p: 3, maxHeight: "500px", overflowY: "auto" }}>
              <ArgonTypography variant="h6" mb={2}>
                Reviews
              </ArgonTypography>
              {reviews.length === 0 ? (
                <ArgonTypography variant="body2">
                  This user hasn't written any reviews yet.
                </ArgonTypography>
              ) : (
                <List>
                  {reviews.map((r, i) => (
                    <React.Fragment key={i}>
                      <ListItem alignItems="flex-start">
                        <ListItemButton onClick={() => navigate(`/movie/${r.content_id}`)}>
                          <ListItemText
                             primary={
                                                          <ArgonTypography variant="h6" color="dark" fontWeight="medium">
                                                          {r.contenttitle}  — ⭐ {r.rating}
                                                        </ArgonTypography>
                                                      }
                                                      secondary={
                                                        <ArgonTypography variant="body2" color="text">
                                                          {r.review_text}
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
          </Box>
        </Grid>
      </ArgonBox>
    </DashboardLayout>
  );
}

export default FriendProfile;
