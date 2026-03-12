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
    selectedBy?: string | null;
    selectedByUsername?: string | null;
  };
  onDelete?: (id: string) => void;
  onToggleHide?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onToggleSelection?: (id: string) => void;
  currentUserId?: string;
}

export default function PhotoCard({ photo, onDelete, onToggleHide, onToggleFavorite, onToggleSelection, currentUserId }: PhotoCardProps) {
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

  const isSelectedByMe = photo.selectedBy === currentUserId;
  const isSelectedByOther = photo.selectedBy && photo.selectedBy !== currentUserId;

  const cardStyle = isSelectedByMe 
    ? { border: '2px solid #4ade80', background: 'rgba(74, 222, 128, 0.1)' } 
    : isSelectedByOther 
    ? { border: '2px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)', opacity: 0.8 } 
    : {};

  return (
    <div className={styles.card} style={cardStyle}>
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
        {photo.isAdminFavorite && (
          <div className={styles.adminBadge}>
            🌟
          </div>
        )}
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
                style={{ 
                  background: photo.isAdminFavorite ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
                  borderColor: photo.isAdminFavorite ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 152, 0, 0.2)'
                }}
              >
                {photo.isAdminFavorite ? '🌟' : '⭐'}
              </button>
            )}
            
            {onToggleSelection && (
              <button
                className={styles.adminActionBtn}
                onClick={() => onToggleSelection(photo.id)}
                disabled={!!isSelectedByOther}
                title={isSelectedByOther ? `Başkası Seçti (${photo.selectedByUsername})` : isSelectedByMe ? 'Seçimi İptal Et' : 'Fotoğrafı Seç'}
                style={{ 
                  background: isSelectedByMe ? 'rgba(74, 222, 128, 0.2)' : isSelectedByOther ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                  borderColor: isSelectedByMe ? 'rgba(74, 222, 128, 0.4)' : isSelectedByOther ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  color: isSelectedByMe ? '#4ade80' : isSelectedByOther ? '#ef4444' : '#60a5fa',
                  cursor: isSelectedByOther ? 'not-allowed' : 'pointer'
                }}
              >
                {isSelectedByMe ? '✅' : isSelectedByOther ? '🔒' : '📌'}
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
