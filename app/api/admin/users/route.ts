import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ message: 'Yetkisiz erişim' }, { status: 403 });
  }

  await dbConnect();

  const users = await User.find({ role: { $ne: 'admin' } }, '_id name username').lean();

  const usersWithStats = users.map((u) => {
    return {
      id: u._id.toString(),
      name: u.name,
      username: u.username,
    };
  });

  return NextResponse.json({ users: usersWithStats });
}
