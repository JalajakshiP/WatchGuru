import React, { useState } from 'react';
import { 
  Box, Typography, TextField, Button, 
  Chip, Autocomplete, CircularProgress,
  Paper, Divider, Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from 'config/config';
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import CancelIcon from '@mui/icons-material/Cancel';
import SendIcon from '@mui/icons-material/Send';

const genreOptions = [
  'Action', 'Comedy', 'Drama', 'Romance', 'Thriller', 
  'Fantasy', 'Sci-Fi', 'Horror', 'Mystery', 'Adventure'
];

function AskQuestion() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/questions`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          title, 
          body, 
          tags: tags.map(tag => typeof tag === 'string' ? tag : tag.title)
        })
      });
      
      if (!response.ok) throw new Error('Failed to post question');
      
      const question = await response.json();
      navigate(`/forum`);
    } catch (error) {
      console.error('Error posting question:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar  showSearch={false}/>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        p: { xs: 2, md: 3 },
        minHeight: 'calc(100vh - 64px)'
      }}>
        <Paper elevation={3} sx={{ 
          width: '100%', 
          maxWidth: 800, 
          p: { xs: 2, md: 4 },
          borderRadius: 2
        }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={3}>
            <QuestionAnswerIcon color="secondary" fontSize="large" />
            <Typography variant="h4" component="h1">
              Ask a Question
            </Typography>
          </Stack>
          
          <Typography variant="subtitle1" color="text.secondary" mb={3}>
            Get recommendations from our community of movie enthusiasts
          </Typography>
          
          <Divider sx={{ mb: 4 }} />
          
          {error && (
            <Paper elevation={0} sx={{ 
              p: 2, 
              mb: 3, 
              backgroundColor: 'error.light',
              color: 'error.contrastText'
            }}>
              <Typography>{error}</Typography>
            </Paper>
          )}
          
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <TextField
              fullWidth
              label="Question Title"
              variant="outlined"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 3 }}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
            
            <TextField
              fullWidth
              multiline
              minRows={6}
              maxRows={12}
              label="Detailed Description"
              variant="outlined"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              sx={{ mb: 3 }}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
            
            <Autocomplete
              multiple
              freeSolo
              options={genreOptions}
              value={tags}
              onChange={(event, newValue) => setTags(newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    color="primary"
                    variant="outlined"
                    label={typeof option === 'string' ? option : option.title}
                    {...getTagProps({ index })}
                    sx={{ 
                      mr: 1,
                      mb: 1,
                      borderRadius: 1
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Tags"
                  helperText="Press enter to add custom tags"
                  sx={{ mb: 3 }}
                  InputProps={{
                    ...params.InputProps,
                    sx: { borderRadius: 1 }
                  }}
                />
              )}
              sx={{ mb: 4 }}
            />
            
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button 
                variant="outlined" 
                onClick={() => navigate(-1)}
                disabled={loading}
                startIcon={<CancelIcon />}
                sx={{
                  px: 3,
                  borderRadius: 1
                }}
              >
                Cancel
              </Button>
              
              <Button 
                variant="contained" 
                onClick={handleSubmit}
                disabled={loading || !title.trim() || !body.trim()}
                endIcon={loading ? <CircularProgress size={24} /> : <SendIcon />}
                sx={{
                  px: 4,
                  borderRadius: 1,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: 'none'
                  }
                }}
              >
                {loading ? 'Posting...' : 'Post Question'}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </DashboardLayout>
  );
}

export default AskQuestion;