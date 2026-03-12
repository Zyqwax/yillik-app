import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.username !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 403 });
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'Geçersiz kullanıcı ID' }, { status: 400 });
  }

  const body = await request.json();
  await dbConnect();

  const user = await User.findById(id);
  if (!user) {
    return NextResponse.json({ message: 'Kullanıcı bulunamadı' }, { status: 404 });
  }

  // null ise global kotayı kullan, number ise kişiye özel kota
  if (body.selectionQuota === null || typeof body.selectionQuota === 'number') {
    user.selectionQuota = body.selectionQuota;
  }

  await user.save();

  return NextResponse.json({
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    selectionQuota: user.selectionQuota ?? null,
  });
}
