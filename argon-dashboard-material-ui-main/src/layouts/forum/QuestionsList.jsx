import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, 
  TextField, Button, Chip, Avatar,
  Divider, CircularProgress, Stack, Paper
} from '@mui/material';
import { Link } from 'react-router-dom';
import { apiUrl } from 'config/config';
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import SearchIcon from '@mui/icons-material/Search';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import AddIcon from '@mui/icons-material/Add';

function QuestionsList() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const url = searchTerm 
          ? `${apiUrl}/questions?search=${encodeURIComponent(searchTerm)}`
          : `${apiUrl}/questions`;
          
        const response = await fetch(url, {
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch questions');
        
        const data = await response.json();
        setQuestions(data);
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, [searchTerm]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
        {/* Header Section */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <QuestionAnswerIcon color="primary" fontSize="large" />
            <Typography variant="h4" component="h1">
              Movie Recommendations Forum
            </Typography>
          </Stack>
          
          <Button 
            variant="contained" 
            component={Link} 
            to="/forum/ask"
            startIcon={<AddIcon />}
            sx={{ 
              minWidth: 160,
              height: 48,
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none'
              }
            }}
          >
            Ask Question
          </Button>
        </Box>

        {/* Search Section */}
        <Paper elevation={0} sx={{ 
          p: 2, 
          mb: 3,
          borderRadius: 2,
          backgroundColor: 'background.paper'
        }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              sx: { borderRadius: 2 }
            }}
          />
        </Paper>
        
        {/* Content Section */}
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : questions.length === 0 ? (
          <Paper elevation={0} sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 2,
            backgroundColor: 'background.paper'
          }}>
            <Typography variant="h6" color="textSecondary">
              {searchTerm ? 'No matching questions found' : 'No questions yet'}
            </Typography>
            {!searchTerm && (
              <Button 
                variant="outlined" 
                component={Link} 
                to="/forum/ask"
                sx={{ mt: 2 }}
                startIcon={<AddIcon />}
              >
                Be the first to ask
              </Button>
            )}
          </Paper>
        ) : (
          <Stack spacing={2}>
            {questions.map((question) => (
              <Card 
                key={question.question_id} 
                elevation={0}
                sx={{ 
                  borderRadius: 2,
                  transition: '0.3s',
                  '&:hover': {
                    boxShadow: 2,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center" mb={1.5}>
                    <Avatar 
                      src={question.profile_picture} 
                      alt={question.username}
                      sx={{ width: 40, height: 40 }}
                    />
                    <Typography variant="subtitle2" color="text.secondary">
                      {question.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                      {new Date(question.created_at).toLocaleDateString()}
                    </Typography>
                  </Stack>
                  
                  <Typography 
                    variant="h6" 
                    component={Link} 
                    to={`/questions/${question.question_id}`}
                    sx={{ 
                      display: 'block',
                      textDecoration: 'none',
                      color: 'text.primary',
                      mb: 1,
                      '&:hover': { color: 'primary.main' }
                    }}
                  >
                    {question.title}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mb: 2 }}
                  >
                    {question.body.length > 200 
                      ? `${question.body.substring(0, 200)}...` 
                      : question.body}
                  </Typography>
                  
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    {question.tags?.map((tag, index) => (
                      <Chip 
                        key={index} 
                        label={tag} 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          borderRadius: 1,
                          backgroundColor: 'action.hover'
                        }}
                      />
                    ))}
                    <Box sx={{ flexGrow: 1 }} />
                    <Chip 
                      label={`${question.answer_count} answers`}
                      size="small"
                      sx={{ 
                        borderRadius: 1,
                        backgroundColor: 'primary.light',
                        color: 'primary.contrastText'
                      }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </DashboardLayout>
  );
}

export default QuestionsList;