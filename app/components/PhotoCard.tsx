"use client";

import { useState } from 'react';
import styles from './PhotoCard.module.css';
import Image from 'next/image';
import Link from 'next/link';

interface PhotoCardProps {
  photo: {
    id: string;
    url: string;
    caption: string | null;
    voteCount: number;
    user: { name: string; username: string };
    hasVoted: boolean;
  };
}

export default function PhotoCard({ photo }: PhotoCardProps) {
  const [voteCount, setVoteCount] = useState(photo.voteCount);
  const [hasVoted, setHasVoted] = useState(photo.hasVoted);
  const [isVoting, setIsVoting] = useState(false);

  const toggleVote = async () => {
    if (isVoting) return;
    setIsVoting(true);

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoId: photo.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setHasVoted(data.voted);
        setVoteCount((prev) => (data.voted ? prev + 1 : prev - 1));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className={styles.card}>
      <Link href={`/photo/${photo.id}`} className={styles.imageLink}>
        <div className={styles.imageWrapper}>
          <Image 
            src={photo.url} 
            alt={photo.caption || "Fotoğraf"} 
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={styles.image} 
            style={{ objectFit: 'cover' }}
          />
        </div>
      </Link>
      
      <div className={styles.content}>
        {photo.caption && <p className={styles.caption}>{photo.caption}</p>}
        
        <div className={styles.actions}>
          <button 
            className={`${styles.voteBtn} ${hasVoted ? styles.voted : ''}`}
            onClick={toggleVote}
            disabled={isVoting}
          >
            <span className={styles.heartIcon}>
              {hasVoted ? '❤️' : '🤍'}
            </span>
            <span className={styles.voteCount}>{voteCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
