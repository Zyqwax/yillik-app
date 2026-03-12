import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.username !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Geçersiz ID' }, { status: 400 });
  }

  try {
    await dbConnect();

    const photo = await Photo.findById(id);
    if (!photo) {
      return NextResponse.json({ message: 'Fotoğraf bulunamadı' }, { status: 404 });
    }

    photo.selectedBy = null;
    await photo.save();

    return NextResponse.json({
      message: 'Seçim başarıyla kaldırıldı',
      selectedBy: null,
      selectedByUsername: null,
    });
  } catch (error) {
    console.error('Photo selection clear error:', error);
    return NextResponse.json({ message: 'Seçim kaldırma işlemi başarısız oldu' }, { status: 500 });
  }
}
