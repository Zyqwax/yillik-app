import { PrismaClient } from '@prisma/client';
import PhotoDetailClient from './PhotoDetailClient';
import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';

const prisma = new PrismaClient();

export default async function PhotoPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;

  const photo = await prisma.photo.findUnique({
    where: { id },
    include: {
      user: {
        select: { name: true, username: true }
      },
      votes: {
        where: {
          userId: session.userId
        }
      },
      comments: {
        include: {
          user: { select: { name: true, username: true } }
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });

  if (!photo) {
    notFound();
  }

  const formattedPhoto = {
    id: photo.id,
    url: photo.url,
    caption: photo.caption,
    voteCount: photo.voteCount,
    user: photo.user,
    hasVoted: photo.votes.length > 0,
    isOwner: photo.userId === session.userId,
    currentUserId: session.userId,
    comments: photo.comments.map((c: any) => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt.toISOString(),
      user: c.user
    }))
  };

  return (
    <main>
      <PhotoDetailClient initialPhoto={formattedPhoto} />
    </main>
  );
}
