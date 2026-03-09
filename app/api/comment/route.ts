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
    const { photoId, text } = await request.json();

    if (!photoId || !text || text.trim() === '') {
      return NextResponse.json({ message: 'Fotoğraf ID ve yorum metni gereklidir.' }, { status: 400 });
    }

    const newComment = await prisma.comment.create({
      data: {
        text: text.trim(),
        userId: session.userId,
        photoId,
      },
      include: {
        user: { select: { name: true, username: true } },
      },
    });

    return NextResponse.json({ message: 'Yorum eklendi', comment: newComment });
  } catch (error) {
    console.error('Comment error:', error);
    return NextResponse.json({ message: 'İşlem sırasında hata oluştu' }, { status: 500 });
  }
}
