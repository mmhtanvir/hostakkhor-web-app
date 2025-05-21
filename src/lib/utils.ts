import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getQuarksInstance } from "@/api/quarksInstance";
import { ISsoUser } from "@/contexts/AuthContext";

export interface IUser {
  id?: string;
  name?: string;
  email: string;
  ssoProfileImageUrl?: string;
  profileImageUrl?: string;
  created_at?: number;
  updated_at?: number;
  path?: string;
  bio?: string;
  pinnedPostTheme?: 'default' | 'golden';
  onboardingCompleted?: boolean;
}

interface ICommunity {
  id?: number;
  name: string;
  description: string;
  createdBy: string;
  avatar?: string;
  cover?: string;
  created_at?: number;
  updated_at?: number;
  path?: string;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const isProfileImageUrlValid = async (user: IUser) => {
  if(!user?.profileImageUrl) {
    return false;
  }
  const res = await fetch(user.profileImageUrl);
  const status = res.status;

  return status === 200;
}

export const createUserIfNotExists = async (ssoUser: ISsoUser) => {
  console.log("ssoUser:", ssoUser);
  const { email, profileImageUrl } = ssoUser;
  const usersCollection = getQuarksInstance().collection<IUser>('users');
  const users = await usersCollection.where('email', 'eq', email).get();
  
  let userId: string;
  if (users.length === 0) {
    const { id } = await usersCollection.add({
      email: email,
      profileImageUrl: profileImageUrl,
      name: ssoUser?.name,
    });
    userId = id;
  } else {
    userId = users[0].id;

    // check if the current profile picture url is valid, if not save the sso user profile picture url
    const isProfileImageValid = await isProfileImageUrlValid(users[0]);
    if(!isProfileImageValid) {
      // update the user with sso profile picure
      await usersCollection.doc(userId).update({
        profileImageUrl: profileImageUrl
      })
    }
  }

  // get the new user
  const user = await usersCollection.doc(userId).get();

  return user;
};

export const createCommunityIfNotExists = async () => {
  const communitiesCollection = getQuarksInstance().collection<ICommunity>('communities');
  const communities = await communitiesCollection.where('name', 'eq', 'Skyharvest Community').get();
  
  if (communities.length === 0) {
    console.log('Creating community...');
    await communitiesCollection.add({
      name: 'Skyharvest Community',
      description: 'A community for all users',
      createdBy: "skyharvest-admin-id"
    });
  } else {
    console.log('Community already exists');
  }
};


export const deleteFile = async (filename: string) => {
  try {
    const FILE_SERVER_URL = import.meta.env.VITE_FILE_SERVER_URL;
    const response = await fetch(`${FILE_SERVER_URL}/delete/${filename}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Delete failed');
    }
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
};
