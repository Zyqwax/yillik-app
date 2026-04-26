import ProfileClient from '../components/ProfileClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';
import Vote from '@/models/Vote';

type LeanPhoto = {
  _id: unknown;
  url: string;
  caption: string | null;
  userId: { _id: unknown; name: string; username: string };
  voteCount: number;
  isAnonymous?: boolean;
  isHidden?: boolean;
  createdAt: Date;
};

type MappedPhoto = {
  id: string;
  url: string;
  caption: string | null;
  voteCount: number;
  user: { name: string; username: string };
  hasVoted: boolean;
  canDelete: boolean;
  isHidden: boolean;
  createdAt?: string;
};

export default async function ProfilePage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  await dbConnect();

  let userPhotos: MappedPhoto[] = [];
  try {
    const photos = (await Photo.find({ userId: session.userId })
      .populate('userId', 'name username')
      .sort({ createdAt: -1 })
      .lean()) as LeanPhoto[];

    const userVotes = await Vote.find({ userId: session.userId }).select('photoId').lean();
    const userVotedPhotoIds = new Set(userVotes.map(v => v.photoId.toString()));

    userPhotos = photos.map((photo) => {
      return {
        id: String(photo._id),
        url: photo.url,
        caption: photo.caption ?? null,
        voteCount: photo.voteCount,
        user: photo.isAnonymous
          ? { name: 'Anonim Kullanıcı', username: 'anonim' }
          : {
              name: photo.userId.name,
              username: photo.userId.username
            },
        hasVoted: userVotedPhotoIds.has(String(photo._id)),
        canDelete: true,
        isHidden: !!photo.isHidden,
        createdAt: photo.createdAt ? new Date(photo.createdAt).toISOString() : undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching user photos:', error);
  }

  return (
    <main>
      <ProfileClient userPhotos={userPhotos} user={session} />
    </main>
  );
}
