import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';
import Settings from '@/models/Settings';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Geçersiz ID' }, { status: 400 });
  }

  try {
    await dbConnect();

    // 1. Ayarları getir, kotayı al
    const settings = await Settings.findOne();
    const selectionQuota = settings?.selectionQuota ?? 5;

    // 2. Fotoğrafı bul
    const photo = await Photo.findById(id);
    if (!photo) {
      return NextResponse.json({ message: 'Fotoğraf bulunamadı' }, { status: 404 });
    }

    // 3. Mevcut kullanıcının seçtiği diğer fotoğrafları say
    const userSelectedCount = await Photo.countDocuments({
      selectedBy: session.userId,
    });

    // 4. İptal işlemi (Zaten kendi seçmişse iptal etmek isteyebilir)
    if (photo.selectedBy?.toString() === session.userId) {
      photo.selectedBy = null;
      await photo.save();
      return NextResponse.json({
        message: 'Seçim iptal edildi',
        selectedBy: null,
        selectedByUsername: null,
      });
    }

    // 5. Başkası seçmiş mi kontrolü
    if (photo.selectedBy && photo.selectedBy.toString() !== session.userId) {
      return NextResponse.json(
        { message: 'Bu fotoğraf başka bir kullanıcı tarafından seçilmiş.' },
        { status: 403 }
      );
    }

    // 6. Kota kontrolü
    if (userSelectedCount >= selectionQuota) {
      return NextResponse.json(
        { message: `Maksimum seçim kotasına (${selectionQuota}) ulaştınız.` },
        { status: 403 }
      );
    }

    // 7. Seçme işlemi
    photo.selectedBy = session.userId;
    await photo.save();

    return NextResponse.json({
      message: 'Fotoğraf seçildi',
      selectedBy: session.userId,
      selectedByUsername: session.username,
    });
  } catch (error) {
    console.error('Photo selection error:', error);
    return NextResponse.json({ message: 'Seçim işlemi başarısız oldu' }, { status: 500 });
  }
}
