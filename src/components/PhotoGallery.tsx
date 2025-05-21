import { useState, useEffect, useRef, useCallback } from "react";
import GalleryItem from "./GalleryItem";
import AlphabeticNav from "./AlphabeticNav";
import AudioPlaceholderImage from '@/assets/audio-placeholder.svg';
import { PostSkeleton } from "@/pages/Index";
import { fetchAllPosts, TransformedPost, getPageById } from "@/actions/actions";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";

interface Post extends TransformedPost {
  pageName?: string;
  pageAvatar?: string;
}

interface PhotoGalleryProps {
  pageId?: string;
  authorId?: string;
  showHeading?: boolean;
  showFilter?: boolean;
  largeGridItems?: boolean;
  theme?: 'default' | 'golden';
}

const PhotoGallery = ({ pageId, authorId, showHeading = false, showFilter = false, largeGridItems = false, theme: propTheme }: PhotoGalleryProps) => {
  // Get the current user to check for their theme preference
  const { user } = useUser();
  // Use the provided theme prop or fallback to the user's preference or default
  const [currentTheme, setCurrentTheme] = useState<'default' | 'golden'>(propTheme || user?.pinnedPostTheme || 'default');
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [activeLetter, setActiveLetter] = useState("All");
  const [letters, setLetters] = useState<string[]>(["All"]);
  const galleryRef = useRef<HTMLDivElement>(null);
  
  // UI Pagination state
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const ITEMS_PER_PAGE = 6;
  
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
      
      .post-animate-in {
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

  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Function to fetch page details for posts with pageIds
  const fetchPageDetails = useCallback(async (posts: Post[]) => {
    const postsWithPageIds = posts.filter(post => post.pageId);
    
    if (postsWithPageIds.length === 0) return posts;
    
    const updatedPosts = [...posts];
    
    // Create a Set of unique pageIds to avoid duplicate requests
    const uniquePageIds = new Set(postsWithPageIds.map(post => post.pageId));
    
    // Fetch page details for each unique pageId
    const pageDetailsPromises = Array.from(uniquePageIds).map(async (pageId) => {
      if (!pageId) return null;
      try {
        const pageDetails = await getPageById(pageId);
        return { pageId, pageDetails };
      } catch (error) {
        console.error(`Error fetching page details for pageId ${pageId}:`, error);
        return null;
      }
    });
    
    // Wait for all page details to be fetched
    const pageDetailsResults = await Promise.all(pageDetailsPromises);
    
    // Create a map of pageId to page details for quick lookup
    const pageDetailsMap = new Map();
    pageDetailsResults.forEach(result => {
      if (result && result.pageDetails) {
        pageDetailsMap.set(result.pageId, result.pageDetails);
      }
    });
    
    // Update posts with page details
    updatedPosts.forEach(post => {
      if (post.pageId && pageDetailsMap.has(post.pageId)) {
        const pageDetails = pageDetailsMap.get(post.pageId);
        post.pageName = pageDetails.name;
        post.pageAvatar = pageDetails.avatar;
        
        // Update the firstLetter to include the page name's first letter
        post.firstLetter = pageDetails.name.charAt(0).toUpperCase();
      }
    });
    
    return updatedPosts;
  }, []);

  // Load more posts for UI display (client-side pagination)
  const loadMorePosts = useCallback(() => {
    if (!hasMore || isLoading) return;
    
    setIsLoading(true);
    
    // Calculate next batch of posts to display
    const nextPage = page + 1;
    const start = nextPage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const nextBatch = filteredPosts.slice(start, end);
    
    if (nextBatch.length === 0) {
      setHasMore(false);
      setIsLoading(false);
      return;
    }
    
    // Short delay to simulate loading for smoother transitions
    setTimeout(() => {
      setDisplayedPosts(prev => [...prev, ...nextBatch]);
      setPage(nextPage);
      setIsLoading(false);
    }, 300);
  }, [filteredPosts, hasMore, isLoading, page, ITEMS_PER_PAGE]);

  // Fetch all posts data at once
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all posts at once
      const result = await fetchAllPosts(
        "public",
        pageId,
        searchQuery,
        authorId
      );
      
      if (result.posts.length === 0) {
        setAllPosts([]);
        setFilteredPosts([]);
        setDisplayedPosts([]);
        setHasMore(false);
        setIsLoading(false);
        return;
      }
      
      // Set initial letters from API
      if (result.letters) {
        setLetters(result.letters);
      }
      
      // Pre-load first batch of images to reduce visible delay
      const firstBatchImages = result.posts.slice(0, ITEMS_PER_PAGE).map(post => post.images[0] || '');
      const imagePromises = firstBatchImages.map(imgSrc => {
        return new Promise((resolve) => {
          if (!imgSrc) return resolve(true);
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = imgSrc;
        });
      });
      
      // Wait for first batch images to preload (with a timeout to prevent hanging)
      await Promise.race([
        Promise.all(imagePromises),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      
      // Fetch page details for all posts with pageIds
      const updatedPosts = await fetchPageDetails(result.posts);
      
      // Update all letters to include page name first letters
      const uniqueLetters = new Set(updatedPosts.map(p => p.firstLetter));
      
      // Sort letters using localeCompare for proper handling of non-English characters
      const sortedLetters = Array.from(uniqueLetters).sort((a, b) => 
        a.localeCompare(b, undefined, { sensitivity: 'base' })
      );
      
      // Add "All" as the first option
      const allLetters = ["All", ...sortedLetters];
      setLetters(allLetters);
      
      // Store all posts
      setAllPosts(updatedPosts);
      
      // Apply initial filtering based on active letter
      if (activeLetter === "All") {
        setFilteredPosts(updatedPosts);
      } else {
        setFilteredPosts(updatedPosts.filter(post => post.firstLetter === activeLetter));
      }
      
      // Display first batch of posts
      setDisplayedPosts(updatedPosts.slice(0, ITEMS_PER_PAGE));
      setPage(0);
      setHasMore(updatedPosts.length > ITEMS_PER_PAGE);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again later.",
        variant: "destructive"
      });
      setHasMore(false);
      setIsLoading(false);
    }
  }, [pageId, searchQuery, authorId, activeLetter, fetchPageDetails, ITEMS_PER_PAGE]);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    // Disconnect previous observer if it exists
    if (observer.current) {
      observer.current.disconnect();
    }

    // Create a new observer
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        loadMorePosts();
      }
    }, { 
      // Lower threshold to start loading earlier when scrolling
      threshold: 0.5,
      // Add root margin to trigger loading before the element is fully visible
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
  }, [loadMorePosts, hasMore, isLoading]);

  // Filter posts when activeLetter or searchQuery changes
  useEffect(() => {
    // Reset pagination
    setPage(0);
    
    // Apply filters
    if (activeLetter === "All" && searchQuery === "") {
      setFilteredPosts(allPosts);
    } else if (activeLetter !== "All" && searchQuery === "") {
      setFilteredPosts(allPosts.filter((post) => post.firstLetter === activeLetter));
    } else if (activeLetter === "All" && searchQuery !== "") {
      setFilteredPosts(
        allPosts.filter((post) =>
          post.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      // Both letter filter and search query are active
      setFilteredPosts(
        allPosts.filter(
          (post) =>
            post.firstLetter === activeLetter &&
            post.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [activeLetter, allPosts, searchQuery]);

  // Update displayed posts when filtered posts change
  useEffect(() => {
    // Sort posts to show pinned posts first
    const sortedPosts = [...filteredPosts].sort((a, b) => {
      // If both posts have the same pinned status, maintain original order
      if ((a.pinned && b.pinned) || (!a.pinned && !b.pinned)) {
        return 0;
      }
      // Pinned posts come first
      return a.pinned ? -1 : 1;
    });
    
    // Display first batch of filtered posts
    setDisplayedPosts(sortedPosts.slice(0, ITEMS_PER_PAGE));
    // Set hasMore based on filtered posts length
    setHasMore(sortedPosts.length > ITEMS_PER_PAGE);
  }, [filteredPosts, ITEMS_PER_PAGE]);

  // Handle letter selection and scroll to section
  const handleLetterClick = (letter: string) => {
    setActiveLetter(letter);
    
    // Smooth scroll to gallery section
    if (galleryRef.current) {
      const yOffset = -100; // Adjust for header height
      const y = galleryRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  // Handle pin status change
  const handlePinStatusChange = (postId: string, isPinned: boolean) => {
    // Update the post in allPosts
    const updatedAllPosts = allPosts.map(post => {
      if (post.id === postId) {
        return { ...post, pinned: isPinned };
      }
      return post;
    });
    setAllPosts(updatedAllPosts);
    
    // Update the post in filteredPosts
    const updatedFilteredPosts = filteredPosts.map(post => {
      if (post.id === postId) {
        return { ...post, pinned: isPinned };
      }
      return post;
    });
    setFilteredPosts(updatedFilteredPosts);
    
    // Update the post in displayedPosts
    const updatedDisplayedPosts = displayedPosts.map(post => {
      if (post.id === postId) {
        return { ...post, pinned: isPinned };
      }
      return post;
    });
    setDisplayedPosts(updatedDisplayedPosts);
  };

  // Generate skeleton loaders
  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
      <div 
        key={`skeleton-${index}`} 
        className="animate-pulse transition-opacity duration-300 ease-in-out"
        style={{ 
          animationDelay: `${index * 0.15}s`,
          height: '100%' 
        }}
      >
        <PostSkeleton />
      </div>
    ));
  };

  return (
    <div ref={galleryRef} className="space-y-6">
      {showHeading && (
        <div className="flex flex-col items-center text-center mb-8">
          <h2 className="text-2xl font-semibold mb-2">Handwriting Archives</h2>
          <p className="text-muted-foreground max-w-2xl">
            Browse our collection of handwriting samples with accompanying audio recordings. 
            Each entry preserves the unique penmanship and voice of the contributor.
          </p>
        </div>
      )}
      
      {showFilter && (
        <div className="mb-6">
          <AlphabeticNav 
            letters={letters} 
            activeLetter={activeLetter}
            onLetterClick={handleLetterClick}
            onSearch={handleSearch}
            searchPlaceholder="Search posts..."
          />
        </div>
      )}
      
      {isLoading && displayedPosts.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array(6).fill(0).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${largeGridItems ? 2 : 3} gap-4 md:gap-6`}>
            {displayedPosts.map((post, index) => {
              // Calculate proper animation delay - newer posts should have shorter delays
              const isNewPost = index >= displayedPosts.length - ITEMS_PER_PAGE;
              const animationDelay = isNewPost 
                ? `${(index % ITEMS_PER_PAGE) * 0.1}s` 
                : `${index * 0.1}s`;
              
              return (
                <div 
                  key={post.id} 
                  className="post-animate-in"
                  style={{ 
                    animationDelay
                  }}
                >
                  <GalleryItem
                    images={post.images}
                    avatarSrc={post.avatar}
                    name={post.name}
                    audioUrl={post.audioUrl}
                    audioFiles={post.audioFiles}
                    initials={getInitials(post.name)}
                    sizeFactor={post.sizeFactor}
                    postId={post.id}
                    authorId={post.authorId}
                    pageId={post.pageId}
                    pageAvatar={post.pageAvatar}
                    pageName={post.pageName}
                    content={post.content}
                    pinned={post.pinned}
                    onPinStatusChange={handlePinStatusChange}
                  />
                </div>
              );
            })}
          </div>
          
          {displayedPosts.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No posts found for this filter.</p>
            </div>
          )}
          
          {/* Observer target for infinite scrolling */}
          <div ref={loadMoreRef} className="py-8">
            {/* Show skeleton loaders while loading more posts */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {renderSkeletons()}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PhotoGallery;
