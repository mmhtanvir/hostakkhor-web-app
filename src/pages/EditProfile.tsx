import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQuarksInstance } from '@/api/quarksInstance';
import { IUser } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { getUserByUserId } from '@/actions/actions';
import AvatarPlaceholderImage from "@/assets/avatar placceholder.png";

const EditProfile = () => {
  const FILE_SERVER_URL = import.meta.env.VITE_FILE_SERVER_URL;
  const navigate = useNavigate();
  const { user, updateUser } = useUser();
  const { isAdmin } = useAdminAuth();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');
  const [profileUser, setProfileUser] = useState<IUser | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profileImageUrl: '',
    bio: ''
  });


  useEffect(() => {
    if (isAdmin || userId) {
      getUserByUserId(userId).then(user => {
        setProfileUser(user);
        if (user) {
          setFormData({
            name: user.name || '',
            email: user.email || '',
            profileImageUrl: user.profileImageUrl || '',
            bio: user.bio || ''
          });
        }
      }).catch(error => {
        console.error('Error fetching user by user id:', error);
      });
    } else if (user) {
      setProfileUser(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        profileImageUrl: user.profileImageUrl || '',
        bio: user.bio || ''
      });
    }
  }, [user, isAdmin, userId]);

  const deleteFile = async (filename: string) => {
    try {
      const response = await fetch(`${FILE_SERVER_URL}/delete/${filename}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }
      console.log('Delete successful');
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  };

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profileUser?.id) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      if (profileUser?.profileImageUrl && profileUser.profileImageUrl.startsWith(FILE_SERVER_URL)) {
        await deleteFile(profileUser?.profileImageUrl.split('/').pop() || '');
      }

      const response = await fetch(`${FILE_SERVER_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload image');

      const { filename } = await response.json();
      const newImageUrl = `${FILE_SERVER_URL}/files/${filename}`;

      // Update form state
      setFormData(prev => ({
        ...prev,
        profileImageUrl: newImageUrl
      }));

      // Update user in database
      const updatedProfile = {
        ...profileUser,
        profileImageUrl: newImageUrl
      };
      await getQuarksInstance().collection<IUser>('users').doc(profileUser.id).update(updatedProfile);

      // Update user context
      updateUser(updatedProfile);

      toast({
        title: 'Success',
        description: 'Profile image updated successfully',
      });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload profile image',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUser?.id) return;

    setIsLoading(true);
    try {
      const updatedProfile = {
        ...profileUser,
        ...formData
      };

      // Update user in database
      await getQuarksInstance().collection<IUser>('users').doc(profileUser.id).update(updatedProfile);
      updateUser(updatedProfile);

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      navigate(`/profile/${profileUser.id}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!profileUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(`/profile/${profileUser.id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="w-32 h-32" style={{backgroundImage: `url(${AvatarPlaceholderImage})`, backgroundSize: 'cover'}}>
                    <AvatarImage src={formData.profileImageUrl} className='object-cover object-top' />
                  </Avatar>
                  <div className="absolute bottom-0 right-0">
                    <Button variant="secondary" className="rounded-full p-2 h-auto cursor-pointer" size="icon" asChild>
                      <label>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleProfileImageUpload}
                          disabled={isUploadingImage}
                        />
                        {isUploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </label>
                    </Button>
                  </div>
                </div>

              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Your email"
                    disabled
                  />
                  <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">About (Bio)</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                </div>

              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/profile/${profileUser.id}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditProfile;
