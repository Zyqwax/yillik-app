"use client";

import { useState, useEffect } from 'react';
import styles from './VitrinClient.module.css';
import PhotoCard from './PhotoCard';
import UploadModal from './UploadModal';

type PhotoType = {
  id: string;
  url: string;
  caption: string | null;
  voteCount: number;
  user: { name: string; username: string };
  hasVoted: boolean;
};

interface UserType {
  name: string;
  username: string;
  userId: string;
}

interface UploadResponsePhoto {
  _id: string;
  url: string;
  caption: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function VitrinClient({ initialPhotos, user }: { initialPhotos: PhotoType[], user: UserType }) {
  const [photos, setPhotos] = useState<PhotoType[]>(initialPhotos);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [gridSize, setGridSize] = useState<'large' | 'small'>('large');
  const [sortBy, setSortBy] = useState<'popular' | 'newest'>('popular');

  const fetchPhotos = async (sortMode = sortBy) => {
    try {
      const res = await fetch(`/api/photos?sort=${sortMode}`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const savedSize = localStorage.getItem('gridSize');
    if (savedSize === 'large' || savedSize === 'small') {
      // ESLint uyarısını önlemek için state güncellemesini asenkron yapıyoruz
      queueMicrotask(() => setGridSize(savedSize));
    }

    const savedSort = localStorage.getItem('sortBy') as 'popular' | 'newest';
    if (savedSort === 'popular' || savedSort === 'newest') {
      queueMicrotask(() => {
        setSortBy(savedSort);
        if (savedSort !== 'popular') {
          fetchPhotos(savedSort);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetGridSize = (size: 'large' | 'small') => {
    setGridSize(size);
    localStorage.setItem('gridSize', size);
  };

  const handleSortChange = (newSort: 'popular' | 'newest') => {
    if (newSort === sortBy) return;
    setSortBy(newSort);
    localStorage.setItem('sortBy', newSort);
    fetchPhotos(newSort);
  };

  const handleUploadSuccess = (newPhoto?: UploadResponsePhoto) => {
    if (newPhoto) {
      // API'den gelen veriyi client modeline uygun hale getirelim
      const formattedPhoto: PhotoType = {
        id: newPhoto._id,
        url: newPhoto.url,
        caption: newPhoto.caption,
        voteCount: 0,
        user: { name: user.name, username: user.username },
        hasVoted: false,
      };
      setPhotos(prev => [formattedPhoto, ...prev]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      fetchPhotos();
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoInfo}>
          <div className={styles.logo}>📸 Şamata</div>
          <p className={styles.subtitle}>En İyiler Vitrini • {photos.length} Fotoğraf</p>
        </div>
        
        <div className={styles.actions}>
          <span className={styles.greeting}>Merhaba, <strong>{user.name}</strong></span>
          <button onClick={() => setIsUploadOpen(true)} className={styles.uploadBtn}>
            + Fotoğraf Yükle
          </button>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Çıkış
          </button>
        </div>
      </header>

      <main>
        {photos.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👻</div>
            <p>Sınıfta kimse fotoğraf yüklememiş. İlk sen ol!</p>
          </div>
        ) : (
          <>
            <div className={styles.controlsWrapper}>
              <div className={styles.sortControls}>
                <button 
                  className={`${styles.viewBtn} ${sortBy === 'newest' ? styles.activeViewBtn : ''}`}
                  onClick={() => handleSortChange('newest')}
                >
                  En Yeni
                </button>
                <button 
                  className={`${styles.viewBtn} ${sortBy === 'popular' ? styles.activeViewBtn : ''}`}
                  onClick={() => handleSortChange('popular')}
                >
                  En Beğenilen
                </button>
              </div>

              <div className={styles.viewControls}>
                <button 
                  className={`${styles.viewBtn} ${gridSize === 'large' ? styles.activeViewBtn : ''}`}
                  onClick={() => handleSetGridSize('large')}
                >
                  Büyük
                </button>
                <button 
                  className={`${styles.viewBtn} ${gridSize === 'small' ? styles.activeViewBtn : ''}`}
                  onClick={() => handleSetGridSize('small')}
                >
                  Küçük
                </button>
              </div>
            </div>
            
            <div className={`${styles.grid} ${gridSize === 'small' ? styles.gridSmall : ''}`}>
              {photos.map((photo) => (
                <PhotoCard key={photo.id} photo={photo} />
              ))}
            </div>
          </>
        )}
      </main>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUploadSuccess={handleUploadSuccess} 
      />
    </div>
  );
}
