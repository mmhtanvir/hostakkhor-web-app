import { useState, useEffect } from "react";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { updatePinnedPostTheme } from "@/actions/actions";
import { useUser } from "@/hooks/useUser";
import { IUser } from "@/lib/utils";

interface PinnedPostThemePickerProps {
  userId: string;
  currentTheme: 'default' | 'golden';
  onThemeChange: (theme: 'default' | 'golden') => void;
}

const PinnedPostThemePicker = ({ userId, currentTheme, onThemeChange }: PinnedPostThemePickerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  
  // Only allow editing if viewing own profile
  const canEdit = user?.id === userId;

  const handleThemeChange = async (theme: 'default' | 'golden') => {
    if (!canEdit) return;
    
    setIsLoading(true);
    try {
      const success = await updatePinnedPostTheme(userId, theme);
      if (success) {
        onThemeChange(theme);
      }
    } catch (error) {
      console.error("Error updating theme:", error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  if (!canEdit) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          // variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          disabled={isLoading}
        >
          <Palette className="h-4 w-4" />
          <span>Change Theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Select Pinned Post Theme</h4>
          <RadioGroup 
            value={currentTheme} 
            onValueChange={(value) => handleThemeChange(value as 'default' | 'golden')}
            className="grid grid-cols-2 gap-4"
          >
            <div className="relative">
              <RadioGroupItem 
                value="default" 
                id="theme-default" 
                className="sr-only" 
              />
              <Label 
                htmlFor="theme-default" 
                className={`flex flex-col items-center gap-2 rounded-md border-2 p-2 cursor-pointer hover:bg-accent ${currentTheme === 'default' ? 'border-primary' : 'border-muted'}`}
              >
                {currentTheme === 'default' && (
                  <Check className="h-4 w-4 absolute top-2 right-2 text-primary" />
                )}
                <div className="h-24 w-full rounded-md bg-gray-50 shadow-sm overflow-hidden border border-[#F3EDE3]">
                  <div className="h-6 bg-[#F3EDE3] flex items-center px-2 text-xs text-black">
                    <span>Pinned Post</span>
                  </div>
                  <div className="p-2 flex flex-col items-center bg-white">
                    <div className="h-10 w-10 rounded-full bg-white border-2 border-[#F3EDE3]"></div>
                    <div className="w-full mt-1 flex gap-1 flex-col">
                      {/* dark bg */}
                      <div className="h-2 w-16 mx-auto bg-[#F3EDE3] rounded"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs">Default</span>
              </Label>
            </div>
            
            <div className="relative">
              <RadioGroupItem 
                value="golden" 
                id="theme-golden" 
                className="sr-only" 
              />
              <Label 
                htmlFor="theme-golden" 
                className={`flex flex-col items-center gap-2 rounded-md border-2 p-2 cursor-pointer hover:bg-accent ${currentTheme === 'golden' ? 'border-primary' : 'border-muted'}`}
              >
                {currentTheme === 'golden' && (
                  <Check className="h-4 w-4 absolute top-2 right-2 text-primary" />
                )}
                <div className="h-24 w-full rounded-md bg-amber-50 shadow-sm overflow-hidden border border-amber-200">
                  <div className="h-6 bg-amber-100 flex items-center px-2 text-xs text-amber-800">
                    <span>Pinned Post</span>
                  </div>
                  <div className="p-2 flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full bg-amber-200 border-2 border-amber-300"></div>
                    <div className="w-full mt-1">
                      <div className="h-2 w-16 mx-auto bg-amber-200 rounded"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs">Golden</span>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PinnedPostThemePicker;
