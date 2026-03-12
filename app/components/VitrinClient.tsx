"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
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
  canDelete: boolean;
  isAdminFavorite?: boolean;
  isHidden?: boolean;
  createdAt?: string;
  selectedBy?: string | null;
  selectedByUsername?: string | null;
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
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [gridSize, setGridSize] = useState<'large' | 'small'>('large');
  const [sortBy, setSortBy] = useState<'popular' | 'newest'>('popular');

  const [allPhotos, setAllPhotos] = useState<PhotoType[]>(initialPhotos);
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoading, setIsLoading] = useState(false);
  const [filterBy, setFilterBy] = useState<'all' | 'myUploads' | 'mySelections'>('all');

  const [selectionCount, setSelectionCount] = useState(0);
  const [selectionQuota, setSelectionQuota] = useState(5);

  const fetchPhotos = async () => {
    setIsLoading(true);
    try {
      // API'den her zaman varsayılan sırayla tüm fotoğrafları çek
      const res = await fetch(`/api/photos?sort=popular`);
      if (res.ok) {
        const data = await res.json();
        // Gelen veriyi current sortBy'a göre sırala
        const sorted = sortPhotosLocal(data.photos, sortBy);
        setAllPhotos(sorted);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const sortPhotosLocal = (photosList: PhotoType[], sortMode: 'popular' | 'newest') => {
    return [...photosList].sort((a, b) => {
      if (a.isAdminFavorite && !b.isAdminFavorite) return -1;
      if (!a.isAdminFavorite && b.isAdminFavorite) return 1;

      if (sortMode === 'popular') {
        return b.voteCount - a.voteCount;
      } else {
        // ID timestamp'ten veya varsa createdAt'ten sırala
        return b.id.localeCompare(a.id);
      }
    });
  };

  const filteredPhotos = allPhotos.filter(p => {
    if (filterBy === 'myUploads') return p.user.username === user.username;
    if (filterBy === 'mySelections') return p.selectedBy === user.userId;
    return true;
  });
  const visiblePhotos = filteredPhotos.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPhotos.length;

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setVisibleCount(prev => prev + 12);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  useEffect(() => {
    // Initial load sort
    if (initialPhotos && initialPhotos.length > 0) {
      setAllPhotos(sortPhotosLocal(initialPhotos, sortBy));
    }

    fetch('/api/user/selection-status')
      .then(res => res.json())
      .then(data => {
        if(data.selectedCount !== undefined) setSelectionCount(data.selectedCount);
        if(data.quota !== undefined) setSelectionQuota(data.quota);
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const savedSize = localStorage.getItem('gridSize');
    if (savedSize === 'large' || savedSize === 'small') {
      // ESLint uyarısını önlemek için state güncellemesini asenkron yapıyoruz
      queueMicrotask(() => setGridSize(savedSize));
    }

    const savedSort = localStorage.getItem('sortBy') as 'popular' | 'newest';
    if (savedSort === 'popular' || savedSort === 'newest') {
      queueMicrotask(() => {
        handleSortChange(savedSort);
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
    setVisibleCount(12);
    localStorage.setItem('sortBy', newSort);
    
    // Yalnızca lokale sıralama yap, API'ye tekrar istek atma
    setAllPhotos(prev => sortPhotosLocal(prev, newSort));
  };

  const handleUploadSuccess = (newPhotos?: UploadResponsePhoto[]) => {
    if (newPhotos && newPhotos.length > 0) {
      const formattedPhotos = newPhotos.map(newPhoto => ({
        id: newPhoto._id,
        url: newPhoto.url,
        caption: newPhoto.caption,
        voteCount: 0,
        user: { name: user.name, username: user.username },
        hasVoted: false,
        canDelete: true,
      }));
      const newAll = [...formattedPhotos, ...allPhotos];
      setAllPhotos(sortPhotosLocal(newAll, sortBy));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      fetchPhotos();
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const handleDeletePhoto = (id: string) => {
    setAllPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleToggleSelection = async (id: string) => {
    try {
      const res = await fetch(`/api/photos/${id}/select`, { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        setAllPhotos(prev => prev.map(p => 
          p.id === id ? { ...p, selectedBy: data.selectedBy, selectedByUsername: data.selectedByUsername } : p
        ));
        
        if (data.selectedBy) {
           setSelectionCount(c => c + 1);
        } else {
           setSelectionCount(c => c - 1);
        }
      } else {
        alert(data.message || 'Bir hata oluştu.');
      }
    } catch (error) {
       console.error(error);
       alert('Ayarlar kaydedilirken bir hata oluştu.');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoInfo}>
          <div className={styles.logo}>📸 Şamata</div>
          <p className={styles.subtitle}>
            En İyiler Vitrini • {allPhotos.length} Fotoğraf • Seçimin: {selectionCount}/{selectionQuota}
          </p>
        </div>
        
        <div className={styles.actions}>
          <span className={styles.greeting}>Merhaba, <strong>{user.name}</strong></span>
          {user.username === 'admin' && (
            <button onClick={() => window.location.href = '/admin'} className={styles.uploadBtn} style={{ background: '#ff9800' }}>
              👑 Admin Paneli
            </button>
          )}
          <button onClick={() => setIsUploadOpen(true)} className={styles.uploadBtn}>
            + Fotoğraf Yükle
          </button>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Çıkış
          </button>
        </div>
      </header>

      <main>
        {allPhotos.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👻</div>
            <p>Sınıfta kimse fotoğraf yüklememiş. İlk sen ol!</p>
          </div>
        ) : (
          <>
            <div className={styles.controlsWrapper}>
              <div className={styles.sortControls}>
                <button 
                  className={`${styles.viewBtn} ${filterBy === 'all' ? styles.activeViewBtn : ''}`}
                  onClick={() => { setFilterBy('all'); setVisibleCount(12); }}
                >
                  Tümü
                </button>
                <button 
                  className={`${styles.viewBtn} ${filterBy === 'myUploads' ? styles.activeViewBtn : ''}`}
                  onClick={() => { setFilterBy('myUploads'); setVisibleCount(12); }}
                >
                  Yüklediklerim
                </button>
                <button 
                  className={`${styles.viewBtn} ${filterBy === 'mySelections' ? styles.activeViewBtn : ''}`}
                  onClick={() => { setFilterBy('mySelections'); setVisibleCount(12); }}
                >
                  Seçtiklerim
                </button>
                <span style={{ width: '1rem' }}></span>
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
              {visiblePhotos.map((photo) => (
                <PhotoCard 
                  key={photo.id} 
                  photo={photo} 
                  onDelete={handleDeletePhoto} 
                  onToggleSelection={handleToggleSelection} 
                  currentUserId={user.userId} 
                />
              ))}
            </div>
            
            {hasMore && (
              <div 
                ref={lastElementRef} 
                style={{ height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', color: '#888' }}
              >
                {isLoading && <span>Yükleniyor...</span>}
              </div>
            )}
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
