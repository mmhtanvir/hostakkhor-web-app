import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PhotoGallery from "@/components/PhotoGallery";
import { Toaster } from "sonner";
import Features from "@/components/Features";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";

export interface IPost {
  id?: number;
  path?: string;
  created_at?: number;
  authorId: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    id?: string;
  };
  content: string;
  images?: string[];
  audioFiles?: string[];
  videos?: string[];
  category: string;
  likes: number;
  comments: number;
  likedBy: string[];
  communityId?: string;
  pageId?: string;
  visibility?: "public" | "private";
  pinned?: boolean;
}

export const PostSkeleton = () => {
  return (
    <div className="bg-card rounded-lg shadow-sm p-4 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-48 w-full rounded-md" />
    </div>
  );
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />
      <main>
        <Hero />
        <div className="container max-w-7xl mx-auto px-4 md:px-6">
          <PhotoGallery showHeading={true} showFilter={true} />
        </div>
      </main>
      <footer className="border-t py-8 mt-20">
        <div className="container">
          <div className="flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">
              2025 Hostakkhor. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
