import { Button } from "@/components/ui/button";
import { useState } from "react";
import SignInDialog from "./SignInDialog";
import { PenLine, Headphones, Building2, FileEdit } from "lucide-react";
import PinnedPost from "./PinnedPost";
import { Link } from "react-router-dom";

const Hero = () => {
  const [demoOpen, setDemoOpen] = useState(false);
  
  return (
    <section className="container pt-28 pb-16 md:pb-24 text-center relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary),0.08),transparent_50%)]"></div>
      
      <div className="inline-flex items-center justify-center rounded-full bg-muted px-3 py-1 text-sm font-medium mb-6 animate-fade-in">
        <PenLine className="mr-2 h-4 w-4" />
        HANDWRITING ARCHIVE
      </div>
      
      <h1 className="max-w-4xl mx-auto mb-6 animate-slide-up opacity-0" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
        Preserving Handwriting and Voice for Generations
      </h1>
      
      <p className="max-w-2xl mx-auto text-muted-foreground mb-10 animate-slide-up opacity-0" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
        Hostakkhor helps you digitally preserve personal handwritten documents alongside voice recordings, 
        creating a multimedia archive that captures the essence of individual expression.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-slide-up opacity-0" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
        <Button size="lg" className="w-full sm:w-auto gap-2" asChild>
          <Link to="/create-page">
            <Building2 className="h-4 w-4" />
            Create Your Page
          </Link>
        </Button>
        <Button size="lg" className="w-full sm:w-auto gap-2" asChild>
          <Link to="/create-post">
            <FileEdit className="h-4 w-4" />
            Create a Post
          </Link>
        </Button>
      </div>

      {/* Pinned Post */}
      <div className="max-w-4xl mx-auto mb-4 animate-slide-up opacity-0" 
           style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}>
        <PinnedPost />
      </div>
      
      <SignInDialog open={demoOpen} onOpenChange={setDemoOpen} />
    </section>
  );
};

export default Hero;
