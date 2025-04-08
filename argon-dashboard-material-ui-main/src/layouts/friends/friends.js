import React, { useState, useEffect } from 'react';
import {
  Grid, Card, Avatar, Typography, Button, Box, Tabs, Tab,
  TextField, InputAdornment, Divider, List, ListItem, ListItemAvatar,
  ListItemText, CircularProgress, Snackbar, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import { apiUrl } from "config/config";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

const Friends = () => {
  const [activeTab, setActiveTab] = useState('friends');
  const [friendsData, setFriendsData] = useState({
    friends: [],
    requests: [],
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

  const fetchFriendsData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/friends`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch friends data');
      }
      
      const data = await response.json();
      setFriendsData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching friends data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendsData();
  }, []);

  const handleSearch = async (query) => {
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
    } catch (err) {
      setError(err.message);
      console.error('Error searching users:', err);
    } finally {
      setIsSearching(false);
    }
  };
// Updated handleSendRequest function
const handleSendRequest = async (friendId) => {
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
      message: data.message,
      severity: 'success'
    });

    // Update UI immediately
    setFriendsData(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.user_id !== friendId),
      requests: prev.requests.filter(r => r.user_id !== friendId)
    }));
    
    setSearchResults(prev => prev.filter(u => u.user_id !== friendId));
  } catch (error) {
    setSnackbar({
      open: true,
      message: error.message,
      severity: 'error'
    });
  }
};

// Updated handleRespondRequest function
const handleRespondRequest = async (friendId, accept) => {
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
      message: data.message,
      severity: 'success'
    });

    // Update UI immediately
    setFriendsData(prev => {
      const updatedRequests = prev.requests.filter(r => r.user_id !== friendId);
      const newFriend = accept 
        ? prev.requests.find(r => r.user_id === friendId)
        : null;
      
      return {
        ...prev,
        requests: updatedRequests,
        friends: accept ? [...prev.friends, newFriend] : prev.friends
      };
    });
  } catch (error) {
    setSnackbar({
      open: true,
      message: error.message,
      severity: 'error'
    });
  }
};


  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <DashboardLayout>
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
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {/* Show search results if query exists */}
        {!isLoading && !isSearching && searchQuery && (
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>Search Results</Typography>
            {searchResults.length === 0 ? (
              <Typography>No users found</Typography>
            ) : (
              <Grid container spacing={2}>
                {searchResults.map(user => (
                  <Grid item xs={12} sm={6} md={4} key={user.user_id}>
                    <Card sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                      <Avatar src={user.profile_picture || '/default-avatar.png'} />
                      <Box ml={2} flexGrow={1}>
                        <Typography variant="subtitle1">{user.username}</Typography>
                      </Box>
                      <Button 
                        size="small" 
                        variant="contained" 
                        startIcon={<PersonAddIcon />}
                        onClick={() => handleSendRequest(user.user_id)}
                        disabled={friendsData.friends.some(f => f.user_id === user.user_id)}
                      >
                        {friendsData.friends.some(f => f.user_id === user.user_id) ? 'Friends' : 'Add'}
                      </Button>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Main Content when not searching */}
        {!isLoading && !error && !searchQuery && (
          <>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ mb: 3 }}
            >
              <Tab value="friends" label={`Friends (${friendsData.friends.length})`} />
              <Tab value="requests" label={`Requests (${friendsData.requests.length})`} />
              <Tab value="suggestions" label={`Suggestions (${friendsData.suggestions.length})`} />
            </Tabs>

            {/* Friends List */}
            {activeTab === 'friends' && (
              <Box>
                {friendsData.friends.length === 0 ? (
                  <Typography>You haven't added any friends yet</Typography>
                ) : (
                  <List>
                    {friendsData.friends.map(friend => (
                      <ListItem key={friend.user_id}>
                        <ListItemAvatar>
                          <Avatar src={friend.profile_picture || '/default-avatar.png'} />
                        </ListItemAvatar>
                        <ListItemText 
                          primary={friend.username}
                          secondary={`Friends since ${new Date(friend.created_at).toLocaleDateString()}`}
                        />
                        <Button 
                          size="small" 
                          variant="outlined"
                          disabled
                        >
                          Friends
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}

            {/* Friend Requests */}
            {activeTab === 'requests' && (
              <Box>
                {friendsData.requests.length === 0 ? (
                  <Typography>No pending friend requests</Typography>
                ) : (
                  <List>
                    {friendsData.requests.map(request => (
                      <ListItem key={request.user_id}>
                        <ListItemAvatar>
                          <Avatar src={request.profile_picture || '/default-avatar.png'} />
                        </ListItemAvatar>
                        <ListItemText 
                          primary={request.username}
                          secondary={`Sent ${new Date(request.created_at).toLocaleDateString()}`}
                        />
                        <Box>
                          <Button 
                            size="small" 
                            variant="contained" 
                            color="success"
                            startIcon={<CheckIcon />}
                            sx={{ mr: 1 }}
                            onClick={() => handleRespondRequest(request.user_id, true)}
                          >
                            Accept
                          </Button>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color="error"
                            startIcon={<ClearIcon />}
                            onClick={() => handleRespondRequest(request.user_id, false)}
                          >
                            Decline
                          </Button>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}

            {/* Suggestions */}
            {activeTab === 'suggestions' && (
              <Box>
                {friendsData.suggestions.length === 0 ? (
                  <Typography>No suggestions available</Typography>
                ) : (
                  <Grid container spacing={2}>
                    {friendsData.suggestions.map(user => (
                      <Grid item xs={12} sm={6} md={4} key={user.user_id}>
                        <Card sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                          <Avatar src={user.profile_picture || '/default-avatar.png'} />
                          <Box ml={2} flexGrow={1}>
                            <Typography variant="subtitle1">{user.username}</Typography>
                          </Box>
                          <Button 
                            size="small" 
                            variant="contained" 
                            startIcon={<PersonAddIcon />}
                            onClick={() => handleSendRequest(user.user_id)}
                            disabled={friendsData.friends.some(f => f.user_id === user.user_id)}
                          >
                            {friendsData.friends.some(f => f.user_id === user.user_id) ? 'Friends' : 'Add'}
                          </Button>
                        </Card>
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