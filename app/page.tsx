import VitrinClient from './components/VitrinClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';
import Vote from '@/models/Vote';
import '@/models/User'; // Ensure User model is registered

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

export default async function Home() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  await dbConnect();

  let formattedPhotos = [];
  try {
    const photos = (await Photo.find({ isHidden: { $ne: true } })
      .populate('userId', 'name username')
      .sort({ voteCount: -1 })
      .lean()) as LeanPhoto[];

    const userVotes = await Vote.find({ userId: session.userId }).select('photoId').lean();
    const userVotedPhotoIds = new Set(userVotes.map(v => v.photoId.toString()));

    formattedPhotos = photos.map((photo) => {
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
        canDelete: session.userId === String(photo.userId._id) || session.role === 'admin',
        isHidden: !!photo.isHidden,
      };
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return (
      <main>
        <div className="p-8 text-center text-red-500">Fotoğraflar yüklenirken bir hata oluştu. </div>
      </main>
    );
  }

  return (
    <main>
      <VitrinClient initialPhotos={formattedPhotos} user={session} />
    </main>
  );
}
