import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const session = await getSession();
  
  if (!session || session.username !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 403 });
  }

  try {
    await dbConnect();
    
    const photo = await Photo.findById(resolvedParams.id);
    
    if (!photo) {
      return NextResponse.json({ message: 'Fotoğraf bulunamadı' }, { status: 404 });
    }

    photo.isAdminFavorite = !photo.isAdminFavorite;
    await photo.save();

    return NextResponse.json({ 
      message: 'Fotoğraf durumu güncellendi', 
      isAdminFavorite: photo.isAdminFavorite 
    });
  } catch (error) {
    console.error('Favori ekleme hatası:', error);
    return NextResponse.json({ message: 'Bir hata oluştu' }, { status: 500 });
  }
}
