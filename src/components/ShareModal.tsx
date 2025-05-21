import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import facebookIcon from "@/assets/icons/facebook.png";
import twitterIcon from "@/assets/icons/twitter.png";
import whatsappIcon from "@/assets/icons/whatsapp.png";
import { useTheme } from "@/contexts/ThemeContext";
import { IUser } from "@/lib/utils";
import { getQuarksInstance } from "@/api/quarksInstance";
import { useUser } from "@/hooks/useUser";
import { IPost } from "@/pages/Index";

export interface SharedPost {
    id: string;
    postPath: string;
    sharedBy: string;
    sharedWith: string;
    createdAt: number;
}

interface ShareModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    post?: IPost;
    url?: string;
}

export const ShareModal = ({ isOpen, onOpenChange, post, url }: ShareModalProps) => {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);
    const {theme} = useTheme();
    const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
    const { user } = useUser();
    const [sharedUsers, setSharedUsers] = useState<Record<string, SharedPost>>({});

    const shareUrl = post 
        ? `${window.location.origin}/post/${post.id}`
        : url || '';

    const shareText = post
        ? `Check out this post on Hostakkhor!`
        : url
            ? `Check out this page on Hostakkhor!`
            : '';

    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
    };

    const handleShare = (platform: keyof typeof shareUrls) => {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast({
                title: "Link copied!",
                description: "The post link has been copied to your clipboard.",
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast({
                title: "Failed to copy",
                description: "Please try copying the link manually.",
                variant: "destructive",
            });
        }
    };

    const handleUserSelect = (user: IUser) => {
        setSelectedUsers(prev => {
            const isSelected = prev.some(u => u.id === user.id);
            if (isSelected) {
                return prev.filter(u => u.id !== user.id);
            }
            return [...prev, user];
        });
    };

    const fetchSharedUsers = async () => {
        try {
            const sharedPostsCollection = getQuarksInstance().collection<SharedPost>("shared_posts");
            const shares = await sharedPostsCollection.where("postPath", "eq", post.path)
                .where("sharedBy", "eq", user.id)
                .get();
            
            const sharesMap = shares.reduce((acc, share) => {
                acc[share.sharedWith] = share;
                return acc;
            }, {} as Record<string, SharedPost>);
            
            setSharedUsers(sharesMap);
        } catch (error) {
            console.error('Error fetching shared users:', error);
        }
    };


    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setSelectedUsers([]);
        }
        onOpenChange(open);
    };

    useEffect(() => {
        if (isOpen && user?.id && post?.id) {
            fetchSharedUsers();
        }
    }, [isOpen, user?.id, post?.id]);

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className={`sm:max-w-md flex flex-col p-0 pb-4`}>
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Share {post ? 'Post' : 'Page'}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 px-6" style={{ height: selectedUsers.length > 0 ? 'calc(100% - 140px)' : 'calc(100% - 80px)' }}>
                    <div className="flex justify-center gap-8">
                        <Button
                            variant="outline"
                            size="icon"
                            className="w-16 h-16 bg-[#1877F2] hover:bg-[#1877F2]/90"
                            onClick={() => handleShare('facebook')}
                        >
                            <img src={facebookIcon} alt="Facebook" className="h-12 w-12 text-white" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="w-16 h-16 bg-[#000000] hover:bg-[#000000]/90"
                            onClick={() => handleShare('twitter')}
                        >
                            <img src={twitterIcon} alt="Twitter" className="h-12 w-12 text-white" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="w-16 h-16 bg-[#25D366] hover:bg-[#25D366]/90"
                            onClick={() => handleShare('whatsapp')}
                        >
                            <img src={whatsappIcon} alt="WhatsApp" className="h-12 w-12 text-white" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 p-2 border rounded-md">
                        <input
                            type="text"
                            readOnly
                            value={shareUrl}
                            className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyLink}
                            className="gap-2"
                        >
                            {copied ? (
                                <>
                                    <Check className="h-4 w-4" /> Copied
                                </>
                            ) : (
                                <>
                                    <LinkIcon className="h-4 w-4" /> Copy Link
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
