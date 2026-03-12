import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(_request: NextRequest) {
  const session = await getSession();
  if (!session || session.username !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    await dbConnect();

    // Sadece admin favorilerini getir
    const favoritePhotos = await Photo.find({ isAdminFavorite: true });
    
    if (favoritePhotos.length === 0) {
      return NextResponse.json({ message: 'Favori fotoğraf bulunamadı' }, { status: 404 });
    }

    const publicIds = favoritePhotos.map(photo => {
      const urlParts = photo.url.split('/');
      const folderAndFile = urlParts.slice(-2).join('/');
      return folderAndFile.replace(/\.[^/.]+$/, '');
    });

    // Cloudinary üzerinden ZIP indirme URL'si oluştur
    const zipUrl = cloudinary.utils.download_zip_url({
      public_ids: publicIds,
      resource_type: 'image',
      target_public_id: 'yillik_favori_fotograflar'
    });

    return NextResponse.json({ url: zipUrl, count: favoritePhotos.length });
  } catch (error) {
    console.error('Error generating ZIP:', error);
    return NextResponse.json({ message: 'ZIP oluşturulamadı' }, { status: 500 });
  }
}
