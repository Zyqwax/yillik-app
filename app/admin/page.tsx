import AdminVitrinClient from '../components/AdminVitrinClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';
import Vote from '@/models/Vote';
import User from '@/models/User';

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
      .populate('selectedBy', 'username')
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
        isHidden: !!photo.isHidden,
        selectedBy: photo.selectedBy ? (photo.selectedBy as unknown as { _id: string })._id?.toString() : null,
        selectedByUsername: photo.selectedBy ? (photo.selectedBy as unknown as { username: string }).username : null,
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

  type UserSelectionCount = {
    id: string;
    name: string;
    username: string;
    count: number;
  };
  let userSelectionCounts: UserSelectionCount[] = [];
  let totalSelections = 0;

  try {
    const users = await User.find({ username: { $ne: 'admin' } }, '_id name username');
    userSelectionCounts = await Promise.all(
      users.map(async (u) => {
        const count = await Photo.countDocuments({ selectedBy: u._id });
        return {
          id: u._id.toString(),
          name: u.name,
          username: u.username,
          count
        };
      })
    );
    totalSelections = userSelectionCounts.reduce((acc, curr) => acc + curr.count, 0);
  } catch (error) {
    console.error('Error fetching user selection counts:', error);
  }

  return (
    <main>
      <AdminVitrinClient 
        initialPhotos={formattedPhotos} 
        user={session} 
        userSelectionCounts={userSelectionCounts}
        totalSelections={totalSelections}
      />
    </main>
  );
}
