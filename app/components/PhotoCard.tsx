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
    isAdminFavorite?: boolean;
    isHidden?: boolean;
  };
  onDelete?: (id: string) => void;
  onToggleHide?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
}

export default function PhotoCard({ photo, onDelete, onToggleHide, onToggleFavorite }: PhotoCardProps) {
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

  const handleDelete = async () => {
    if (!confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) return;
    
    try {
      const res = await fetch(`/api/photos/${photo.id}`, {
        method: 'DELETE',
      });
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

  return (
    <div className={styles.card}>
      <div className={styles.imageLink}>
        {photo.isAdminFavorite && (
          <div className={styles.adminBadge}>
            🌟 Admin Seçimi
          </div>
        )}
        <div className={styles.imageWrapper}>
          <CldImage 
            src={photo.url} 
            alt={photo.caption || "Fotoğraf"} 
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={styles.image} 
            style={{ objectFit: 'cover' }}
            format="auto"
            quality="50"
          />
        </div>
      </div>
      
      <div className={styles.content}>
        {photo.caption && <p className={styles.caption}>{photo.caption}</p>}
        
        <div className={styles.actions}>
          <div className={styles.uploaderInfo}>
            <div className={styles.avatar}>
               {photo.user.name === 'Anonim Kullanıcı' ? 'A' : photo.user.name.charAt(0).toUpperCase()}
            </div>
            <span className={styles.uploaderName} title={photo.user.name}>
              {photo.user.name === 'Anonim Kullanıcı' ? 'Anonim' : photo.user.name}
            </span>
          </div>

          <div className={styles.actionButtons}>
            {photo.canDelete && (
              <button 
                className={styles.deleteBtn}
                onClick={handleDelete}
                title="Fotoğrafı Sil"
              >
                🗑️
              </button>
            )}
            {onToggleHide && (
              <button
                className={styles.adminActionBtn}
                onClick={() => onToggleHide(photo.id)}
                title={photo.isHidden ? 'Göster' : 'Gizle'}
              >
                {photo.isHidden ? '👁️‍🗨️' : '👁️'}
              </button>
            )}
            {onToggleFavorite && (
              <button
                className={styles.adminActionBtn}
                onClick={() => onToggleFavorite(photo.id)}
                title={photo.isAdminFavorite ? 'Favoriden Çıkar' : 'Admin Favorisi Yap'}
              >
                {photo.isAdminFavorite ? '❌' : '🌟'}
              </button>
            )}
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
    </div>
  );
}
