
import { useState } from "react";
import { Button } from "@/components/ui/button";
import SignInDialog from "./SignInDialog";

const Navbar = () => {
  const [signInOpen, setSignInOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md z-50 border-b border-border/50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2">
            <img 
              src="https://files.hostakkhor.com/download/711dffc3-3e8f-4b55-ad6b-f43a2eed6c2e-hotakkhor-logo.svg" 
              alt="Hostakkhor Logo" 
              className="h-12"
            />
          </a>
          {/* <nav className="hidden md:flex gap-6">
            <a href="#" className="text-sm font-medium transition-colors hover:text-primary">
              Products
            </a>
            <a href="#" className="text-sm font-medium transition-colors hover:text-primary">
              Customer Stories
            </a>
            <a href="#" className="text-sm font-medium transition-colors hover:text-primary">
              Resources
            </a>
            <a href="#" className="text-sm font-medium transition-colors hover:text-primary">
              Pricing
            </a>
          </nav> */}
        </div>
        <div className="flex items-center gap-4">
          {/* <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={() => setSignInOpen(true)}>
            Book A Demo
          </Button> */}
          <Button size="sm" onClick={() => setSignInOpen(true)}>
            Sign In
          </Button>
        </div>
      </div>
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </header>
  );
};

export default Navbar;
