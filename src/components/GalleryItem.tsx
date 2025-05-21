import { useState, useRef, useEffect } from "react";
import AudioPlayer from "./AudioPlayer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, ChevronLeft, ChevronRight, Pin, PinOff } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { deletePost, pinPost, unpinPost } from "@/actions/actions";
import { useNavigate } from "react-router-dom";
import { usePinnedPostTheme } from "@/contexts/PinnedPostThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import AudioPlaceHolder from '@/assets/audio-placeholder.svg';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";

const FallbackAvatar = () => (
  <Avatar className="h-10 w-10 ring-2 ring-white/40">
    <AvatarImage src="https://files.hostakkhor.com/download/711dffc3-3e8f-4b55-ad6b-f43a2eed6c2e-hotakkhor-logo.svg" alt="Fallback Avatar" />
  </Avatar>
);

interface GalleryItemProps {
  images: string[];
  avatarSrc: string;
  name: string;
  audioUrl: string;
  audioFiles: string[];
  initials: string;
  sizeFactor?: 1 | 2;
  postId: string;
  authorId: string;
  pageId?: string;
  pageAvatar?: string;
  pageName?: string;
  content?: string;
  pinned?: boolean;
  onPinStatusChange?: (postId: string, isPinned: boolean) => void;
  theme?: 'default' | 'golden';
}

const GalleryItem = ({
  images = [],
  avatarSrc,
  name,
  audioUrl,
  audioFiles = [],
  initials,
  sizeFactor = 1,
  postId,
  authorId,
  pageId,
  pageAvatar,
  pageName,
  content,
  pinned = false,
  onPinStatusChange,
  theme
}: GalleryItemProps) => {
  // Get theme from context or use provided theme prop
  const { theme: contextTheme, themeStyles } = usePinnedPostTheme();
  const currentTheme = theme || contextTheme;
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [isTextTruncated, setIsTextTruncated] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { user } = useUser();
  const navigate = useNavigate();
  const isOwnPost = user?.id === authorId;

  // Use all images if available, otherwise use the single image
  const allImages = images.length > 0 ? images : [AudioPlaceHolder];
  const hasMultipleImages = allImages.length > 1;
  const hasAudio = audioUrl || audioFiles.length > 0;
  const isGoldenTheme = currentTheme === 'golden';
  const displayName = pageId && pageName ? pageName : name;
  const displayAvatar = pageId && pageAvatar ? pageAvatar : avatarSrc;

  // Format images for lightbox
  const lightboxSlides = allImages.map(src => ({ src }));

  useEffect(() => {
    if (imageRef.current?.complete) {
      setIsLoaded(true);
    }
  }, []);

  // Check if text is truncated
  useEffect(() => {
    if (contentRef.current) {
      const element = contentRef.current;
      setIsTextTruncated(
        element.scrollHeight > element.clientHeight ||
        element.scrollWidth > element.clientWidth
      );
    }
  }, [content]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      const success = await deletePost(postId);
      if (success) {
        window.location.reload();
      }
    }
  };

  const handleEdit = () => {
    navigate(`/create-post?edit=${postId}`);
  };

  const handlePinToggle = async (e: React.MouseEvent, isPinning: boolean) => {
    e.stopPropagation();
    const action = isPinning ? pinPost : unpinPost;
    const success = await action(postId);
    if (success && onPinStatusChange) {
      onPinStatusChange(postId, isPinning);
    }
  };

  const handleImageNavigation = (e: React.MouseEvent, direction: 'next' | 'prev') => {
    e.stopPropagation();
    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    } else {
      setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
    }
  };

  const openLightbox = () => {
    setLightboxIndex(currentImageIndex);
    setLightboxOpen(true);
  };

  const handleNavigation = (e: React.MouseEvent, route: string) => {
    e.stopPropagation();
    navigate(route);
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const renderDropdownMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`${themeStyles.galleryItem.textColor} ${themeStyles.galleryItem.dropdownHover}`}
          onClick={stopPropagation}
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          onClick={(e) => {
            stopPropagation(e);
            handleEdit();
          }}
          className="cursor-pointer"
        >
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => handlePinToggle(e, !pinned)}
          className="cursor-pointer"
        >
          {pinned ? (
            <>
              <PinOff className={`mr-2 h-4 w-4 ${themeStyles.galleryItem.iconColor}`} />
              <span>Unpin from Profile</span>
            </>
          ) : (
            <>
              <Pin className={`mr-2 h-4 w-4 ${themeStyles.galleryItem.iconColor}`} />
              <span>Pin to Profile</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            stopPropagation(e);
            handleDelete();
          }}
          className="cursor-pointer text-red-500 focus:text-red-500"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderGoldenThemeProfile = () => (
    <div className="relative w-full">
      <h1 className="text-[#9e5101] text-lg font-bold">{pageId ? pageName : name}</h1>
      <Avatar className="sm:h-32 sm:w-32 h-20 w-20 absolute bottom-[10px] right-0 outline outline-[4px] outline-[#9e5101] border-[transparent] border-[4px]">
        <AvatarImage src={displayAvatar} alt={displayName} />
        <AvatarFallback>
          <FallbackAvatar />
        </AvatarFallback>
      </Avatar>
    </div>
  );

  return (
    <>
      <div
        className={`${themeStyles.galleryItem.container}
                 ${sizeFactor === 2 ? 'md:col-span-2 md:row-span-2' : ''}`}
        onClick={(e) => handleNavigation(e, `/post/${postId}`)}
      >
        {/* Image container */}
        <div className={themeStyles.galleryItem.imageContainer}>
          <img
            ref={imageRef}
            src={allImages[currentImageIndex]}
            alt={`${name}'s photo`}
            className={`w-full h-full object-cover transition-all duration-700 ${isLoaded ? 'image-loaded' : 'image-blur'}`}
            onLoad={() => setIsLoaded(true)}
          />

          {/* Navigation arrows - only visible if multiple images */}
          {hasMultipleImages && (
            <>
              <button
                onClick={(e) => handleImageNavigation(e, 'prev')}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 backdrop-blur-sm z-20"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => handleImageNavigation(e, 'next')}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 backdrop-blur-sm z-20"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              {/* Pagination dots */}
              <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1.5 z-20">
                {allImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      currentImageIndex === index
                        ? "bg-white scale-110"
                        : "bg-white/50 hover:bg-white/80"
                    )}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Gradient overlay */}
        <div className={`absolute inset-0 ${isGoldenTheme ? 'bg-gradient-to-t from-amber-800/40 via-amber-500/30 to-amber-200/20' : 'bg-gradient-to-t from-black/90 via-black/60 to-black/30'} opacity-40`}></div>

        {/* Edit button for golden theme */}
        {isGoldenTheme && isOwnPost && (
          <div className="absolute top-2 right-2">
            {renderDropdownMenu()}
          </div>
        )}

        {/* Header with avatar and name */}
        <div
          className={`absolute top-0 left-0 right-0 ${themeStyles.galleryItem.header} z-10`}
          onClick={(e) => handleNavigation(e, `/post/${postId}`)}
        >
          <div className="flex items-center justify-between p-3">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={(e) => {
                stopPropagation(e);
                const targetRoute = pageId ? `/page/${pageId}` : `/profile/${authorId}`;
                navigate(targetRoute);
              }}
            >
              <Avatar className={`h-10 w-10 ${themeStyles.galleryItem.avatarRing}`}>
                <AvatarImage src={displayAvatar} alt={displayName} />
                <AvatarFallback>
                  <FallbackAvatar />
                </AvatarFallback>
              </Avatar>
              <span className={`${themeStyles.galleryItem.textColor} font-medium text-base`}>
                {displayName}
              </span>
            </div>

            {isOwnPost && !isGoldenTheme && renderDropdownMenu()}
          </div>
        </div>

        {/* Content section - always rendered with consistent height */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10 pb-4">
          <div
            className={`${themeStyles.galleryItem.contentBg} p-2 rounded-tl rounded-tr ${isGoldenTheme ? 'h-[110px]' : 'h-[80px]'}`}
            onClick={(e) => handleNavigation(e, `/post/${postId}`)}
          >
            {/* Golden theme profile header */}
            {isGoldenTheme && renderGoldenThemeProfile()}

            {/* Content text if exists */}
            {content ? (
              <>
                <p
                  ref={contentRef}
                  className={`${themeStyles.galleryItem.textColor} text-xs line-clamp-1`}
                >
                  {content}
                </p>
                {isTextTruncated && (
                  <button
                    className={`${isGoldenTheme ? 'text-amber-800' : 'text-blue-400'} p-0 text-xs hover:underline`}
                    onClick={(e) => {
                      stopPropagation(e);
                      setContentDialogOpen(true);
                    }}
                  >
                    Show more
                  </button>
                )}
              </>
            ) : (
              // Placeholder text when no content is available
              <p className={`${themeStyles.galleryItem.textColor} text-xs opacity-60 italic`}>
                No description available
              </p>
            )}
          </div>
        </div>

        {/* Audio player - conditionally rendered but space is always reserved */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-20 min-h-[46px]" onClick={stopPropagation}>
          {hasAudio ? (
            <AudioPlayer audioUrl={audioUrl} audioFiles={audioFiles} postId={postId} />
          ) : (
            <div className="rounded-lg p-1.5 w-full" style={{
              backgroundColor: `var(--player-bg, ${contextTheme == 'default' ? 'rgba(0, 0, 0, 0.6))' : '#a5611d'}`,
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--player-border, transparent)',
              boxShadow: 'var(--player-shadow, none)'
            }}>
              <p className="text-[10px] h-[20px] flex items-center" style={{ color: 'var(--player-text, rgba(255, 255, 255, 0.8))' }}>
                No audio available
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox component */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        index={lightboxIndex}
        plugins={[Zoom, Thumbnails]}
        carousel={{ finite: allImages.length <= 1 }}
        thumbnails={{
          position: "bottom",
          width: 120,
          height: 80,
          gap: 16,
          vignette: true,
        }}
        zoom={{
          wheelZoomDistanceFactor: 10,
          pinchZoomDistanceFactor: 10,
          doubleClickMaxStops: 2,
          doubleClickDelay: 300,
        }}
      />

      {/* Content dialog */}
      <Dialog open={contentDialogOpen} onOpenChange={setContentDialogOpen}>
        <DialogContent className={`sm:max-w-md ${isGoldenTheme ? 'bg-[#fbe4cc]/95' : ''}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Avatar className={`h-6 w-6 ${isGoldenTheme ? themeStyles.galleryItem.avatarRing : ''}`}>
                <AvatarImage src={displayAvatar} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className={isGoldenTheme ? 'text-amber-900' : ''}>{displayName}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            <p className={`whitespace-pre-wrap ${isGoldenTheme ? 'text-amber-900' : ''}`}>{content}</p>
          </div>
          <div className="flex justify-end">
            <DialogClose asChild>
              <Button 
                variant={isGoldenTheme ? 'outline' : 'secondary'}
                className={isGoldenTheme ? 'border-amber-600 text-amber-800 hover:bg-amber-100' : ''}
              >
                Close
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GalleryItem;