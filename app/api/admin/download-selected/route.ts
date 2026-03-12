import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  const session = await getSession();
  if (!session || session.username !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    await dbConnect();

    // Sadece seçilmiş fotoğrafları getir
    const selectedPhotos = await Photo.find({ selectedBy: { $ne: null } });
    
    if (selectedPhotos.length === 0) {
      return NextResponse.json({ message: 'Seçilmiş fotoğraf bulunamadı' }, { status: 404 });
    }

    const publicIds = selectedPhotos.map(photo => {
      const urlParts = photo.url.split('/');
      const folderAndFile = urlParts.slice(-2).join('/');
      return folderAndFile.replace(/\.[^/.]+$/, '');
    });

    // Cloudinary üzerinden ZIP indirme URL'si oluştur
    const zipUrl = cloudinary.utils.download_zip_url({
      public_ids: publicIds,
      resource_type: 'image',
      target_public_id: 'yillik_secilen_fotograflar'
    });

    return NextResponse.json({ url: zipUrl, count: selectedPhotos.length });
  } catch (error) {
    console.error('Error generating ZIP:', error);
    return NextResponse.json({ message: 'ZIP oluşturulamadı' }, { status: 500 });
  }
}
