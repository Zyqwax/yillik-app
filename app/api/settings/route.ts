import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Settings from '@/models/Settings';

async function getOrCreateSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({ uploadEnabled: true, deleteEnabled: true });
  }
  return settings;
}

// GET — mevcut ayarları döndür (herkese açık, UI için)
export async function GET() {
  await dbConnect();
  const settings = await getOrCreateSettings();
  return NextResponse.json({
    uploadEnabled: settings.uploadEnabled,
    deleteEnabled: settings.deleteEnabled,
  });
}

// POST — ayarları güncelle (sadece admin)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.username !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 403 });
  }

  const body = await request.json();
  await dbConnect();
  const settings = await getOrCreateSettings();

  if (typeof body.uploadEnabled === 'boolean') {
    settings.uploadEnabled = body.uploadEnabled;
  }
  if (typeof body.deleteEnabled === 'boolean') {
    settings.deleteEnabled = body.deleteEnabled;
  }
  await settings.save();

  return NextResponse.json({
    uploadEnabled: settings.uploadEnabled,
    deleteEnabled: settings.deleteEnabled,
  });
}
