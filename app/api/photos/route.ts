import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';
import Vote from '@/models/Vote';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sortParam = searchParams.get('sort') || 'popular';
  
  // Eğer voteCount ve createdAt eşitse diye MongoDB sıralamasında her zaman ikincil bir kriter (örn _id) yararlı olabilir, 
  // ama şu anki yapıya uygun basit tutuyoruz.
  const sortQuery: Record<string, 1 | -1> = sortParam === 'newest' ? { createdAt: -1 } : { voteCount: -1 };

  try {
    await dbConnect();
    
    const query = session.username === 'admin' ? {} : { isHidden: { $ne: true } };

    const photos = await Photo.find(query)
      .populate<{ userId: { name: string, username: string }, selectedBy?: { name: string, username: string } }>('userId', 'name username')
      .populate('selectedBy', 'name username')
      .sort(sortQuery);

    const formattedPhotos = await Promise.all(photos.map(async (photo) => {
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
          : { name: photo.userId.name, username: photo.userId.username },
        hasVoted: !!vote,
        isAdminFavorite: !!photo.isAdminFavorite,
        isHidden: !!photo.isHidden,
        selectedBy: photo.selectedBy ? (photo.selectedBy as unknown as { _id: string })._id?.toString() : null,
        selectedByUsername: photo.selectedBy ? (photo.selectedBy as unknown as { username: string }).username : null,
      };
    }));

    return NextResponse.json({ photos: formattedPhotos });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ message: 'Fotoğraflar yüklenemedi' }, { status: 500 });
  }
}
