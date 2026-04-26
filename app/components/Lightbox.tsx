"use client";

import { useEffect, useState, useCallback } from 'react';
import { CldImage } from 'next-cloudinary';
import styles from './Lightbox.module.css';

type PhotoType = {
  id: string;
  url: string;
  caption: string | null;
  voteCount: number;
  user: { name: string; username: string };
  hasVoted: boolean;
  canDelete: boolean;
  isHidden?: boolean;
};

interface LightboxProps {
  photos: PhotoType[];
  initialIndex: number;
  onClose: () => void;
}

export default function Lightbox({ photos, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }, [photos.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }, [photos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleNext, handlePrev]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const currentPhoto = photos[currentIndex];
  if (!currentPhoto) return null;

  const displayName = currentPhoto.user.name === 'Anonim Kullanıcı' ? 'Anonim' : currentPhoto.user.name;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <button className={styles.closeBtn} onClick={onClose} title="Kapat (Esc)">✕</button>
      
      {photos.length > 1 && (
        <>
          <button 
            className={`${styles.navBtn} ${styles.prevBtn}`} 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            title="Önceki (Sol Ok)"
          >
            ‹
          </button>
          <button 
            className={`${styles.navBtn} ${styles.nextBtn}`} 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            title="Sonraki (Sağ Ok)"
          >
            ›
          </button>
        </>
      )}

      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <div className={styles.imageContainer}>
          <CldImage
            src={currentPhoto.url}
            alt={currentPhoto.caption || 'Fotoğraf'}
            fill
            sizes="100vw"
            className={styles.image}
            style={{ objectFit: 'contain' }}
            format="auto"
            quality="90"
          />
        </div>
        
        <div className={styles.metadata}>
          <div className={styles.uploaderInfo}>
            <div className={styles.avatar}>{displayName.charAt(0).toUpperCase()}</div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{displayName}</span>
              <span className={styles.userHandle}>@{currentPhoto.user.username}</span>
            </div>
          </div>
          
          {currentPhoto.caption && (
            <p className={styles.caption}>{currentPhoto.caption}</p>
          )}

          <div className={styles.stats}>
            <span className={styles.heartIcon}>❤️</span>
            <span className={styles.voteCount}>{currentPhoto.voteCount} Beğeni</span>
          </div>
        </div>
      </div>
    </div>
  );
}
