import { getQuarksInstance } from "@/api/quarksInstance";
import { IPost } from "@/pages/Index";
import { toast } from "@/hooks/use-toast";
import { IPage } from "@/pages/CreatePage";
import { IUser } from "@/lib/utils";

const FILE_SERVER_URL = import.meta.env.VITE_FILE_SERVER_URL;

/**
 * Delete a post by ID
 * @param postId - The ID of the post to delete
 * @returns Promise<boolean> - True if deletion was successful
 */
export const deletePost = async (postId: number | string): Promise<boolean> => {
  try {
    // Get the post to delete its media files first
    const postsCollection = getQuarksInstance().collection<IPost>("posts");
    const post = await postsCollection.doc(postId.toString()).get();
    
    if (!post) {
      throw new Error("Post not found");
    }

    // Delete associated media files
    const deletePromises: Promise<any>[] = [];
    
    // Delete images
    if (post.images && post.images.length > 0) {
      post.images.forEach(imageUrl => {
        const filename = imageUrl.split('/').pop();
        if (filename) {
          deletePromises.push(deleteFile(filename));
        }
      });
    }
    
    // Delete audio files
    if (post.audioFiles && post.audioFiles.length > 0) {
      post.audioFiles.forEach(audioUrl => {
        const filename = audioUrl.split('/').pop();
        if (filename) {
          deletePromises.push(deleteFile(filename));
        }
      });
    }
    
    // Delete videos
    if (post.videos && post.videos.length > 0) {
      post.videos.forEach(videoUrl => {
        const filename = videoUrl.split('/').pop();
        if (filename) {
          deletePromises.push(deleteFile(filename));
        }
      });
    }
    
    // Wait for all file deletions to complete
    await Promise.allSettled(deletePromises);
    
    // Delete the post document
    await postsCollection.doc(postId.toString()).delete();
    
    toast({
      title: "Post deleted",
      description: "Your post has been deleted successfully",
    });
    
    return true;
  } catch (error) {
    console.error("Error deleting post:", error);
    toast({
      title: "Error",
      description: "Failed to delete post. Please try again.",
      variant: "destructive",
    });
    return false;
  }
};

/**
 * Delete a file from the file server
 * @param filename - The filename to delete
 * @returns Promise<Response>
 */
export const deleteFile = async (filename: string): Promise<Response> => {
  try {
    const response = await fetch(`${FILE_SERVER_URL}/delete/${filename}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Delete failed');
    }
    
    return response;
  } catch (error) {
    console.error('Delete file error:', error);
    throw error;
  }
};

/**
 * Upload a file to the file server
 * @param file - The file to upload
 * @returns Promise with filename and URL
 */
export const uploadFile = async (file: File): Promise<{ filename: string; url: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${FILE_SERVER_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      if(response.status == 413) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 100MB",
          variant: "destructive",
        });
        throw new Error('File size exceeds limit');
      }
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return {
      filename: data.filename,
      url: `${FILE_SERVER_URL}/files/${data.filename}`
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

/**
 * Compress an image file before uploading
 * @param file - The image file to compress
 * @returns Promise with the compressed file
 */
export const compressImage = async (file: File): Promise<File> => {
  try {
    // Dynamically import the compression library
    const imageCompression = (await import('browser-image-compression')).default;
    
    const options = {
      useWebWorker: true,
      preserveExif: true,
      fixOrientation: true,
    };
    
    const compressedFile = await imageCompression(file, options);
    return new File([compressedFile], file.name, { type: compressedFile.type });
  } catch (error) {
    console.error('Image compression error:', error);
    throw error;
  }
};

/**
 * Process and upload image files
 * @param files - The image files to process and upload
 * @param onUploadProgress - Optional callback for upload progress updates
 * @returns Promise with an array of uploaded file info
 */
export const processAndUploadImages = async (
  files: FileList,
  onUploadProgress?: (isUploading: boolean) => void
): Promise<Array<{ filename: string; url: string }>> => {
  if (!files || files.length === 0) {
    return [];
  }

  try {
    // Start upload process - set loading state
    if (onUploadProgress) onUploadProgress(true);
    
    // Process each file to correct orientation and compress
    const processedFiles = await Promise.all(
      Array.from(files).map(async (file) => await compressImage(file))
    );

    // Upload all processed files
    const uploadPromises = processedFiles.map(file => uploadFile(file));
    const uploadedFiles = await Promise.all(uploadPromises);
    
    return uploadedFiles;
  } catch (error) {
    console.error('Error processing and uploading images:', error);
    throw error;
  } finally {
    // End upload process - reset loading state
    if (onUploadProgress) onUploadProgress(false);
  }
};

/**
 * Process and upload audio files
 * @param files - The audio files to upload
 * @param onUploadProgress - Optional callback for upload progress updates
 * @returns Promise with an array of uploaded file info
 */
export const processAndUploadAudio = async (
  files: FileList,
  onUploadProgress?: (isUploading: boolean) => void
): Promise<Array<{ filename: string; url: string }>> => {
  if (!files || files.length === 0) {
    return [];
  }

  try {
    // Start upload process - set loading state
    if (onUploadProgress) onUploadProgress(true);
    
    // Upload all files
    const uploadPromises = Array.from(files).map(file => uploadFile(file));
    const uploadedFiles = await Promise.all(uploadPromises);
    
    return uploadedFiles;
  } catch (error) {
    console.error('Error uploading audio files:', error);
    throw error;
  } finally {
    // End upload process - reset loading state
    if (onUploadProgress) onUploadProgress(false);
  }
};

/**
 * Process and upload a recorded audio blob
 * @param audioBlob - The audio blob to upload
 * @param onUploadProgress - Optional callback for upload progress updates
 * @returns Promise with the uploaded file info
 */
export const processAndUploadRecordedAudio = async (
  audioBlob: Blob,
  onUploadProgress?: (isUploading: boolean) => void
): Promise<{ filename: string; url: string }> => {
  try {
    // Start upload process - set loading state
    if (onUploadProgress) onUploadProgress(true);
    
    const file = new File([audioBlob], `recording-${Date.now()}.wav`, {
      type: "audio/wav",
    });
    
    const uploadedFile = await uploadFile(file);
    return uploadedFile;
  } catch (error) {
    console.error('Error uploading recorded audio:', error);
    throw error;
  } finally {
    // End upload process - reset loading state
    if (onUploadProgress) onUploadProgress(false);
  }
};

/**
 * Get a post by ID
 * @param postId - The ID of the post to retrieve
 * @returns Promise with the post data
 */
export const getPostById = async (postId: number | string): Promise<IPost | null> => {
  try {
    const postsCollection = getQuarksInstance().collection<IPost>("posts");
    const post = await postsCollection.doc(postId.toString()).get();
    return post;
  } catch (error) {
    console.error("Error getting post:", error);
    return null;
  }
};

/**
 * Update an existing post
 * @param postId - The ID of the post to update
 * @param postData - The updated post data
 * @returns Promise<boolean> - True if update was successful
 */
export const updatePost = async (postId: number | string, postData: Partial<IPost>): Promise<boolean> => {
  try {
    const postsCollection = getQuarksInstance().collection<IPost>("posts");
    await postsCollection.doc(postId.toString()).update(postData);
    
    toast({
      title: "Post updated",
      description: "Your post has been updated successfully",
    });
    
    return true;
  } catch (error) {
    console.error("Error updating post:", error);
    toast({
      title: "Error",
      description: "Failed to update post. Please try again.",
      variant: "destructive",
    });
    return false;
  }
};

/**
 * Interface for transformed post data
 */
export interface TransformedPost {
  id: string;
  name: string;
  image: string;
  images: string[];  
  avatar: string;
  audioUrl: string;
  audioFiles: string[];  
  firstLetter: string;
  sizeFactor: 1 | 2;
  authorId: string;
  pageId?: string;
  content?: string;
  pinned?: boolean;
}

/**
 * Fetch posts with pagination
 * @param page - Page number (0-based)
 * @param limit - Number of items per page
 * @param existingPostsLength - Length of existing posts array for sizing calculations
 * @param visibility - Visibility filter, defaults to "public"
 * @param pageId - Optional page ID to filter posts by page
 * @param searchQuery - Optional search query to filter posts by name
 * @param authorId - Optional author ID to filter posts by creator
 * @returns Promise with transformed posts and hasMore flag
 */
export const fetchPosts = async (
  page: number = 0,
  limit: number = 6,
  existingPostsLength: number = 0,
  visibility: "public" | "private" = "public",
  pageId?: string,
  searchQuery?: string,
  authorId?: string
): Promise<{ posts: TransformedPost[]; hasMore: boolean; letters?: string[] }> => {
  try {
    const quarksClient = getQuarksInstance();
    const postsCollection = quarksClient.collection<IPost>("posts");
    
    // Create a query with pagination and visibility filter
    let query = postsCollection
      .where("visibility", "eq", visibility)
      .orderBy("id", "desc"); // Sort by id descending (newest first)
    
    // Add pageId filter if provided
    if (pageId) {
      query = query.where("pageId", "eq", pageId);
    }
    
    // Add authorId filter if provided
    if (authorId) {
      query = query.where("authorId", "eq", authorId);
    }
    
    // Add pagination
    query = query.limit(limit).offset(page * limit);
    
    // Execute the query
    const posts = await query.get();
    
    // If no results or less than the limit, we've reached the end
    if (!posts || posts.length === 0) {
      return { posts: [], hasMore: false };
    }
    
    // Transform API data to match our Post interface
    const transformedPosts: TransformedPost[] = posts.map((post, index) => {
      // Use placeholder image if no images are available
      const firstImage = post.images?.length 
        ? post.images[0] 
        : '/assets/audio-placeholder.svg';

      // Determine the first letter for alphabetic navigation
      // If post is from a page, we'll update this later after fetching page details
      let firstLetter = post.author.name.charAt(0).toUpperCase();
      
      return {
        id: post.id?.toString() || "",
        name: post.author.name,
        image: firstImage,
        images: post.images || [],  
        avatar: post.author.avatar,
        audioUrl: post.audioFiles?.[0] || '',
        audioFiles: post.audioFiles || [],  
        firstLetter: firstLetter,
        sizeFactor: (existingPostsLength + index) % 3 === 0 ? 2 : 1, // Make every third item larger
        authorId: post.authorId,
        pageId: post.pageId ?? undefined,
        content: post.content || '',
        pinned: post.pinned || false
      };
    });
    
    // Apply search filter if provided (client-side filtering)
    let filteredPosts = transformedPosts;
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filteredPosts = transformedPosts.filter(post => 
        post.name.toLowerCase().includes(query)
      );
    }
    
    // Extract unique first letters for the alphabetic navigation if it's the first page
    let letters;
    if (page === 0) {
      letters = ["All", ...new Set(filteredPosts.map(p => p.firstLetter))];
    }
    
    // Return transformed posts and whether there are more posts to load
    return { 
      posts: filteredPosts, 
      hasMore: posts.length === limit,
      letters
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

/**
 * Fetch all posts at once
 * @param visibility - Visibility filter, defaults to "public"
 * @param pageId - Optional page ID to filter posts by page
 * @param searchQuery - Optional search query to filter posts by name
 * @param authorId - Optional author ID to filter posts by creator
 * @returns Promise with transformed posts
 */
export const fetchAllPosts = async (
  visibility: "public" | "private" = "public",
  pageId?: string,
  searchQuery?: string,
  authorId?: string
): Promise<{ posts: TransformedPost[]; letters?: string[] }> => {
  try {
    const quarksClient = getQuarksInstance();
    const postsCollection = quarksClient.collection<IPost>("posts");
    
    // Create a query with visibility filter
    let query = postsCollection
      .where("visibility", "eq", visibility)
      .orderBy("id", "desc"); // Sort by id descending (newest first)
    
    // Add pageId filter if provided
    if (pageId) {
      query = query.where("pageId", "eq", pageId);
    }
    
    // Add authorId filter if provided
    if (authorId) {
      query = query.where("authorId", "eq", authorId);
    }
    
    // Execute the query without pagination to get all posts
    const posts = await query.get();
    
    // If no results, return empty array
    if (!posts || posts.length === 0) {
      return { posts: [] };
    }
    
    // Transform API data to match our Post interface
    const transformedPosts: TransformedPost[] = posts.map((post, index) => {
      // Use placeholder image if no images are available
      const firstImage = post.images?.length 
        ? post.images[0] 
        : '/assets/audio-placeholder.svg';
      
      // Determine the first letter for alphabetic navigation
      // If post is from a page, we'll update this later after fetching page details
      let firstLetter = post.author.name.charAt(0).toUpperCase();
      
      return {
        id: post.id?.toString() || "",
        name: post.author.name,
        image: firstImage,
        images: post.images || [],  
        avatar: post.author.avatar,
        audioUrl: post.audioFiles?.[0] || '',
        audioFiles: post.audioFiles || [],  
        firstLetter: firstLetter,
        sizeFactor: index % 3 === 0 ? 2 : 1, // Make every third item larger
        authorId: post.authorId,
        pageId: post.pageId ?? undefined,
        content: post.content || '',
        pinned: post.pinned || false
      };
    });
    
    // Apply search filter if provided (client-side filtering)
    let filteredPosts = transformedPosts;
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filteredPosts = transformedPosts.filter(post => 
        post.name.toLowerCase().includes(query)
      );
    }
    
    // Extract unique first letters for the alphabetic navigation
    const uniqueLetters = new Set(filteredPosts.map(p => p.firstLetter));
    
    // Sort letters using localeCompare for proper handling of non-English characters
    const sortedLetters = Array.from(uniqueLetters).sort((a, b) => 
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
    
    // Add "All" as the first option
    const letters = ["All", ...sortedLetters];
    
    // Return transformed posts
    return { 
      posts: filteredPosts,
      letters
    };
  } catch (error) {
    console.error('Error fetching all posts:', error);
    throw error;
  }
};

/**
 * Create a new page
 * @param pageData - The page data to create
 * @returns Promise<string> - The ID of the created page
 */
export const createPage = async (pageData: Omit<IPage, 'id'>): Promise<string> => {
  try {
    const pagesCollection = getQuarksInstance().collection<IPage>('pages');
    const newPageId = Date.now().toString();
    
    const newPage: IPage = {
      id: newPageId,
      ...pageData,
      created_at: Date.now()
    };
    
    await pagesCollection.doc(newPageId).set(newPage);
    
    toast({
      title: "Page created",
      description: "Your page has been created successfully",
    });
    
    return newPageId;
  } catch (error) {
    console.error("Error creating page:", error);
    toast({
      title: "Error",
      description: "Failed to create page. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
};

/**
 * Update an existing page
 * @param pageId - The ID of the page to update
 * @param pageData - The updated page data
 * @returns Promise<boolean> - True if update was successful
 */
export const updatePage = async (pageId: string, pageData: Partial<IPage>): Promise<boolean> => {
  try {
    const pagesCollection = getQuarksInstance().collection<IPage>('pages');
    await pagesCollection.doc(pageId).update(pageData);
    
    toast({
      title: "Page updated",
      description: "Your page has been updated successfully",
    });
    
    return true;
  } catch (error) {
    console.error("Error updating page:", error);
    toast({
      title: "Error",
      description: "Failed to update page. Please try again.",
      variant: "destructive",
    });
    return false;
  }
};

/**
 * Get a page by ID
 * @param pageId - The ID of the page to retrieve
 * @returns Promise with the page data
 */
export const getPageById = async (pageId: string): Promise<IPage | null> => {
  try {
    const pagesCollection = getQuarksInstance().collection<IPage>('pages');
    const page = await pagesCollection.doc(pageId).get();
    return page;
  } catch (error) {
    console.error("Error getting page:", error);
    return null;
  }
};

/**
 * Delete a page by ID and all its associated posts
 * @param pageId - The ID of the page to delete
 * @returns Promise<boolean> - True if deletion was successful
 */
export const deletePage = async (pageId: string): Promise<boolean> => {
  try {
    const quarksClient = getQuarksInstance();
    const pagesCollection = quarksClient.collection<IPage>('pages');
    const postsCollection = quarksClient.collection<IPost>('posts');
    
    // First, delete all posts associated with this page
    const pagePosts = await postsCollection.where("pageId", "eq", pageId).get();
    
    if (pagePosts && pagePosts.length > 0) {
      // Delete each post one by one
      const deletePromises = pagePosts.map(post => 
        postsCollection.doc(post.id?.toString() || "").delete()
      );
      
      await Promise.all(deletePromises);
    }
    
    // Then delete the page itself
    await pagesCollection.doc(pageId).delete();
    
    toast({
      title: "Page deleted",
      description: "Your page and all its posts have been deleted successfully",
    });
    
    return true;
  } catch (error) {
    console.error("Error deleting page:", error);
    toast({
      title: "Error",
      description: "Failed to delete page. Please try again.",
      variant: "destructive",
    });
    return false;
  }
};

/**
 * Get pages created by a specific user
 * @param userId - The ID of the user whose pages to fetch
 * @returns Promise with an array of pages
 */
export const getUserPages = async (userId: string): Promise<IPage[]> => {
  try {
    const quarksClient = getQuarksInstance();
    const pagesCollection = quarksClient.collection<IPage>("pages");
    
    // Query pages where the user is the author
    const pages = await pagesCollection
      .where("authorId", "eq", userId)
      .orderBy("name", "asc")
      .get();
    
    return pages || [];
  } catch (error) {
    console.error('Error fetching user pages:', error);
    throw error;
  }
};

/**
 * Interface for transformed page data
 */
export interface TransformedPage {
  id: string;
  name: string;
  avatar: string;
  firstLetter: string;
  authorId: string;
  created_at?: number;
}

/**
 * Fetch pages with pagination
 * @param page - Page number (0-based)
 * @param limit - Number of items per page
 * @param authorId - Optional author ID to filter pages by creator
 * @param searchQuery - Optional search query to filter pages by name
 * @returns Promise with transformed pages and hasMore flag
 */
export const fetchPages = async (
  page: number = 0,
  limit: number = 6,
  authorId?: string,
  searchQuery?: string
): Promise<{ pages: TransformedPage[]; hasMore: boolean; letters?: string[] }> => {
  try {
    const quarksClient = getQuarksInstance();
    const pagesCollection = quarksClient.collection<IPage>("pages");
    
    // Create a query with pagination
    let query = pagesCollection
      .orderBy("created_at", "desc"); // Sort by creation date descending (newest first)
    
    // Add authorId filter if provided
    if (authorId) {
      query = query.where("authorId", "eq", authorId);
    }
    
    // Add pagination
    query = query.limit(limit).offset(page * limit);
    
    // Execute the query
    const pages = await query.get();
    
    // If no results or less than the limit, we've reached the end
    if (!pages || pages.length === 0) {
      return { pages: [], hasMore: false };
    }
    
    // Transform API data to match our Page interface
    const transformedPages: TransformedPage[] = pages.map((page) => {
      return {
        id: page.id?.toString() || "",
        name: page.name,
        avatar: page.avatar || "",
        firstLetter: page.name.charAt(0).toUpperCase(),
        authorId: page.authorId,
        created_at: page.created_at
      };
    });
    
    // Apply search filter if provided (client-side filtering)
    let filteredPages = transformedPages;
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filteredPages = transformedPages.filter(page => 
        page.name.toLowerCase().includes(query)
      );
    }
    
    // Extract unique first letters for the alphabetic navigation if it's the first page
    let letters;
    if (page === 0) {
      letters = ["All", ...new Set(filteredPages.map(p => p.firstLetter))];
    }
    
    // Return transformed pages and whether there are more pages to load
    return { 
      pages: filteredPages, 
      hasMore: pages.length === limit,
      letters
    };
  } catch (error) {
    console.error('Error fetching pages:', error);
    throw error;
  }
};


export const getUserByUserId = async (userId: string): Promise<IUser | null> => {
  try {
    const usersCollection = getQuarksInstance().collection<IUser>("users");
    return await usersCollection.doc(userId).get();
  } catch (error) {
    console.error('Error fetching user by user id:', error);
    return null;
  }
};

/**
 * Update the user's pinned post theme
 * @param userId - The ID of the user
 * @param theme - The theme to set ('default' or 'golden')
 * @returns Promise<boolean> - True if update was successful
 */
export const updatePinnedPostTheme = async (userId: string, theme: 'default' | 'golden'): Promise<boolean> => {
  try {
    const usersCollection = getQuarksInstance().collection<IUser>("users");
    await usersCollection.doc(userId).update({ pinnedPostTheme: theme });
    
    console.log("Theme updated successfully", theme)
    
    return true;
  } catch (error) {
    console.error("Error updating pinned post theme:", error);
    toast({
      title: "Error",
      description: "Failed to update theme. Please try again.",
      variant: "destructive",
    });
    return false;
  }
};

/**
 * Pin a post for a user
 * @param postId - The ID of the post to pin
 * @returns Promise<boolean> - True if pin was successful
 */
export const pinPost = async (postId: number | string): Promise<boolean> => {
  try {
    const postsCollection = getQuarksInstance().collection<IPost>("posts");
    
    // Get the post to find the author ID
    const post = await postsCollection.doc(postId.toString()).get();
    
    if (!post) {
      throw new Error("Post not found");
    }
    
    const authorId = post.authorId;
    
    // Find any existing pinned posts by this author
    const existingPinnedPosts = await postsCollection
      .where("authorId", "eq", authorId)
      .where("pinned", "eq", true)
      .get();
    
    // Unpin any existing pinned posts
    if (existingPinnedPosts.length > 0) {
      for (const pinnedPost of existingPinnedPosts) {
        if (pinnedPost.id.toString() !== postId.toString()) { // Don't unpin the post we're trying to pin
          await postsCollection.doc(pinnedPost.id.toString()).update({ pinned: false });
        }
      }
    }
    
    // Pin the new post
    await postsCollection.doc(postId.toString()).update({ pinned: true });
    
    toast({
      title: "Post pinned",
      description: "This post will now appear at the top of your profile",
    });
    
    return true;
  } catch (error) {
    console.error("Error pinning post:", error);
    toast({
      title: "Error",
      description: "Failed to pin post. Please try again.",
      variant: "destructive",
    });
    return false;
  }
};

/**
 * Unpin a post for a user
 * @param postId - The ID of the post to unpin
 * @returns Promise<boolean> - True if unpin was successful
 */
export const unpinPost = async (postId: number | string): Promise<boolean> => {
  try {
    const postsCollection = getQuarksInstance().collection<IPost>("posts");
    await postsCollection.doc(postId.toString()).update({ pinned: false });
    
    toast({
      title: "Post unpinned",
      description: "This post has been unpinned from your profile",
    });
    
    return true;
  } catch (error) {
    console.error("Error unpinning post:", error);
    toast({
      title: "Error",
      description: "Failed to unpin post. Please try again.",
      variant: "destructive",
    });
    return false;
  }
};