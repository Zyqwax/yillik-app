import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const { photoId } = await request.json();

    if (!photoId) {
      return NextResponse.json({ message: 'Fotoğraf ID gereklidir.' }, { status: 400 });
    }

    const userId = session.userId;

    // Check if vote already exists
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_photoId: {
          userId,
          photoId,
        },
      },
    });

    if (existingVote) {
      // Remove vote (toggle off)
      await prisma.$transaction([
        prisma.vote.delete({
          where: { id: existingVote.id },
        }),
        prisma.photo.update({
          where: { id: photoId },
          data: { voteCount: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({ message: 'Oy geri alındı', voted: false });
    } else {
      // Add vote (toggle on)
      await prisma.$transaction([
        prisma.vote.create({
          data: { userId, photoId },
        }),
        prisma.photo.update({
          where: { id: photoId },
          data: { voteCount: { increment: 1 } },
        }),
      ]);
      return NextResponse.json({ message: 'Oy verildi', voted: true });
    }
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ message: 'İşlem sırasında hata oluştu' }, { status: 500 });
  }
}
