"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { VList } from 'virtua';
import styles from './VitrinClient.module.css';
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

/** Ekran genişliğine göre sütun sayısını hesapla */
function calcCols(gridSize: 'large' | 'small', width: number): number {
  if (gridSize === 'small') {
    if (width < 480) return 4;
    if (width < 768) return 5;
    return 6;
  }
  if (width < 480) return 3;
  if (width < 900) return 3;
  return 4;
}

export default function VitrinClient({ initialPhotos, user }: { initialPhotos: PhotoType[], user: UserType }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [gridSize, setGridSize] = useState<'large' | 'small'>('large');
  const [sortBy, setSortBy] = useState<'popular' | 'newest'>('popular');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [allPhotos, setAllPhotos] = useState<PhotoType[]>(initialPhotos);
  const [filterBy, setFilterBy] = useState<'all' | 'myUploads'>('all');

  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Konteyner genişliği — kare hücre boyutu için
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ─── Sıralama ──────────────────────────────────────────
  const sortPhotosLocal = useCallback((list: PhotoType[], mode: 'popular' | 'newest', dir: 'asc' | 'desc'): PhotoType[] => {
    return [...list].sort((a, b) => {
      const base = mode === 'popular'
        ? b.voteCount - a.voteCount
        : b.id.localeCompare(a.id);
      return dir === 'asc' ? -base : base;
    });
  }, []);

  useEffect(() => {
    if (initialPhotos.length > 0) setAllPhotos(sortPhotosLocal(initialPhotos, sortBy, sortDir));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const savedSize = localStorage.getItem('gridSize');
    if (savedSize === 'large' || savedSize === 'small') setGridSize(savedSize);
    const savedSort = localStorage.getItem('sortBy') as 'popular' | 'newest';
    const savedDir = localStorage.getItem('sortDir') as 'asc' | 'desc';
    const dir = savedDir === 'asc' || savedDir === 'desc' ? savedDir : 'desc';
    if (savedSort === 'popular' || savedSort === 'newest') {
      setSortBy(savedSort);
      setSortDir(dir);
      setAllPhotos(prev => sortPhotosLocal(prev, savedSort, dir));
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
    setAllPhotos(prev => sortPhotosLocal(prev, newSort, sortDir));
  };

  const handleSortDirToggle = () => {
    const newDir = sortDir === 'desc' ? 'asc' : 'desc';
    setSortDir(newDir);
    localStorage.setItem('sortDir', newDir);
    setAllPhotos(prev => sortPhotosLocal(prev, sortBy, newDir));
  };


  const handleDeletePhoto = (id: string) => {
    setAllPhotos(prev => prev.filter(p => p.id !== id));
  };

  // ─── Grid hesaplamaları ─────────────────────────────────
  const filteredPhotos = allPhotos.filter(p =>
    filterBy === 'myUploads' ? p.user.username === user.username : true
  );

  const gap = containerWidth < 480 ? 2 : containerWidth < 768 ? 4 : 16;
  const cols = containerWidth > 0 ? calcCols(gridSize, containerWidth) : 4;
  const cellSize = containerWidth > 0
    ? Math.floor((containerWidth - gap * (cols - 1)) / cols)
    : 0;

  // Fotoğrafları satırlara böl
  const rows: PhotoType[][] = [];
  for (let i = 0; i < filteredPhotos.length; i += cols) {
    rows.push(filteredPhotos.slice(i, i + cols));
  }

  return (
    <div className={styles.container}>
      {/* Sticky Kontrol Barı */}
      <div className={styles.controlsWrapper}>
        <div className={styles.sortControls}>

          {/* Filtre Dropdown */}
          <div className={styles.dropdown} ref={filterRef}>
            <button
              className={styles.dropdownTrigger}
              onClick={() => { setFilterOpen(o => !o); setSortOpen(false); }}
              aria-haspopup="listbox"
              aria-expanded={filterOpen}
            >
              <span>{filterBy === 'all' ? '👥 Tümü' : '🙋 Yüklediklerim'}</span>
              <svg className={`${styles.chevron} ${filterOpen ? styles.chevronUp : ''}`} viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {filterOpen && (
              <ul className={styles.dropdownMenu} role="listbox">
                <li
                  className={`${styles.dropdownItem} ${filterBy === 'all' ? styles.dropdownItemActive : ''}`}
                  role="option"
                  aria-selected={filterBy === 'all'}
                  onClick={() => { setFilterBy('all'); setFilterOpen(false); }}
                >
                  <span className={styles.dropdownItemIcon}>👥</span> Tümü
                </li>
                <li
                  className={`${styles.dropdownItem} ${filterBy === 'myUploads' ? styles.dropdownItemActive : ''}`}
                  role="option"
                  aria-selected={filterBy === 'myUploads'}
                  onClick={() => { setFilterBy('myUploads'); setFilterOpen(false); }}
                >
                  <span className={styles.dropdownItemIcon}>🙋</span> Yüklediklerim
                </li>
              </ul>
            )}
          </div>

          {/* Sıralama Dropdown */}
          <div className={styles.dropdown} ref={sortRef}>
            <button
              className={styles.dropdownTrigger}
              onClick={() => { setSortOpen(o => !o); setFilterOpen(false); }}
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
            >
              <span>{sortBy === 'popular' ? '🔥 Beğeni' : '✨ Tarih'} {sortDir === 'desc' ? '↓' : '↑'}</span>
              <svg className={`${styles.chevron} ${sortOpen ? styles.chevronUp : ''}`} viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {sortOpen && (
              <ul className={styles.dropdownMenu} role="listbox">
                <li
                  className={`${styles.dropdownItem} ${sortBy === 'popular' ? styles.dropdownItemActive : ''}`}
                  role="option"
                  aria-selected={sortBy === 'popular'}
                  onClick={() => { handleSortChange('popular'); setSortOpen(false); }}
                >
                  <span className={styles.dropdownItemIcon}>🔥</span>
                  <span style={{ flex: 1 }}>Beğeni</span>
                  {sortBy === 'popular' && (
                    <button
                      className={styles.dirBtn}
                      onClick={(e) => { e.stopPropagation(); handleSortDirToggle(); }}
                      title={sortDir === 'desc' ? 'Artana çevir' : 'Azalana çevir'}
                    >
                      {sortDir === 'desc' ? '↓' : '↑'}
                    </button>
                  )}
                </li>
                <li
                  className={`${styles.dropdownItem} ${sortBy === 'newest' ? styles.dropdownItemActive : ''}`}
                  role="option"
                  aria-selected={sortBy === 'newest'}
                  onClick={() => { handleSortChange('newest'); setSortOpen(false); }}
                >
                  <span className={styles.dropdownItemIcon}>✨</span>
                  <span style={{ flex: 1 }}>Tarih</span>
                  {sortBy === 'newest' && (
                    <button
                      className={styles.dirBtn}
                      onClick={(e) => { e.stopPropagation(); handleSortDirToggle(); }}
                      title={sortDir === 'desc' ? 'Artana çevir' : 'Azalana çevir'}
                    >
                      {sortDir === 'desc' ? '↓' : '↑'}
                    </button>
                  )}
                </li>
              </ul>
            )}
          </div>

        </div>
        <div className={styles.viewControls}>
          <div className={styles.gridToggle}>
            <button
              className={`${styles.gridToggleBtn} ${gridSize === 'large' ? styles.gridToggleBtnActive : ''}`}
              onClick={() => handleSetGridSize('large')}
              title="Normal görünüm"
              aria-pressed={gridSize === 'large'}
            >
              {/* 4 kare - büyük grid */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1.2" fill="currentColor"/>
                <rect x="9" y="1" width="6" height="6" rx="1.2" fill="currentColor"/>
                <rect x="1" y="9" width="6" height="6" rx="1.2" fill="currentColor"/>
                <rect x="9" y="9" width="6" height="6" rx="1.2" fill="currentColor"/>
              </svg>
            </button>
            <button
              className={`${styles.gridToggleBtn} ${gridSize === 'small' ? styles.gridToggleBtnActive : ''}`}
              onClick={() => handleSetGridSize('small')}
              title="Sıkışık görünüm"
              aria-pressed={gridSize === 'small'}
            >
              {/* 9 kare - küçük grid */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="3.5" height="3.5" rx="0.7" fill="currentColor"/>
                <rect x="6.25" y="1" width="3.5" height="3.5" rx="0.7" fill="currentColor"/>
                <rect x="11.5" y="1" width="3.5" height="3.5" rx="0.7" fill="currentColor"/>
                <rect x="1" y="6.25" width="3.5" height="3.5" rx="0.7" fill="currentColor"/>
                <rect x="6.25" y="6.25" width="3.5" height="3.5" rx="0.7" fill="currentColor"/>
                <rect x="11.5" y="6.25" width="3.5" height="3.5" rx="0.7" fill="currentColor"/>
                <rect x="1" y="11.5" width="3.5" height="3.5" rx="0.7" fill="currentColor"/>
                <rect x="6.25" y="11.5" width="3.5" height="3.5" rx="0.7" fill="currentColor"/>
                <rect x="11.5" y="11.5" width="3.5" height="3.5" rx="0.7" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

      </div>

      {/* Galeri */}
      {filteredPhotos.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📷</div>
          <p>Henüz fotoğraf yüklenmemiş. İlk sen ol!</p>
        </div>
      ) : (
        <div className={styles.galleryMain} ref={wrapperRef}>
          {/* cellSize 0 ise henüz ölçüm yapılmadı, render etme */}
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
                        onClick={() => setLightboxIndex(filteredPhotos.findIndex(p => p.id === photo.id))}
                      />
                    </div>
                  ))}
                  {/* Son satırda eksik hücreleri doldur */}
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
          photos={filteredPhotos} 
          initialIndex={lightboxIndex} 
          onClose={() => setLightboxIndex(null)} 
        />
      )}

    </div>
  );
}
