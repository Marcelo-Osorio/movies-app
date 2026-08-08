"use strict";
let tmdbLanguage = null;
const api = axios.create({
  baseURL: "/api/tmdb",
  headers: {
    "Content-Type": "application/json;charset=utf-8",
  },
});

function setTmdbLanguage(language) {
  tmdbLanguage = language;
}

function tmdbRequest(endpoint, params = {}) {
  return api.get("", {
    params: {
      endpoint,
      ...(tmdbLanguage ? { language: tmdbLanguage } : {}),
      ...params,
    },
  });
}
function likedMoviesList() {
  const item = JSON.parse(localStorage.getItem("liked_movies"));
  let movies;
  if (item) {
    movies = item;
  } else {
    movies = {};
  }
  return movies;
}
function likeMovie(movie) {
  const likedMovies = likedMoviesList();
  if (likedMovies[movie.id]) {
    likedMovies[movie.id] = undefined;
  } else {
    likedMovies[movie.id] = movie;
  }
  localStorage.setItem("liked_movies", JSON.stringify(likedMovies));
}
function callback(entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const url = entry.target.firstChild.getAttribute("data-img");
      entry.target.firstChild.setAttribute("src", url);
      entry.target.classList.remove("movie-container--prefix-size");
    }
  });
}
const lazyLoader = new IntersectionObserver(callback);

async function getTrendingMoviesPreview() {
  const { data } = await tmdbRequest("trendingMovieDay");
  const movies = data.results;
  trendingMoviesPreviewList.innerHTML = "";

  movies.forEach((movie) =>
    renderMovie(movie, trendingMoviesPreviewList, true),
  );
}
const getCategoriesPreview = async function () {
  const { data } = await tmdbRequest("genreMovieList");
  const categories = data.genres;
  renderCategories(categories, categoriesPreviewList);
};

async function getMoviesByCategory(id) {
  const { data } = await tmdbRequest("discoverMovie", {
    with_genres: id,
  });
  const movies = data.results;
  maxPage = data.total_pages;
  genericSection.innerHTML = "";

  movies.forEach((movie) => renderMovie(movie, genericSection, true));
}

async function getPaginatedMoviesByCategory(id) {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  const scrollIsBottom = scrollTop + clientHeight >= scrollHeight - 15;
  const pageIsNotMax = page < maxPage;
  if (scrollIsBottom && pageIsNotMax) {
    page++;
    const { data } = await tmdbRequest("discoverMovie", {
      with_genres: id,
      page,
    });
    const movies = data.results;
    movies.forEach((movie) => renderMovie(movie, genericSection, true));
  }
}

async function getMoviesBySearch(query) {
  const { data } = await tmdbRequest("searchMovie", {
    query,
  });
  const movies = data.results;
  maxPage = data.total_pages;
  genericSection.innerHTML = "";

  movies.forEach((movie) => renderMovie(movie, genericSection));
}

async function getPaginatedMoviesBySearch(query) {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  const scrollIsBottom = scrollTop + clientHeight >= scrollHeight - 15;
  const pageIsNotMax = page < maxPage;
  if (scrollIsBottom && pageIsNotMax) {
    page++;
    const { data } = await tmdbRequest("searchMovie", {
      query,
      page,
    });
    const movies = data.results;
    movies.forEach((movie) => renderMovie(movie, genericSection));
  }
}

function renderMovie(movie, container, lazyLoad = false) {
  const movieContainer = document.createElement("DIV");
  movieContainer.classList.add("movie-container");

  const movieImg = document.createElement("IMG");
  movieImg.classList.add("movie-img");
  movieImg.setAttribute("alt", movie.title);
  movieImg.setAttribute(
    lazyLoad ? "data-img" : "src",
    `https://image.tmdb.org/t/p/w300${movie.poster_path}`,
  );
  movieImg.addEventListener("click", () => {
    location.hash = "#movie=" + movie.id;
  });
  movieImg.addEventListener("error", () => {
    movieImg.setAttribute("src", "./img/error404.png");
  });

  const movieBtn = document.createElement("A");
  movieBtn.href='#';
  movieBtn.classList.add("movie-btn");
  likedMoviesList()[movie.id] && movieBtn.classList.add("movie-btn--liked");

  movieBtn.addEventListener("click", () => {
    movieBtn.classList.toggle("movie-btn--liked");
    likeMovie(movie);
    getLikedMovies();
  });
  movieContainer.appendChild(movieImg);
  movieContainer.appendChild(movieBtn);
  container.appendChild(movieContainer);
  if (lazyLoad) {
    movieContainer.classList.add("movie-container--prefix-size");
    lazyLoader.observe(movieContainer);
  }
}
function renderCategories(categories, container) {
  container.innerHTML = "";
  const fragmentContainer = document.createDocumentFragment();
  categories.forEach(function (category) {
    const categoryContainer = document.createElement("DIV");
    categoryContainer.classList.add("category-container");

    const categoryTitle = document.createElement("H3");
    categoryTitle.classList.add("category-title");
    categoryTitle.setAttribute("id", "id" + category.id);
    categoryTitle.addEventListener("click", () => {
      location.hash = `#category=${category.id}-${category.name}`;
    });
    const categoryTitleText = document.createTextNode(category.name);

    categoryTitle.appendChild(categoryTitleText);
    categoryContainer.appendChild(categoryTitle);
    fragmentContainer.appendChild(categoryContainer);
  });
  container.appendChild(fragmentContainer);
}
async function getTrendingMovies() {
  const { data } = await tmdbRequest("trendingMovieDay");
  const movies = data.results;
  maxPage = data.total_pages;
  genericSection.innerHTML = "";

  movies.forEach((movie) => renderMovie(movie, genericSection));
}
async function getPaginatedTrendingMovies() {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  const scrollIsBottom = scrollTop + clientHeight >= scrollHeight - 15;
  const pageIsNotMax = page < maxPage;
  if (scrollIsBottom && pageIsNotMax) {
    page++;
    const { data } = await tmdbRequest("trendingMovieDay", {
      page,
    });
    const movies = data.results;
    movies.forEach((movie) => renderMovie(movie, genericSection));
  }
}
async function getMovieById(id) {
  const { data: movie } = await tmdbRequest("movie", { movieId: id });
  const isMobile = matchMedia("(max-width:700px").matches;

  const movieImgUrl = isMobile
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;
  headerSection.style.background = `
    linear-gradient(
        180deg, 
        rgba(0, 0, 0, 0.35) 19.27%,
        rgba(0, 0, 0, 0) 29.17%
    ), url(${movieImgUrl}`;

  movieDetailTitle.textContent = movie.title;
  bannerText.textContent = movie.title;
  movieDetailDescription.textContent = movie.overview;
  movieDetailScore.textContent = movie.vote_average;
  renderCategories(movie.genres, movieDetailCategoriesList);
  getRelatedMoviesId(id);
}
async function getRelatedMoviesId(id) {
  const { data } = await tmdbRequest("movieRecommendations", {
    movieId: id,
  });
  const relatedMovies = data.results;
  relatedMoviesContainer.innerHTML = "";
  relatedMovies.forEach((movie) => renderMovie(movie, relatedMoviesContainer));
}
function getLikedMovies() {
  const likedMovies = likedMoviesList();
  const moviesArray = Object.values(likedMovies);
  likedMoviesListArticle.innerHTML = "";
  moviesArray.forEach((movie) =>
    renderMovie(movie, likedMoviesListArticle, true),
  );
}
