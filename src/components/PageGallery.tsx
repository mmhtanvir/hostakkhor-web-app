import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { fetchPages, TransformedPage } from "@/actions/actions";
import { toast } from "@/hooks/use-toast";
import AlphabeticNav from "./AlphabeticNav";

interface PageGalleryProps {
  authorId?: string;
  limit?: number;
  showAlphabeticNav?: boolean;
}

const PageGallery = ({ authorId, limit = 6, showAlphabeticNav = true }: PageGalleryProps) => {
  const [pages, setPages] = useState<TransformedPage[]>([]);
  const [filteredPages, setFilteredPages] = useState<TransformedPage[]>([]);
  const [activeLetter, setActiveLetter] = useState("All");
  const [letters, setLetters] = useState<string[]>(["All"]);
  const galleryRef = useRef<HTMLDivElement>(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const ITEMS_PER_PAGE = limit;
  
  // Reference for the observer
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Custom CSS for smoother animations
  useEffect(() => {
    // Add custom animation styles to head
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @keyframes fadeInScale {
        0% {
          opacity: 0;
          transform: scale(0.95);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      .page-animate-in {
        animation: fadeInScale 0.4s ease-out forwards;
        opacity: 0;
      }
    `;
    document.head.appendChild(styleEl);
    
    // Clean up
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Fetch data from API
  const loadPages = useCallback(async (pageNum: number) => {
    if (isLoading && pageNum > 0) return; // Prevent duplicate fetches but allow initial load
    
    setIsLoading(true);
    try {
      // Use the fetchPages function from actions.ts
      const result = await fetchPages(
        pageNum,
        ITEMS_PER_PAGE,
        authorId,
        searchQuery
      );
      
      if (result.pages.length === 0) {
        setHasMore(false);
        setIsLoading(false);
        return;
      }
      
      // If we're on the first page and letters are provided, set them
      if (pageNum === 0 && result.letters) {
        setLetters(result.letters);
      }
      
      // Append new pages to existing list
      setPages(prev => [...prev, ...result.pages]);
      
      // Set hasMore based on the result
      setHasMore(result.hasMore);
      
      // Short delay before removing loading state to ensure smooth transition
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    } catch (error) {
      console.error('Error loading pages:', error);
      toast({
        title: "Error",
        description: "Failed to load pages. Please try again later.",
        variant: "destructive"
      });
      setHasMore(false);
      setIsLoading(false);
    }
  }, [pages.length, isLoading, authorId, searchQuery, ITEMS_PER_PAGE]);

  // Initial data load
  useEffect(() => {
    setPagesWithDelay([]);
    setPage(0);
    setHasMore(true);
    loadPages(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorId, searchQuery]);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    // Disconnect previous observer if it exists
    if (observer.current) {
      observer.current.disconnect();
    }

    // Create a new observer
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        // Set loading state immediately when scrolling near the bottom
        setIsLoading(true);
        
        // Use setTimeout to ensure the loading state is rendered before fetching data
        setTimeout(() => {
          setPage(prevPage => {
            const nextPage = prevPage + 1;
            loadPages(nextPage);
            return nextPage;
          });
        }, 100);
      }
    }, { 
      threshold: 0.5,
      rootMargin: '200px'
    });

    // Observe the load more element
    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }

    // Cleanup
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loadPages, hasMore, isLoading]);

  // Filter pages by selected letter
  useEffect(() => {
    if (activeLetter === "All" && searchQuery === "") {
      setFilteredPages(pages);
    } else if (activeLetter !== "All" && searchQuery === "") {
      setFilteredPages(pages.filter((page) => page.firstLetter === activeLetter));
    } else if (activeLetter === "All" && searchQuery !== "") {
      setFilteredPages(
        pages.filter((page) =>
          page.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      // Both letter and search query are active
      setFilteredPages(
        pages.filter(
          (page) =>
            page.firstLetter === activeLetter &&
            page.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [activeLetter, pages, searchQuery]);

  // Helper function to set pages with a delay for animation purposes
  const setPagesWithDelay = (newPages: TransformedPage[]) => {
    setPages(newPages);
  };

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(3)
      .fill(0)
      .map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="bg-card rounded-lg overflow-hidden shadow-sm animate-pulse"
          style={{ height: "200px" }}
        >
          <div className="h-full w-full bg-muted"></div>
        </div>
      ));
  };

  const handleLetterClick = (letter: string) => {
    setActiveLetter(letter);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div ref={galleryRef} className="space-y-6">
      {showAlphabeticNav && (
        <div className="mb-6">
          <AlphabeticNav 
            letters={letters} 
            activeLetter={activeLetter}
            onLetterClick={handleLetterClick}
            onSearch={handleSearch}
            searchPlaceholder="Search pages..."
          />
        </div>
      )}
      
      {isLoading && pages.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="bg-card rounded-lg overflow-hidden shadow-sm animate-pulse"
              style={{ height: "200px" }}
            >
              <div className="h-full w-full bg-muted"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredPages.map((page, index) => {
              // Calculate delay for staggered animation
              const delay = Math.min(index * 0.1, 0.5);
              
              return (
                <Link to={`/page/${page.id}`} key={page.id}>
                  <Card 
                    className="page-animate-in overflow-hidden h-48 hover:shadow-md transition-shadow cursor-pointer"
                    style={{ animationDelay: `${delay}s` }}
                  >
                    <CardContent className="p-0 h-full flex flex-col items-center justify-center">
                      <div className="flex flex-col items-center justify-center h-full w-full p-4">
                        {page.avatar ? (
                          <img 
                            src={page.avatar} 
                            alt={page.name} 
                            className="w-20 h-20 rounded-full object-cover mb-4"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-bold mb-4">
                            {page.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <h3 className="text-lg font-semibold text-center">{page.name}</h3>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}

            {isLoading && renderSkeletons()}
          </div>

          {/* Invisible element for intersection observer */}
          {hasMore && !isLoading && (
            <div ref={loadMoreRef} className="h-10 mt-4"></div>
          )}

          {!isLoading && filteredPages.length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No pages found</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PageGallery;
