import Chatbot from './Chatbot';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

const genresList = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  "Science Fiction": 878,
  Thriller: 53,
  War: 10752,
  Western: 37
};

function App() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('');

  useEffect(() => {
    fetchTrending();
  }, []);

  // Trending Movies
  const fetchTrending = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`
      );
      setMovies(res.data.results);
    } catch (error) {
      console.error(error);
      setMovies([]);
    }
    setLoading(false);
  };

  // Search by Actor or Movie Name
  const fetchByQuery = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);

      // Check Actor
      const actorRes = await axios.get(
        `https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${query}`
      );

      if (actorRes.data.results.length > 0) {
        const actorId = actorRes.data.results[0].id;
        const res = await axios.get(
          `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_cast=${actorId}`
        );
        setMovies(res.data.results);
        setLoading(false);
        return;
      }

      // Check Movie Name
      const movieRes = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${query}`
      );

      if (movieRes.data.results.length > 0) {
        setMovies(movieRes.data.results);
        setLoading(false);
        return;
      }

      setMovies([]);
    } catch (error) {
      console.error(error);
      setMovies([]);
    }

    setLoading(false);
  };

  // Search by Genre
  const fetchByGenre = async () => {
    if (!selectedGenre) return;

    try {
      setLoading(true);
      const res = await axios.get(
        `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${selectedGenre}`
      );
      setMovies(res.data.results);
    } catch (error) {
      console.error(error);
      setMovies([]);
    }

    setLoading(false);
  };

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <h1>🎬 Movie Recommender</h1>

      {/* Dark Mode Toggle */}
      <div className="toggle-switch">
        <span className="icon">{darkMode ? '🌙' : '☀️'}</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={darkMode}
            onChange={() => setDarkMode(!darkMode)}
          />
          <span className="slider round"></span>
        </label>
      </div>

      {/* Search Sections */}
      <div className="search-bar">

        {/* Actor / Movie Search */}
        <div className="search-section">
          <input
            type="text"
            placeholder="Search by actor or movie name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={fetchByQuery}>Search</button>
        </div>

        {/* Genre Search */}
        <div className="search-section">
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            <option value="">-- Select Genre --</option>
            {Object.entries(genresList).map(([name, id]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          <button onClick={fetchByGenre}>Search by Genre</button>
        </div>

      </div>

      {/* Movies Section */}
      {loading ? (
        <div className="loader">Loading...</div>
      ) : (
        <div className="movie-grid">
          {movies.length === 0 ? (
            <p>No results found.</p>
          ) : (
            movies.map((movie) => (
              <div key={movie.id} className="movie-card">
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                    alt={movie.title}
                  />
                ) : (
                  <div className="no-poster">No Poster</div>
                )}

                <div className="movie-info">
                  <h3>{movie.title}</h3>
                  <p className="release">
                    📅 Release Year:{' '}
                    {movie.release_date?.slice(0, 4) || 'N/A'}
                  </p>
                  <p className="overview">
                    {movie.overview || "No description available."}
                  </p>
                  <p>
                    ⭐ IMDB Rating:{' '}
                    {movie.vote_average
                      ? movie.vote_average.toFixed(1)
                      : 'N/A'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Chatbot */}
      <Chatbot
        onGenreSelect={(genreId) => {
          setSelectedGenre(genreId);
          setQuery('');
          fetchByGenre();
        }}
      />

      {/* Footer */}
      <footer className="footer">
        <p>
          &copy; {new Date().getFullYear()} Movie Recommender | Crafted with ❤️
          by Harsh Raj and Team
        </p>
      </footer>
    </div>
  );
}

export default App;
