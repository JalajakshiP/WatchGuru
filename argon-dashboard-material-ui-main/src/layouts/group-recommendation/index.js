import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Avatar, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, Divider, Alert, List, 
  ListItem, ListItemAvatar, ListItemText, Slide, Grow,
  Chip, Grid
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import { apiUrl } from "config/config";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MovieCard from "components/ScreenCards/moviecard";

const GroupRecommendation = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [diceRotation, setDiceRotation] = useState(0);
  const [excludedMovies, setExcludedMovies] = useState([]);
  const [noMoreOptions, setNoMoreOptions] = useState(false);

  // Animate dice rolling
  useEffect(() => {
    let interval;
    if (rolling) {
      interval = setInterval(() => {
        setDiceRotation(prev => (prev + 120) % 360);
      }, 300);
    }
    return () => clearInterval(interval);
  }, [rolling]);

  // Fetch user's friends
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await fetch(`${apiUrl}/friends`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch friends');
        const data = await response.json();
        setFriends(data.friends || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingFriends(false);
      }
    };
    fetchFriends();
  }, []);

  const toggleFriend = (friendId) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
    );
    // Reset states when friends change
    setRecommendation(null);
    setExcludedMovies([]);
    setNoMoreOptions(false);
  };

  const getRecommendation = async () => {
    if (selectedFriends.length === 0) {
      setError('Please select at least one friend');
      return;
    }
    
    setRolling(true);
    setError(null);
    setNoMoreOptions(false);
    
    // Simulate dice rolling animation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const response = await fetch(`${apiUrl}/group-recommendations`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          friendIds: selectedFriends,
          exclude: excludedMovies
        })
      });
      
      const data = await response.json();
      
      if (data.type === 'exhausted') {
        setNoMoreOptions(true);
      } else if (data.movies && data.movies.length > 0) {
        setRecommendation(data);
        setExcludedMovies(prev => [...prev, data.movies[0].content_id]);
      }
      
      setOpen(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setRolling(false);
      setDiceRotation(0);
    }
  };

  const handleRollAgain = () => {
    if (noMoreOptions) return;
    getRecommendation();
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Box sx={{ 
        mt: 4, p: 3,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: 'calc(100vh - 64px)', borderRadius: 3
      }}>
        <Typography variant="h4" gutterBottom sx={{ 
          fontWeight: 'bold', color: '#3f51b5',
          textAlign: 'center', mb: 4, textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
        }}>
          🎬 Group Movie Night 🎬
        </Typography>
        
        <Grid container spacing={4}>
          {/* Friends List - Vertical */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2, borderRadius: 3, boxShadow: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#3f51b5', textAlign: 'center' }}>
                Select Your Squad
              </Typography>
              
              {loadingFriends ? (
                <Box display="flex" justifyContent="center"><CircularProgress /></Box>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : friends.length === 0 ? (
                <Alert severity="info">You don't have any friends added yet.</Alert>
              ) : (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {friends.map(friend => (
                    <ListItem 
                      key={friend.user_id}
                      button
                      onClick={() => toggleFriend(friend.user_id)}
                      selected={selectedFriends.includes(friend.user_id)}
                      sx={{
                        mb: 1, borderRadius: 2, transition: 'all 0.3s ease',
                        '&:hover': { transform: 'translateX(5px)', bgcolor: 'action.hover' },
                        '&.Mui-selected': { bgcolor: 'primary.light' }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          src={friend.profile_picture || '/default-avatar.png'} 
                          sx={{ 
                            width: 48, height: 48,
                            border: selectedFriends.includes(friend.user_id) 
                              ? '2px solid #3f51b5' : '2px solid transparent'
                          }}
                        />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={friend.username}
                        primaryTypographyProps={{
                          fontWeight: selectedFriends.includes(friend.user_id) 
                            ? 'bold' : 'normal'
                        }}
                      />
                      {selectedFriends.includes(friend.user_id) && (
                        <Box sx={{ 
                          width: 12, height: 12, 
                          bgcolor: 'primary.main',
                          borderRadius: '50%', ml: 1
                        }} />
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </Card>
          </Grid>
          
          {/* Dice and Action Area */}
          <Grid item xs={12} md={8}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 4
            }}>
              <Typography variant="h6" sx={{ 
                mb: 4, color: '#3f51b5', textAlign: 'center'
              }}>
                Ready to find your perfect movie match?
              </Typography>
              
              <Box sx={{ 
                position: 'relative',
                width: 150,
                height: 150,
                mb: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CasinoIcon 
                  sx={{ 
                    fontSize: 150,
                    color: '#3f51b5',
                    transition: 'transform 0.3s ease',
                    transform: `rotate(${diceRotation}deg)`,
                    opacity: rolling ? 0.8 : 1
                  }} 
                />
              </Box>
              
              <Button
                variant="contained"
                size="large"
                onClick={getRecommendation}
                disabled={selectedFriends.length === 0 || loading}
                startIcon={rolling ? null : <CasinoIcon />}
                sx={{
                  py: 2,
                  px: 4,
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #3f51b5 30%, #5c6bc0 90%)',
                  boxShadow: '0 3px 5px 2px rgba(63, 81, 181, .3)',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 8px 3px rgba(63, 81, 181, .3)'
                  },
                  '&:disabled': {
                    background: '#e0e0e0'
                  }
                }}
              >
                {rolling ? 'Rolling...' : 'Roll the Movie Dice!'}
              </Button>
              
              {error && !loading && (
                <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>
              )}
            </Box>
          </Grid>
        </Grid>
        
        {/* Recommendations Dialog */}
        <Dialog 
          open={open} 
          onClose={handleCloseDialog}
          maxWidth="sm" 
          fullWidth
          TransitionComponent={Slide}
          PaperProps={{ 
            sx: { 
              borderRadius: 3,
              overflow: 'hidden'
            } 
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            textAlign: 'center'
          }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {noMoreOptions ? 'No More Options' : '🎉 Your Movie Pick! 🎉'}
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ p: 0 }}>
            <Grow in={open} timeout={500}>
              <Box sx={{ 
                p: 3,
                textAlign: 'center',
                bgcolor: 'background.paper'
              }}>
                {noMoreOptions ? (
                  <Typography variant="body1" sx={{ my: 3 }}>
                    We've shown all available options for your group.
                  </Typography>
                ) : recommendation?.movies?.[0] ? (
                  <>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      {recommendation.message}
                    </Typography>
                    <Box sx={{ 
                      maxWidth: 345,
                      mx: 'auto',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        transition: 'transform 0.3s ease'
                      }
                    }}>
                      <MovieCard
                        image={recommendation.movies[0].poster_url}
                        title={recommendation.movies[0].title}
                        genres={recommendation.movies[0].genre}
                        contentId={recommendation.movies[0].content_id}
                        rating={!isNaN(parseFloat(recommendation.movies[0].avg_rating))
                          ? parseFloat(recommendation.movies[0].avg_rating).toFixed(1)
                          : 'N/A'}
                        sx={{ 
                          boxShadow: 3,
                          '& .MuiCardMedia-root': {
                            height: 400
                          }
                        }}
                      />
                      {recommendation.type === 'overlap' && (
                        <Box sx={{ mt: 2 }}>
                          <Chip 
                            label={`${recommendation.movies[0].overlap} of ${selectedFriends.length + 1} liked`}
                            color="primary"
                          />
                        </Box>
                      )}
                    </Box>
                  </>
                ) : null}
              </Box>
            </Grow>
          </DialogContent>
          
          <DialogActions sx={{ 
            p: 2,
            bgcolor: 'background.default',
            justifyContent: 'center'
          }}>
            <Button 
              onClick={handleCloseDialog}
              sx={{ mr: 1 }}
            >
              Close
            </Button>
            {!noMoreOptions && (
              <Button 
                variant="contained" 
                onClick={handleRollAgain}
                disabled={loading}
                startIcon={<CasinoIcon />}
              >
                Roll Again
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default GroupRecommendation;