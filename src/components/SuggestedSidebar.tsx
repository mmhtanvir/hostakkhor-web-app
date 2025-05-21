import { getQuarksInstance } from "@/api/quarksInstance";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUser } from "@/hooks/useUser";
import { ICommunity } from "@/pages/CreateCommunity";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const SuggestedSidebar = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [communities, setCommunities] = useState<ICommunity[]>([]);

  const handleNavigateToCommunity = (community: ICommunity) => {
    // if(user.id === community.authorId || community.members && community.members.findIndex(member => member === user.id) !== -1) {
    //   navigate(`/community/${community.id}`);
    // }
    navigate(`/community/${community.id}`);
  };

  const getCommunities = async () => {
    const quarksInstance = getQuarksInstance().collection<ICommunity>('communities');
    const communities = await quarksInstance.orderBy('created_at', 'desc').limit(5).get();
    setCommunities(communities);
  }

  const handleJoinCommunity = async (community: ICommunity) => {
    const communityCollection = getQuarksInstance().collection<ICommunity>('communities');
    const updateCommunity = await communityCollection.doc(community.id).update({
     members: [...community.members, user?.id]
    });
 
    navigate(`/community/${community.id}`);
   }

  useEffect(() => {
    getCommunities();
    console.log(user);
  }, []);
  
  return (
    <Card className="p-4 sticky top-4">
      <h3 className="font-semibold mb-4">Join Communities</h3>
      <div className="space-y-4">
        {communities && communities.length ? communities.map((community) => (
          <div key={community.name} className="flex items-center gap-3">
            <Avatar className="w-10 h-10 cursor-pointer" onClick={() => handleNavigateToCommunity(community)}>
              <AvatarImage className="object-cover object-center" src={community.avatar} />
              <AvatarFallback>{community.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 cursor-pointer" onClick={() => handleNavigateToCommunity(community)}>
              <p className="text-sm font-medium">{community.name}</p>
              {/* truncate description */}
              <p className="text-xs text-muted-foreground truncate text-wrap line-clamp-2">{community.description}</p>
            </div>
            {community.authorId !== user?.id && community?.members && community?.members.findIndex(member => member === user?.id) === -1 && (
              <Button onClick={() => handleJoinCommunity(community)} variant="outline" size="sm">Join</Button>
            )}
          </div>
        )): null}
      </div>
    </Card>
  );
};