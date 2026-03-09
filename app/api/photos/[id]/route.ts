import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
  }

  const { id } = await params;

  const photo = await prisma.photo.findUnique({ where: { id } });

  if (!photo) {
    return NextResponse.json({ message: 'Fotoğraf bulunamadı' }, { status: 404 });
  }

  if (photo.userId !== session.userId) {
    return NextResponse.json({ message: 'Bu fotoğrafı silme yetkiniz yok' }, { status: 403 });
  }

  // Delete file from disk
  try {
    const filePath = path.join(process.cwd(), 'public', photo.url);
    await fs.unlink(filePath);
  } catch (e) {
    // File may already be gone, ignore
  }

  // Delete from DB (votes and comments cascade delete)
  await prisma.photo.delete({ where: { id } });

  return NextResponse.json({ message: 'Fotoğraf silindi' });
}
