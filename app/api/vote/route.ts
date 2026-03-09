import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';
import Vote from '@/models/Vote';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { photoId } = await request.json();

    if (!photoId) {
      return NextResponse.json({ message: 'Fotoğraf ID gereklidir.' }, { status: 400 });
    }

    const userId = session.userId;

    // Check if vote already exists
    const existingVote = await Vote.findOne({ userId, photoId });

    if (existingVote) {
      // Remove vote (toggle off)
      await Vote.deleteOne({ _id: existingVote._id });
      await Photo.findByIdAndUpdate(photoId, { $inc: { voteCount: -1 } });
      
      return NextResponse.json({ message: 'Oy geri alındı', voted: false });
    } else {
      // Add vote (toggle on)
      await Vote.create({ userId, photoId });
      await Photo.findByIdAndUpdate(photoId, { $inc: { voteCount: 1 } });
      
      return NextResponse.json({ message: 'Oy verildi', voted: true });
    }
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ message: 'İşlem sırasında hata oluştu' }, { status: 500 });
  }
}
