import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Photo from '@/models/Photo';
import Settings from '@/models/Settings';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    await dbConnect();

    const [settings, selectedCount] = await Promise.all([
      Settings.findOne(),
      Photo.countDocuments({ selectedBy: session.userId }),
    ]);

    const selectionQuota = settings?.selectionQuota ?? 5;

    return NextResponse.json({
      selectedCount,
      quota: selectionQuota,
    });
  } catch (error) {
    console.error('Selection status fetch error:', error);
    return NextResponse.json({ message: 'Durum alınamadı' }, { status: 500 });
  }
}
