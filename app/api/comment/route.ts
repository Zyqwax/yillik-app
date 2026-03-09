import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { photoId, text } = await request.json();

    if (!photoId || !text || text.trim() === '') {
      return NextResponse.json({ message: 'Fotoğraf ID ve yorum metni gereklidir.' }, { status: 400 });
    }

    const comment = await Comment.create({
      text: text.trim(),
      userId: session.userId,
      photoId,
    });

    const populatedComment = await Comment.findById(comment._id).populate('userId', 'name username');

    const formattedComment = {
      id: populatedComment._id.toString(),
      text: populatedComment.text,
      userId: populatedComment.userId._id.toString(),
      photoId: populatedComment.photoId.toString(),
      createdAt: populatedComment.createdAt,
      user: {
        name: populatedComment.userId.name,
        username: populatedComment.userId.username
      }
    };

    return NextResponse.json({ message: 'Yorum eklendi', comment: formattedComment });
  } catch (error) {
    console.error('Comment error:', error);
    return NextResponse.json({ message: 'İşlem sırasında hata oluştu' }, { status: 500 });
  }
}
