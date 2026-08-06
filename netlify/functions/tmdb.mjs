const API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3/";

const ENDPOINT_MAP = {
  trendingMovieDay: {
    path: "trending/movie/day",
    isDynamic: false,
  },
  genreMovieList: {
    path: "genre/movie/list",
    isDynamic: false,
  },
  discoverMovie: {
    path: "discover/movie",
    isDynamic: false,
  },
  searchMovie: {
    path: "search/movie",
    isDynamic: false,
  },
  movie: {
    path: ({ movieId }) => `movie/${encodeURIComponent(movieId)}`,
    isDynamic: true,
  },
  movieRecommendations: {
    path: ({ movieId }) =>
      `movie/${encodeURIComponent(movieId)}/recommendations`,
    isDynamic: true,
  },
};

function jsonResponse(body, status, additionalHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...additionalHeaders,
    },
  });
}

export default async function handler(request) {
  if (request.method !== "GET") {
    return jsonResponse(
      { error: "Only GET requests are allowed." },
      405,
      { Allow: "GET" },
    );
  }

  if (!API_KEY) {
    return jsonResponse({ error: "TMDB_API_KEY is not configured." }, 500);
  }

  const requestUrl = new URL(request.url);
  const endpointValues = requestUrl.searchParams.getAll("endpoint");
  const endpointKey = endpointValues[0];
  const hasValidEndpoint =
    endpointValues.length === 1 &&
    Object.prototype.hasOwnProperty.call(ENDPOINT_MAP, endpointKey);

  if (!hasValidEndpoint) {
    return jsonResponse({ error: "Invalid or unauthorized endpoint." }, 400);
  }

  const endpoint = ENDPOINT_MAP[endpointKey];
  const tmdbParams = new URLSearchParams(requestUrl.searchParams);
  tmdbParams.delete("endpoint");

  let movieId;
  if (endpoint.isDynamic) {
    const movieIdValues = tmdbParams.getAll("movieId");
    movieId = movieIdValues[0];

    if (movieIdValues.length !== 1 || !/^\d+$/.test(movieId ?? "")) {
      return jsonResponse({ error: "Invalid or unauthorized endpoint." }, 400);
    }

    tmdbParams.delete("movieId");
  }

  const path = endpoint.isDynamic ? endpoint.path({ movieId }) : endpoint.path;
  const tmdbUrl = new URL(path, TMDB_BASE_URL);

  for (const [key, value] of tmdbParams) {
    tmdbUrl.searchParams.append(key, value);
  }

  tmdbUrl.searchParams.set("api_key", API_KEY);

  try {
    const tmdbResponse = await fetch(tmdbUrl, { method: "GET" });
    const responseBody = await tmdbResponse.text();

    return new Response(responseBody, {
      status: tmdbResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return jsonResponse({ error: "Failed to fetch from TMDB." }, 502);
  }
}

export const config = {
  path: "/api/tmdb",
};
