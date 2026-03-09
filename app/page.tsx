import { PrismaClient } from '@prisma/client';
import VitrinClient from './components/VitrinClient';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export default async function Home() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const photos = await prisma.photo.findMany({
    include: {
      user: {
        select: { name: true, username: true }
      },
      votes: {
        where: {
          userId: session.userId
        }
      }
    },
    orderBy: {
      voteCount: 'desc'
    }
  });

  const formattedPhotos = photos.map(photo => ({
    id: photo.id,
    url: photo.url,
    caption: photo.caption,
    voteCount: photo.voteCount,
    user: photo.user,
    hasVoted: photo.votes.length > 0
  }));

  return (
    <main>
      <VitrinClient initialPhotos={formattedPhotos} user={session} />
    </main>
  );
}
