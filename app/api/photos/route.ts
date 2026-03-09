import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const photos = await prisma.photo.findMany({
      include: {
        user: { select: { name: true, username: true } },
        votes: { where: { userId: session.userId } }
      },
      orderBy: { voteCount: 'desc' }
    });

    const formattedPhotos = photos.map(photo => ({
      id: photo.id,
      url: photo.url,
      caption: photo.caption,
      voteCount: photo.voteCount,
      user: photo.user,
      hasVoted: photo.votes.length > 0
    }));

    return NextResponse.json({ photos: formattedPhotos });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ message: 'Fotoğraflar yüklenemedi' }, { status: 500 });
  }
}
