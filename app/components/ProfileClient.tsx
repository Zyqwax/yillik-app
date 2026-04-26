"use client";

import { useState, useRef, useEffect } from 'react';
import { VList } from 'virtua';
import styles from './ProfileClient.module.css';
import vitrinStyles from './VitrinClient.module.css';
import PhotoCard from './PhotoCard';
import Lightbox from './Lightbox';

type PhotoType = {
  id: string;
  url: string;
  caption: string | null;
  voteCount: number;
  user: { name: string; username: string };
  hasVoted: boolean;
  canDelete: boolean;

  isHidden?: boolean;
  createdAt?: string;
};

interface UserType {
  name: string;
  username: string;
  userId: string;
  role?: string;
}

function calcCols(width: number): number {
  if (width < 480) return 3;
  if (width < 900) return 4;
  return 5;
}

export default function ProfileClient({ userPhotos, user }: { userPhotos: PhotoType[], user: UserType }) {
  const [photos, setPhotos] = useState<PhotoType[]>(userPhotos);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleDeletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const totalVotes = photos.reduce((acc, p) => acc + p.voteCount, 0);

  const gap = 10;
  const cols = containerWidth > 0 ? calcCols(containerWidth) : 4;
  const cellSize = containerWidth > 0
    ? Math.floor((containerWidth - gap * (cols - 1)) / cols)
    : 0;

  const rows: PhotoType[][] = [];
  for (let i = 0; i < photos.length; i += cols) {
    rows.push(photos.slice(i, i + cols));
  }

  return (
    <div className={vitrinStyles.container}>
      <div className={styles.profileHeader}>
        <div className={styles.avatarLarge}>{user.name.charAt(0).toUpperCase()}</div>
        <div className={styles.profileInfo}>
          <h1 className={styles.name}>{user.name}</h1>
          <p className={styles.username}>@{user.username}</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.statBox}>
            <span className={styles.statNumber}>{photos.length}</span>
            <span className={styles.statLabel}>Fotoğraf</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statNumber}>{totalVotes}</span>
            <span className={styles.statLabel}>Beğeni</span>
          </div>
        </div>
      </div>

      <div className={vitrinStyles.controlsWrapper}>
        <div className={vitrinStyles.sortControls}>
          <h2 className={styles.sectionTitle}>Yüklediğin Fotoğraflar</h2>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className={vitrinStyles.emptyState}>
          <div className={vitrinStyles.emptyIcon}>📷</div>
          <p>Henüz fotoğraf yüklemedin.</p>
        </div>
      ) : (
        <div className={vitrinStyles.galleryMain} ref={wrapperRef}>
          {cellSize > 0 && (
            <VList style={{ height: '100%' }}>
              {rows.map((rowPhotos, rowIdx) => (
                <div
                  key={rowIdx}
                  style={{
                    display: 'flex',
                    gap: `${gap}px`,
                    marginBottom: rowIdx < rows.length - 1 ? `${gap}px` : 0,
                  }}
                >
                  {rowPhotos.map(photo => (
                    <div key={photo.id} style={{ width: cellSize, height: cellSize, flexShrink: 0 }}>
                      <PhotoCard 
                        photo={photo} 
                        onDelete={handleDeletePhoto} 
                        onClick={() => setLightboxIndex(photos.findIndex(p => p.id === photo.id))}
                      />
                    </div>
                  ))}
                  {rowPhotos.length < cols && Array.from({ length: cols - rowPhotos.length }).map((_, i) => (
                    <div key={`ph-${i}`} style={{ width: cellSize, height: cellSize, flexShrink: 0 }} />
                  ))}
                </div>
              ))}
            </VList>
          )}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox 
          photos={photos} 
          initialIndex={lightboxIndex} 
          onClose={() => setLightboxIndex(null)} 
        />
      )}
    </div>
  );
}
