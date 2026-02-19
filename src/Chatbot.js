import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Chatbot.css';

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [movies, setMovies] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const apiKey = process.env.REACT_APP_GROQ_API_KEY;
    if (!apiKey) {
      setError('Groq API key is missing. Please check your .env file.');
      console.error('Groq API key is missing');
    }
    fetchTrendingMovies();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTrendingMovies = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_TMDB_API_ENDPOINT}/trending/movie/week`,
        {
          params: {
            api_key: process.env.REACT_APP_TMDB_API_KEY
          }
        }
      );
      setMovies(response.data.results);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
    }
  };

  const fetchMovieDetails = async (movieId) => {
    setIsLoadingDetails(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_TMDB_API_ENDPOINT}/movie/${movieId}`,
        {
          params: {
            api_key: process.env.REACT_APP_TMDB_API_KEY,
            append_to_response: 'credits,videos'
          }
        }
      );
      setMovieDetails(response.data);
    } catch (error) {
      console.error('Error fetching movie details:', error);
      setError('Failed to load movie details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
    fetchMovieDetails(movie.id);
  };

  const closeMovieDetails = () => {
    setSelectedMovie(null);
    setMovieDetails(null);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    setIsTyping(true);

    try {
      const apiKey = process.env.REACT_APP_GROQ_API_KEY;
      const apiEndpoint = process.env.REACT_APP_GROQ_API_ENDPOINT;

      if (!apiKey || !apiEndpoint) {
        throw new Error('Groq API configuration is missing');
      }

      const response = await axios.post(
        apiEndpoint,
        {
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: "You are a helpful AI assistant. Provide clear, simple and readable responses without markdown formatting."
            },
            {
              role: "user",
              content: input
            }
          ],
          temperature: 0.7
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          }
        }
      );

      const botResponse = response.data.choices[0].message.content;

      setIsTyping(false);

      setTimeout(() => {
        const botMessage = { text: botResponse, sender: 'bot' };
        setMessages(prev => [...prev, botMessage]);
      }, 500);

    } catch (error) {
      console.error('Groq Error:', error.response?.data || error.message);

      const errorMessage = {
        text: `Error: ${error.response?.data?.error?.message || error.message}`,
        sender: 'bot'
      };

      setMessages(prev => [...prev, errorMessage]);
      setError(error.message);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      setMessages([{
        text: "👋 Hello! I'm your AI assistant.\n\n• Ask me anything\n• Get explanations\n• Learn new topics\n\nHow can I help you?",
        sender: 'bot'
      }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="movies-container">
        <h1>Trending Movies</h1>
        <div className="movies-grid">
          {movies.map(movie => (
            <div
              key={movie.id}
              className="movie-card"
              onClick={() => handleMovieClick(movie)}
            >
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="movie-poster"
              />
              <div className="movie-info">
                <h3>{movie.title}</h3>
                <p>⭐ {movie.vote_average?.toFixed(1) || 'N/A'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedMovie && (
        <div className="movie-modal-overlay" onClick={closeMovieDetails}>
          <div className="movie-modal" onClick={e => e.stopPropagation()}>
            {isLoadingDetails ? (
              <div className="loading-skeleton modal-skeleton"></div>
            ) : movieDetails ? (
              <>
                <button className="close-modal" onClick={closeMovieDetails}>×</button>
                <div className="modal-content">
                  <div className="modal-header">
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`}
                      alt={movieDetails.title}
                      className="modal-poster"
                    />
                    <div className="modal-info">
                      <h2>{movieDetails.title}</h2>
                      <p>📅 {new Date(movieDetails.release_date).getFullYear()}</p>
                      <p>⭐ {movieDetails.vote_average?.toFixed(1)}</p>
                      <p>⏱️ {movieDetails.runtime} minutes</p>
                    </div>
                  </div>
                  <div className="modal-body">
                    <h3>Overview</h3>
                    <p>{movieDetails.overview}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="error-message">Failed to load movie details</div>
            )}
          </div>
        </div>
      )}

      <button
        className="chat-toggle-button"
        onClick={toggleChat}
      >
        {isOpen ? '×' : '💬'}
      </button>

      <div className={`chatbot-container ${isOpen ? 'open' : ''}`} ref={chatContainerRef}>
        <div className="chat-header">
          <div className="bot-avatar">🤖</div>
          <div className="bot-info">
            <h2>AI Assistant</h2>
            <p>Always here to help!</p>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.sender}`}>
              {message.text.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          ))}

          {isTyping && (
            <div className="message bot thinking">
              <span>Typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading || !input.trim()}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </>
  );
}

export default Chatbot;
