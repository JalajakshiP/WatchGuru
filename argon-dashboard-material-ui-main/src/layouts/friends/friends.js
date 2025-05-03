import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Card, Avatar, Typography, Button, Box, Tabs, Tab,
  TextField, InputAdornment, Divider, List, ListItem, ListItemAvatar,
  ListItemText, CircularProgress, Snackbar, Alert, Chip, Accordion,
  AccordionSummary, AccordionDetails
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { apiUrl } from "config/config";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

const Friends = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('friends');
  const [friendsData, setFriendsData] = useState({
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
    suggestions: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchFriendsData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/friends`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch friends data');
      }
      
      const data = await response.json();
      setFriendsData({
        friends: data.friends || [],
        incomingRequests: data.incomingRequests || [],
        outgoingRequests: data.outgoingRequests || [],
        suggestions: data.suggestions || []
      });
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching friends data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriendsData();
  }, [fetchFriendsData]);

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await fetch(
        `${apiUrl}/search-users?q=${encodeURIComponent(query)}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setSearchResults(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error searching users:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSendRequest = useCallback(async (friendId) => {
    try {
      const response = await fetch(`${apiUrl}/send-friend-request`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send request');
      }

      setSnackbar({
        open: true,
        message: data.message || 'Friend request sent successfully',
        severity: 'success'
      });

      // Update UI
      setFriendsData(prev => ({
        ...prev,
        suggestions: prev.suggestions.filter(s => s.user_id !== friendId),
        outgoingRequests: [...prev.outgoingRequests, { 
          user_id: friendId, 
          username: searchResults.find(u => u.user_id === friendId)?.username || '',
          profile_picture: searchResults.find(u => u.user_id === friendId)?.profile_picture || '',
          created_at: new Date().toISOString()
        }]
      }));
      
      setSearchResults(prev => prev.filter(u => u.user_id !== friendId));
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    }
  }, [searchResults]);

  const handleRespondRequest = useCallback(async (friendId, accept) => {
    try {
      const response = await fetch(`${apiUrl}/respond-friend-request`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendId, accept })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to respond to request');
      }

      setSnackbar({
        open: true,
        message: data.message || `Request ${accept ? 'accepted' : 'declined'} successfully`,
        severity: 'success'
      });

      // Update UI
      setFriendsData(prev => {
        const request = prev.incomingRequests.find(r => r.user_id === friendId);
        return {
          ...prev,
          incomingRequests: prev.incomingRequests.filter(r => r.user_id !== friendId),
          friends: accept ? [...prev.friends, request] : prev.friends,
          // Remove from suggestions if they were there
          suggestions: prev.suggestions.filter(s => s.user_id !== friendId)
        };
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    }
  }, []);

  const handleCancelRequest = useCallback(async (friendId) => {
    try {
      const response = await fetch(`${apiUrl}/cancel-friend-request`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel request');
      }

      setSnackbar({
        open: true,
        message: data.message || 'Friend request cancelled successfully',
        severity: 'success'
      });

      // Update UI
      setFriendsData(prev => ({
        ...prev,
        outgoingRequests: prev.outgoingRequests.filter(r => r.user_id !== friendId),
        // Add back to suggestions if appropriate
        suggestions: [...prev.suggestions, {
          user_id: friendId,
          username: prev.outgoingRequests.find(r => r.user_id === friendId)?.username,
          profile_picture: prev.outgoingRequests.find(r => r.user_id === friendId)?.profile_picture
        }].filter((v, i, a) => a.findIndex(t => t.user_id === v.user_id) === i)
      }));
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    }
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const isFriend = useCallback((userId) => {
    return friendsData.friends.some(f => f.user_id === userId);
  }, [friendsData.friends]);

  const hasPendingRequest = useCallback((userId) => {
    return friendsData.outgoingRequests.some(r => r.user_id === userId) || 
           friendsData.incomingRequests.some(r => r.user_id === userId);
  }, [friendsData.outgoingRequests, friendsData.incomingRequests]);

  const renderUserCard = (user, showActions = true) => (
    <Card sx={{ p: 2, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
    onClick={() => navigate(`/friend/${user.user_id}`)}>
      
      <Avatar 
        src={user.profile_picture || '/default-avatar.png'} 
        sx={{ width: 56, height: 56 }}
      />
      <Box ml={2} flexGrow={1}>
        <Typography variant="subtitle1" fontWeight="medium">
          {user.username}
        </Typography>
        {user.mutual_friends > 0 && (
          <Typography variant="caption" color="text.secondary">
            {user.mutual_friends} mutual friends
          </Typography>
        )}
      </Box>
      {showActions && (
        isFriend(user.user_id) ? (
          <Chip label="Friends" color="success" size="small" />
        ) : hasPendingRequest(user.user_id) ? (
          <Chip 
            label={
              friendsData.outgoingRequests.some(r => r.user_id === user.user_id) 
                ? "Request Sent" 
                : "Respond to Request"
            } 
            size="small" 
          />
        ) : (
          <Button 
            size="small" 
            variant="contained" 
            startIcon={<PersonAddIcon />}
            onClick={(e) =>{e.stopPropagation(); handleSendRequest(user.user_id)}}
          >
            Add Friend
          </Button>
        )
      )}
    </Card>
  );

  return (
    <DashboardLayout>
      <DashboardNavbar  showSearch={false} />
      <Card sx={{ p: 3 }}>
        {/* Search Bar */}
        <Box mb={3}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search for users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            disabled={isLoading}
          />
        </Box>

        {/* Loading State */}
        {(isLoading || isSearching) && (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Box p={2}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Search Results */}
        {!isLoading && !isSearching && searchQuery && (
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>Search Results</Typography>
            {searchResults.length === 0 ? (
              <Typography color="text.secondary">No users found</Typography>
            ) : (
              <Grid container spacing={2}>
                {searchResults.map(user => (
                  <Grid item xs={12} sm={6} md={4} key={user.user_id}>
                    {renderUserCard(user)}
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Main Content */}
        {!isLoading && !error && !searchQuery && (
          <>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ mb: 3 }}
              variant="fullWidth"
            >
              <Tab value="friends" label={`Friends (${friendsData.friends.length})`} />
              <Tab 
                value="requests" 
                label={`Requests (${
                  friendsData.incomingRequests.length + friendsData.outgoingRequests.length
                })`} 
              />
              <Tab value="suggestions" label={`Suggestions (${friendsData.suggestions.length})`} />
            </Tabs>

            <Divider sx={{ mb: 3 }} />

            {/* Friends List */}
            {activeTab === 'friends' && (
              <Box>
                {friendsData.friends.length === 0 ? (
                  <Typography color="text.secondary">
                    You haven't added any friends yet
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {friendsData.friends.map(friend => (
                      <Grid item xs={12} sm={6} md={4} key={friend.user_id}>
                        {renderUserCard(friend, false)}
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}

            {/* Friend Requests */}
            {activeTab === 'requests' && (
              <Box>
                {friendsData.incomingRequests.length === 0 && friendsData.outgoingRequests.length === 0 ? (
                  <Typography color="text.secondary">
                    No pending friend requests
                  </Typography>
                ) : (
                  <>
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Incoming Requests ({friendsData.incomingRequests.length})</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {friendsData.incomingRequests.length === 0 ? (
                          <Typography color="text.secondary">No incoming requests</Typography>
                        ) : (
                          <List disablePadding>
                            {friendsData.incomingRequests.map(request => (
                              <ListItem key={request.user_id} sx={{ py: 2 }}>
                                <ListItemAvatar>
                                  <Avatar 
                                    src={request.profile_picture || '/default-avatar.png'} 
                                    sx={{ width: 56, height: 56 }}
                                  />
                                </ListItemAvatar>
                                <ListItemText 
                                  primary={
                                    <Typography variant="subtitle1" fontWeight="medium">
                                      {request.username}
                                    </Typography>
                                  }
                                  secondary={`Sent ${new Date(request.created_at).toLocaleDateString()}`}
                                />
                                <Box display="flex" gap={1}>
                                  <Button 
                                    size="small" 
                                    variant="contained" 
                                    color="success"
                                    startIcon={<CheckIcon />}
                                    onClick={() => handleRespondRequest(request.user_id, true)}
                                  >
                                    Accept
                                  </Button>
                                  <Button 
                                    size="small" 
                                    variant="outlined" 
                                    color="error"
                                    startIcon={<HighlightOffIcon />}
                                    onClick={() => handleRespondRequest(request.user_id, false)}
                                    sx={{ color: "#000000", borderColor: "#d63031" }}
                                  >
                                    Decline
                                  </Button>
                                </Box>
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Outgoing Requests ({friendsData.outgoingRequests.length})</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {friendsData.outgoingRequests.length === 0 ? (
                          <Typography color="text.secondary">No outgoing requests</Typography>
                        ) : (
                          <List disablePadding>
                            {friendsData.outgoingRequests.map(request => (
                              <ListItem key={request.user_id} sx={{ py: 2 }}>
                                <ListItemAvatar>
                                  <Avatar 
                                    src={request.profile_picture || '/default-avatar.png'} 
                                    sx={{ width: 56, height: 56 }}
                                  />
                                </ListItemAvatar>
                                <ListItemText 
                                  primary={
                                    <Typography variant="subtitle1" fontWeight="medium">
                                      {request.username}
                                    </Typography>
                                  }
                                  secondary={`Sent ${new Date(request.created_at).toLocaleDateString()}`}
                                />
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  color="primary"
                                  onClick={() => handleCancelRequest(request.user_id)}
                                  sx={{ color: "#000000", borderColor: "#6c5ce7" }}
                                >
                                  Cancel Request
                                </Button>
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  </>
                )}
              </Box>
            )}

            {/* Suggestions */}
            {activeTab === 'suggestions' && (
              <Box>
                {friendsData.suggestions.length === 0 ? (
                  <Typography color="text.secondary">
                    No suggestions available
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {friendsData.suggestions.map(user => (
                      <Grid item xs={12} sm={6} md={4} key={user.user_id}>
                        {renderUserCard(user)}
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}
          </>
        )}
      </Card>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
};

export default Friends;