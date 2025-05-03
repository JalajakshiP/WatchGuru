import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, 
  TextField, Button, Avatar, Divider,
  CircularProgress, IconButton, Chip
} from '@mui/material';

import { Link, useParams } from 'react-router-dom';
import { apiUrl } from 'config/config';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

function QuestionDetail() {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/questions/${id}`, {
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch question');
        
        const data = await response.json();
        setQuestion(data.question);
        setAnswers(data.answers);
      } catch (error) {
        console.error('Error fetching question:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestion();
  }, [id]);

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) return;
    
    try {
      const response = await fetch(`${apiUrl}/questions/${id}/answers`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body: answerText })
      });
      
      if (!response.ok) throw new Error('Failed to post answer');
      
      const newAnswer = await response.json();
      setAnswers([newAnswer, ...answers]);
      setAnswerText('');
    } catch (error) {
      console.error('Error posting answer:', error);
    }
  };

  const handleVote = async (answerId, value) => {
    try {
      const response = await fetch(`${apiUrl}/votes`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answerId, value })
      });
      
      if (!response.ok) throw new Error('Failed to vote');
      
      const { votes } = await response.json();
      
      setAnswers(answers.map(answer => 
        answer.answer_id === answerId 
          ? { ...answer, votes } 
          : answer
      ));
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!question) {
    return (
      <Box p={3}>
        <Typography>Question not found</Typography>
      </Box>
    );
  }

  return (   
     <DashboardLayout>
            <DashboardNavbar />
    <Box sx={{ p: 3 }}>
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Avatar src={question.profile_picture} alt={question.username} />
            <Typography variant="subtitle1">{question.username}</Typography>
          </Box>
          
          <Typography variant="h5" gutterBottom>
            {question.title}
          </Typography>
          
          <Typography variant="body1" paragraph>
            {question.body}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            {question.tags?.map((tag, index) => (
              <Chip key={index} label={tag} size="small" />
            ))}
          </Box>
          
          <Typography variant="caption" color="textSecondary">
            Asked on {new Date(question.created_at).toLocaleDateString()}
          </Typography>
        </CardContent>
      </Card>
      
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        {answers.length} Answers
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      {answers.map((answer) => (
        <Box key={answer.answer_id} sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
              <IconButton onClick={() => handleVote(answer.answer_id, 1)}>
                <ThumbUpIcon fontSize="small" />
              </IconButton>
              <Typography variant="subtitle1">{answer.votes || 0}</Typography>
              <IconButton onClick={() => handleVote(answer.answer_id, -1)}>
                <ThumbDownIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Card variant="outlined" sx={{ flexGrow: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                  <Avatar 
                    src={answer.profile_picture} 
                    alt={answer.username}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Typography variant="subtitle2">
                    {answer.is_bot ? 'MovieBot' : answer.username}
                  </Typography>
                </Box>
                
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {answer.body}
                </Typography>
                
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                  Answered on {new Date(answer.created_at).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      ))}
      
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Your Answer
      </Typography>
      
      <TextField
        fullWidth
        multiline
        rows={4}
        variant="outlined"
        placeholder="Write your answer here..."
        value={answerText}
        onChange={(e) => setAnswerText(e.target.value)}
        sx={{ mb: 2 }}
      />
      
      <Button 
        variant="contained" 
        onClick={handleSubmitAnswer}
        disabled={!answerText.trim()}
      >
        Post Answer
      </Button>
    </Box>
    </DashboardLayout>

  );
}

export default QuestionDetail;