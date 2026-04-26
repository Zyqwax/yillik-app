import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
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
    
    const query = session.role === 'admin' ? {} : { isHidden: { $ne: true } };

    const photos = (await Photo.find(query)
      .populate('userId', 'name username')
      .sort(sortQuery)
      .lean()) as LeanPhoto[];

    const userVotes = await Vote.find({ userId: session.userId }).select('photoId').lean();
    const userVotedPhotoIds = new Set(userVotes.map(v => v.photoId.toString()));

    const formattedPhotos = photos.map((photo) => {
      return {
        id: String(photo._id),
        url: photo.url,
        caption: photo.caption ?? null,
        voteCount: photo.voteCount,
        user: photo.isAnonymous
          ? { name: 'Anonim Kullanıcı', username: 'anonim' }
          : { name: photo.userId.name, username: photo.userId.username },
        hasVoted: userVotedPhotoIds.has(String(photo._id)),
        isHidden: !!photo.isHidden,
      };
    });

    return NextResponse.json({ photos: formattedPhotos });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ message: 'Fotoğraflar yüklenemedi' }, { status: 500 });
  }
}
