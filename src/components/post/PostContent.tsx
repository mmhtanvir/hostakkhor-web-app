import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/contexts/ThemeContext";

interface PostContentProps {
  content: string;
  onChange: (content: string) => void;
  onFocus: () => void;
  overridePlaceholder?: string;
}

export const PostContent = ({ content, onChange, onFocus, overridePlaceholder }: PostContentProps) => {
  const {theme} = useTheme();
  return (
    <Textarea
      placeholder={overridePlaceholder || theme?.createNewPostPlaceholdertext || "What's on your mind?" }
      value={content}
      rows={theme?.allowTextBeforeAttachment ? 3 : 1}
      onChange={(e) => onChange(e.target.value)}
      onClick={onFocus}
      className="mb-4 min-h-[20px] text-md"
    />
  );
};
