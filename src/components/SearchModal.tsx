import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { getQuarksInstance } from "@/api/quarksInstance";
import { FuzzySearchItem } from "@/api/quarks";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<FuzzySearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Focus the search input when modal opens
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }

    if(!isOpen) {
      setResults([]);
      setIsSearching(false);
    }
  }, [isOpen]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      const quarks = getQuarksInstance();
      const searchResults = await quarks.searchFuzzyWord({ 
        word: query.trim(),
        maxedits: 1
      });

      if(searchResults && searchResults?.result && Array.isArray(searchResults?.result)) {
        setResults(searchResults.result);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] px-12">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search..."
            className="pl-9 pr-4 h-10"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="mt-4 space-y-4">
          {isSearching ? (
            <div className="text-sm text-muted-foreground text-center">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className="p-2 rounded-lg hover:bg-accent cursor-pointer"
                >
                  <div className="font-medium">{result.word}</div>
                  {result.tag && (
                    <div className="text-sm text-muted-foreground">
                      {result.tag}
                    </div>
                  )}
                  {result.meta && (
                    <div className="text-sm text-muted-foreground">
                      {result.meta}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center">
              Start typing to search...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
