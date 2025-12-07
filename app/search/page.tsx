"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useAuth } from "../AuthProvider";

interface SearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

interface SearchResponse {
  Search?: SearchResult[];
  totalResults?: string;
  Response: string;
  Error?: string;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchedQuery, setLastSearchedQuery] = useState<string>("");
  const [lastSearchedPage, setLastSearchedPage] = useState<number>(0);

  // Check if there's a search query in the URL
  useEffect(() => {
    const query = searchParams.get("q");
    const page = searchParams.get("page");
    const pageNum = page ? parseInt(page) : 1;
    
    // Only search if query exists and is different from last search
    if (query && (query !== lastSearchedQuery || pageNum !== lastSearchedPage)) {
      setSearchQuery(query);
      setCurrentPage(pageNum);
      setLastSearchedQuery(query);
      setLastSearchedPage(pageNum);
      // Use a separate function to avoid dependency issues
      const doSearch = async () => {
        if (!query.trim()) return;
        
        setLoading(true);
        setError("");
        setHasSearched(true);

        try {
          // OMDB returns 10 results per page, we want 12 per page
          // Calculate which OMDB pages we need to fetch
          // For UI page 1: need OMDB pages 1-2 (to get 12 results)
          // For UI page 2: need OMDB pages 2-3 (results 13-24)
          const resultsPerPage = 12;
          const omdbResultsPerPage = 10;
          
          // Calculate which OMDB pages to fetch
          const startResult = (pageNum - 1) * resultsPerPage + 1;
          const endResult = pageNum * resultsPerPage;
          const startOmdbPage = Math.floor((startResult - 1) / omdbResultsPerPage) + 1;
          const endOmdbPage = Math.ceil(endResult / omdbResultsPerPage);
          
          // Fetch all necessary OMDB pages
          const fetchPromises = [];
          for (let omdbPage = startOmdbPage; omdbPage <= endOmdbPage; omdbPage++) {
            fetchPromises.push(
              axios.get<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}&page=${omdbPage}`)
            );
          }
          
          const responses = await Promise.all(fetchPromises);
          
          // Check if any response failed
          const failedResponse = responses.find(r => r.data.Response === "False");
          if (failedResponse) {
            setResults([]);
            setTotalResults(0);
            setError(failedResponse.data.Error || "No results found");
            setLoading(false);
            return;
          }
          
          // Combine all results and filter duplicates
          let allResults: SearchResult[] = [];
          responses.forEach(response => {
            if (response.data.Response === "True" && response.data.Search) {
              allResults = allResults.concat(response.data.Search);
            }
          });
          
          // Filter out duplicates by imdbID
          const uniqueResults = allResults.filter((movie, index, self) =>
            index === self.findIndex((m) => m.imdbID === movie.imdbID)
          );
          
          // Get total results from first response
          const totalFromApi = parseInt(responses[0].data.totalResults || "0");
          setTotalResults(totalFromApi);
          
          // Slice to get the 12 results for current page
          const startIndex = (pageNum - 1) * resultsPerPage;
          const endIndex = startIndex + resultsPerPage;
          const pageResults = uniqueResults.slice(startIndex, endIndex);
          
          setResults(pageResults);
        } catch (err: any) {
          console.error("Search error:", err);
          const errorMessage = err.response?.data?.error || err.message || "Failed to search movies";
          
          if (err.response?.status === 401) {
            setError("OMDB API key is required. Please add OMDB_API_KEY to your .env.local file. Get a free key from http://www.omdbapi.com/apikey.aspx");
          } else {
            setError(errorMessage);
          }
          setResults([]);
          setTotalResults(0);
        } finally {
          setLoading(false);
        }
      };
      
      doSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError("Please enter a search term");
      return;
    }
    setCurrentPage(1);
    setLastSearchedQuery("");
    setLastSearchedPage(0);
    // Update URL first, which will trigger the useEffect
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setLastSearchedQuery("");
    setLastSearchedPage(0);
    // Update URL first, which will trigger the useEffect
    const newUrl = newPage > 1 
      ? `/search?q=${encodeURIComponent(searchQuery)}&page=${newPage}`
      : `/search?q=${encodeURIComponent(searchQuery)}`;
    router.push(newUrl);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.ceil(totalResults / 12);

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white border-b-2 border-gray-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 w-full sm:w-auto">
              <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
                ShareOverflow
              </Link>
              <div className="flex flex-wrap gap-4 sm:gap-6">
                <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors text-sm sm:text-base">
                  Home
                </Link>
                <Link href="/search" className="text-gray-700 hover:text-blue-600 transition-colors text-sm sm:text-base font-medium">
                  Search
                </Link>
                {user && (
                  <Link href="/profile" className="text-gray-700 hover:text-blue-600 transition-colors text-sm sm:text-base">
                    Profile
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-end">
              {user ? (
                <span className="text-sm text-gray-600 text-left sm:text-right">
                  Welcome, {user.email}
                </span>
              ) : (
                <Link 
                  href="/login" 
                  className="px-3 sm:px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors text-sm sm:text-base whitespace-nowrap"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Search Form */}
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 text-left">
            Search Movies
          </h1>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <label htmlFor="search-input" className="sr-only">
              Search for movies
            </label>
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter movie title, genre, or keywords..."
              className="flex-1 border-2 border-gray-400 rounded-md px-4 py-2.5 text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition-all min-w-0"
              aria-label="Search for movies"
              aria-required="true"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-base whitespace-nowrap shadow-sm"
              aria-label="Submit search"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6 sm:mb-8 shadow-sm" role="alert" aria-live="polite">
            <p className="text-red-800 font-medium text-left text-sm sm:text-base">
              {error}
            </p>
          </div>
        )}

        {/* Results Count */}
        {hasSearched && !loading && (
          <div className="mb-4 sm:mb-6">
            <p className="text-gray-700 text-left text-sm sm:text-base">
              {totalResults > 0 
                ? `Found ${formatNumber(totalResults)} result${totalResults !== 1 ? 's' : ''}`
                : "No results found"}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12 sm:py-16">
            <p className="text-gray-600 text-lg sm:text-xl">Searching...</p>
          </div>
        )}

        {/* Results Grid */}
        {!loading && results.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {results.map((movie, index) => (
                <div
                  key={`${movie.imdbID}-${index}`}
                  className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                >
                  {movie.Poster && movie.Poster !== "N/A" ? (
                    <div className="h-48 sm:h-64 bg-gray-200 overflow-hidden">
                      <img
                        src={movie.Poster}
                        alt={`${movie.Title} poster`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="h-48 sm:h-64 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No Poster Available</span>
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2 text-left min-h-[3rem]">
                      {movie.Title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 text-left">
                      Year: <span className="text-right inline-block ml-2">{movie.Year}</span>
                    </p>
                    <div className="mt-auto">
                      <Link
                        href={`/details/${movie.imdbID}`}
                        className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base shadow-sm"
                        aria-label={`View details for ${movie.Title}`}
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mt-6 sm:mt-8 pt-6 border-t-2 border-gray-300">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 sm:px-6 py-2 bg-white border-2 border-gray-400 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm sm:text-base text-center min-w-[100px] shadow-sm"
                  aria-label="Go to previous page"
                >
                  Previous
                </button>
                <span className="px-4 sm:px-6 py-2 text-gray-700 text-sm sm:text-base text-center">
                  Page <span className="font-semibold">{formatNumber(currentPage)}</span> of <span className="font-semibold">{formatNumber(totalPages)}</span>
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 sm:px-6 py-2 bg-white border-2 border-gray-400 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm sm:text-base text-center min-w-[100px] shadow-sm"
                  aria-label="Go to next page"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* No Results Message */}
        {hasSearched && !loading && results.length === 0 && (
          <div className="bg-white border-2 border-gray-300 rounded-lg p-8 sm:p-12 text-center shadow-sm">
            <p className="text-gray-600 text-base sm:text-lg text-left sm:text-center">
              No movies found. Try a different search term.
            </p>
          </div>
        )}

        {/* Initial State - No Search Yet */}
        {!hasSearched && !loading && (
          <div className="bg-white border-2 border-gray-300 rounded-lg p-8 sm:p-12 text-center shadow-sm">
            <p className="text-gray-600 text-base sm:text-lg">
              Enter a search term above to find movies.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
