import { getQuarksInstance } from "@/api/quarksInstance";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useUser } from "@/hooks/useUser";
import { IUser } from "@/lib/utils";
import { IPost } from "@/pages/Index";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export const ProfileSidebar = () => {
  const { user, updateUser } = useUser();
  const [userPosts, setUserPosts] = useState<IPost[]>([]);

  const getUsersPosts = async () => {
    const postsCollection = getQuarksInstance().collection<IPost>('posts');
    const posts = await postsCollection.where('authorId', 'eq', user?.id).get();
    setUserPosts(posts);
  }

  useEffect(() => {
    if(!user?.id) return;

    const fetchUserProfile = async () => {
      try {
        const usersCollection = getQuarksInstance().collection<IUser>('users');
        const users = await usersCollection.where('id', 'eq', user.id).get();
        if (users.length > 0) {
          updateUser(users[0]);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
    getUsersPosts();
  }, [user?.id]);

  return (
    <Card className="p-4 sticky top-4">
      <div className="flex flex-col items-center">
        <Link to={`/user/${user?.id}`} className="w-full flex flex-col items-center">
          <Avatar className="w-20 h-20">
            <AvatarImage className="object-cover object-top" src={user?.profileImageUrl} />
            <AvatarFallback>{user?.name?.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <h2 className="mt-4 font-semibold text-lg">{user?.name}</h2>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </Link>

        <div className="w-full mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Public impressions</span>
            {/* {post.likes} */}
            <span className="font-semibold">{userPosts.reduce((sum, post) => sum + post.likes, 0)}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-gray-500">Total posts</span>
            <span className="font-semibold">{userPosts.length}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};