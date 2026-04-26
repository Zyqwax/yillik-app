"use client";

import { useState } from 'react';
import styles from './PhotoCard.module.css';
import { CldImage } from 'next-cloudinary';

interface PhotoCardProps {
  photo: {
    id: string;
    url: string;
    caption: string | null;
    voteCount: number;
    user: { name: string; username: string };
    hasVoted: boolean;
    canDelete: boolean;

    isHidden?: boolean;
  };
  onDelete?: (id: string) => void;
  onToggleHide?: (id: string) => void;
  onClick?: () => void;
}

export default function PhotoCard({ photo, onDelete, onToggleHide, onClick }: PhotoCardProps) {
  const [voteCount, setVoteCount] = useState(photo.voteCount);
  const [hasVoted, setHasVoted] = useState(photo.hasVoted);
  const [isVoting, setIsVoting] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const toggleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVoting) return;
    setIsVoting(true);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/photos/${photo.id}`, { method: 'DELETE' });
      if (res.ok) {
        if (onDelete) onDelete(photo.id);
      } else {
        alert('Fotoğraf silinirken bir hata oluştu.');
      }
    } catch (error) {
      console.error(error);
      alert('Fotoğraf silinirken bir hata oluştu.');
    }
  };

  const displayName = photo.user.name === 'Anonim Kullanıcı' ? 'Anonim' : photo.user.name;
  const avatarLetter = photo.user.name === 'Anonim Kullanıcı' ? 'A' : photo.user.name.charAt(0).toUpperCase();
  const isAdmin = !!(onToggleHide || photo.canDelete);

  return (
    <div 
      className={`${styles.card} ${!isImageLoaded ? styles.skeletonPulse : ''}`}
      onClick={onClick}
    >
      {/* Fotoğraf */}
      <div className={styles.imageWrapper}>
        <CldImage
          src={photo.url}
          alt={photo.caption || 'Fotoğraf'}
          width={300}
          height={300}
          crop="fill"
          gravity="auto"
          className={styles.image}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          format="auto"
          quality="auto:eco"
          onLoad={() => setIsImageLoaded(true)}
        />
      </div>



      {/* Admin butonları (üst sağ) */}
      {isAdmin && (
        <div className={styles.adminStrip}>
          {photo.canDelete && (
            <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={handleDelete} title="Sil">
              🗑️
            </button>
          )}

          {onToggleHide && (
            <button 
              className={styles.iconBtn} 
              onClick={(e) => { e.stopPropagation(); onToggleHide(photo.id); }} 
              title={photo.isHidden ? 'Göster' : 'Gizle'}
            >
              {photo.isHidden ? '👁️' : '🫣'}
            </button>
          )}
        </div>
      )}

      {/* Gizli rozeti */}
      {photo.isHidden && !isAdmin && (
        <div className={styles.hiddenBadge}>Gizli</div>
      )}

      {/* Alt bilgi şeridi */}
      <div className={styles.strip}>
        <div className={styles.uploaderRow}>
          <div className={styles.avatar}>{avatarLetter}</div>
          <span className={styles.uploaderName}>{displayName}</span>
        </div>

        <button
          className={`${styles.voteBtn} ${hasVoted ? styles.voted : ''}`}
          onClick={toggleVote}
          disabled={isVoting}
        >
          <span className={styles.heartIcon}>{hasVoted ? '❤️' : '🤍'}</span>
          <span className={styles.voteCount}>{voteCount}</span>
        </button>
      </div>
    </div>
  );
}
