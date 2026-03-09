import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string;

    if (!file) {
      return NextResponse.json({ message: 'Dosya seçilmedi' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || '.jpg';
    const filename = `${Date.now()}-${session.userId}${ext}`;
    
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Directory exists
    }

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const photoUrl = `/uploads/${filename}`;

    const newPhoto = await prisma.photo.create({
      data: {
        url: photoUrl,
        caption: caption || null,
        userId: session.userId,
      },
    });

    return NextResponse.json({ message: 'Yükleme başarılı', photo: newPhoto });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ message: 'Dosya yüklenirken hata oluştu' }, { status: 500 });
  }
}
