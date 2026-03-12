import AdminVitrinClient from '../components/AdminVitrinClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';
import Vote from '@/models/Vote';
import '@/models/User';

export default async function AdminPage() {
  const session = await getSession();
  
  if (!session || session.username !== 'admin') {
    redirect('/');
  }

  await dbConnect();

  let formattedPhotos = [];
  try {
    const photos = await Photo.find({})
      .populate<{ userId: { name: string, username: string, _id: unknown } }>('userId', 'name username')
      .sort({ createdAt: -1 });

    formattedPhotos = await Promise.all(photos.map(async (photo) => {
      const vote = await Vote.findOne({
        userId: session.userId,
        photoId: photo._id
      });

      return {
        id: (photo._id as string).toString(),
        url: photo.url,
        caption: photo.caption,
        voteCount: photo.voteCount,
        user: photo.isAnonymous
          ? { name: 'Anonim Kullanıcı', username: 'anonim' }
          : {
              name: photo.userId.name,
              username: photo.userId.username
            },
        hasVoted: !!vote,
        canDelete: true,
        isAdminFavorite: !!photo.isAdminFavorite,
        isHidden: !!photo.isHidden
      };
    }));
  } catch (error) {
    console.error('Error fetching admin photos:', error);
    return (
      <main>
        <div className="p-8 text-center text-red-500">Fotoğraflar yüklenirken bir hata oluştu.</div>
      </main>
    );
  }

  return (
    <main>
      <AdminVitrinClient initialPhotos={formattedPhotos} user={session} />
    </main>
  );
}
