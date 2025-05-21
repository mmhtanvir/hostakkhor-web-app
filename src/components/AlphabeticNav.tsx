import { useState, useEffect } from "react";
import { Search } from "lucide-react";

interface AlphabeticNavProps {
  letters: string[];
  activeLetter: string;
  onSelectLetter?: (letter: string) => void;
  onLetterClick?: (letter: string) => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

const AlphabeticNav = ({ 
  letters, 
  activeLetter, 
  onSelectLetter,
  onLetterClick,
  onSearch,
  searchPlaceholder = "Search..."
}: AlphabeticNavProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleLetterClick = (letter: string) => {
    if (onLetterClick) {
      onLetterClick(letter);
    } else if (onSelectLetter) {
      onSelectLetter(letter);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="alpha-nav transition-all duration-300">
      <div className="container max-w-7xl px-4">
        <div className="flex flex-col gap-4 py-3 items-center">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
            />
          </div>
          {/* Letters grid */}
          <div className="flex flex-wrap items-center gap-1.5">
            {letters.map((letter) => (
              <button
                key={letter}
                onClick={() => handleLetterClick(letter)}
                className={`min-w-[32px] h-8 px-2.5 rounded-md text-sm font-medium transition-colors
                  ${activeLetter === letter 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                    : 'bg-background hover:bg-accent/50'}`}
                aria-current={activeLetter === letter ? 'page' : undefined}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlphabeticNav;
