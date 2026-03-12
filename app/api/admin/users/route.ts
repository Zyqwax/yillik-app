import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Photo from '@/models/Photo';
import Settings from '@/models/Settings';

export async function GET() {
  const session = await getSession();
  if (!session || session.username !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 403 });
  }

  await dbConnect();

  const settings = await Settings.findOne();
  const globalQuota = settings?.selectionQuota ?? 5;

  const users = await User.find({ username: { $ne: 'admin' } }, '_id name username selectionQuota');

  const usersWithStats = await Promise.all(users.map(async (u) => {
    const selectedCount = await Photo.countDocuments({ selectedBy: u._id });
    return {
      id: u._id.toString(),
      name: u.name,
      username: u.username,
      selectionQuota: u.selectionQuota ?? null,
      effectiveQuota: u.selectionQuota ?? globalQuota,
      selectedCount,
    };
  }));

  return NextResponse.json({ users: usersWithStats, globalQuota });
}
