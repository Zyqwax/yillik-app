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
}

export default function AdminVitrinClient({
  initialPhotos,
}: {
  initialPhotos: PhotoType[];
  user: UserType;
}) {
  const [allPhotos, setAllPhotos] = useState<PhotoType[]>(initialPhotos);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'visible' | 'hidden'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest'>('popular');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const [uploadEnabled, setUploadEnabled] = useState<boolean | null>(null);
  const [deleteEnabled, setDeleteEnabled] = useState<boolean | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Konteyner genişliği (sanallaştırma için)
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

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setUploadEnabled(data.uploadEnabled);
        setDeleteEnabled(data.deleteEnabled);
      })
      .catch(console.error);
  }, []);

  const toggleSetting = async (
    key: 'uploadEnabled' | 'deleteEnabled',
    value: boolean | number
  ) => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      if (res.ok) {
        const data = await res.json();
        setUploadEnabled(data.uploadEnabled);
        setDeleteEnabled(data.deleteEnabled);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const sortPhotosLocal = useCallback((list: PhotoType[], mode: 'popular' | 'newest', dir: 'asc' | 'desc'): PhotoType[] => {
    return [...list].sort((a, b) => {
      const base = mode === 'popular'
        ? b.voteCount - a.voteCount
        : b.id.localeCompare(a.id);
      return dir === 'asc' ? -base : base;
    });
  }, []);

  const handleSortChange = (newSort: 'popular' | 'newest') => {
    if (newSort === sortBy) return;
    setSortBy(newSort);
    setAllPhotos(prev => sortPhotosLocal(prev, newSort, sortDir));
  };

  const handleSortDirToggle = () => {
    const newDir = sortDir === 'desc' ? 'asc' : 'desc';
    setSortDir(newDir);
    setAllPhotos(prev => sortPhotosLocal(prev, sortBy, newDir));
  };

  const filteredPhotos = allPhotos
    .filter((photo) => {
      if (filterMode === 'all') return true;
      if (filterMode === 'visible') return !photo.isHidden;
      if (filterMode === 'hidden') return photo.isHidden;
      return true;
    });

  const handleDeletePhoto = (id: string) => {
    setAllPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleToggleHide = async (id: string) => {
    try {
      const res = await fetch(`/api/photos/${id}/hide`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAllPhotos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isHidden: data.isHidden } : p))
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const gap = containerWidth < 480 ? 2 : containerWidth < 768 ? 4 : 6;
  const cols = containerWidth > 0 ? (containerWidth < 480 ? 3 : containerWidth < 900 ? 4 : 5) : 4;
  const cellSize = containerWidth > 0
    ? Math.floor((containerWidth - gap * (cols - 1)) / cols)
    : 0;

  const rows: PhotoType[][] = [];
  for (let i = 0; i < filteredPhotos.length; i += cols) {
    rows.push(filteredPhotos.slice(i, i + cols));
  }

  return (
    <div className={styles.container}>
      {/* Ayarlar + İndirme Barı */}
      <div className={styles.settingsBar}>
        <div className={styles.settingsBtns}>
          <button
            disabled={settingsLoading || uploadEnabled === null}
            onClick={() => toggleSetting('uploadEnabled', !uploadEnabled)}
            className={`${styles.settingBtn} ${uploadEnabled ? styles.settingBtnOn : styles.settingBtnOff}`}
          >
            📤 Yükleme: {uploadEnabled === null ? '...' : uploadEnabled ? 'Açık' : 'Kapalı'}
          </button>

          <button
            disabled={settingsLoading || deleteEnabled === null}
            onClick={() => toggleSetting('deleteEnabled', !deleteEnabled)}
            className={`${styles.settingBtn} ${deleteEnabled ? styles.settingBtnOn : styles.settingBtnOff}`}
          >
            🗑️ Silme: {deleteEnabled === null ? '...' : deleteEnabled ? 'Açık' : 'Kapalı'}
          </button>
        </div>
      </div>

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
              <span>
                {filterMode === 'all' ? '👥 Hepsi' : filterMode === 'visible' ? '👁️ Görünür' : '🚫 Gizli'}
              </span>
              <svg className={`${styles.chevron} ${filterOpen ? styles.chevronUp : ''}`} viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {filterOpen && (
              <ul className={styles.dropdownMenu} role="listbox">
                <li
                  className={`${styles.dropdownItem} ${filterMode === 'all' ? styles.dropdownItemActive : ''}`}
                  onClick={() => { setFilterMode('all'); setFilterOpen(false); }}
                >
                  <span className={styles.dropdownItemIcon}>👥</span> Hepsi ({allPhotos.length})
                </li>
                <li
                  className={`${styles.dropdownItem} ${filterMode === 'visible' ? styles.dropdownItemActive : ''}`}
                  onClick={() => { setFilterMode('visible'); setFilterOpen(false); }}
                >
                  <span className={styles.dropdownItemIcon}>👁️</span> Görünür ({allPhotos.filter(p => !p.isHidden).length})
                </li>
                <li
                  className={`${styles.dropdownItem} ${filterMode === 'hidden' ? styles.dropdownItemActive : ''}`}
                  onClick={() => { setFilterMode('hidden'); setFilterOpen(false); }}
                >
                  <span className={styles.dropdownItemIcon}>🚫</span> Gizli ({allPhotos.filter(p => p.isHidden).length})
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
                  onClick={() => { handleSortChange('popular'); setSortOpen(false); }}
                >
                  <span className={styles.dropdownItemIcon}>🔥</span>
                  <span style={{ flex: 1 }}>Beğeni</span>
                  {sortBy === 'popular' && (
                    <button
                      className={styles.dirBtn}
                      onClick={(e) => { e.stopPropagation(); handleSortDirToggle(); }}
                    >
                      {sortDir === 'desc' ? '↓' : '↑'}
                    </button>
                  )}
                </li>
                <li
                  className={`${styles.dropdownItem} ${sortBy === 'newest' ? styles.dropdownItemActive : ''}`}
                  onClick={() => { handleSortChange('newest'); setSortOpen(false); }}
                >
                  <span className={styles.dropdownItemIcon}>✨</span>
                  <span style={{ flex: 1 }}>Tarih</span>
                  {sortBy === 'newest' && (
                    <button
                      className={styles.dirBtn}
                      onClick={(e) => { e.stopPropagation(); handleSortDirToggle(); }}
                    >
                      {sortDir === 'desc' ? '↓' : '↑'}
                    </button>
                  )}
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Galeri Grid — Virtua ile sanallaştırılmış */}
      <div className={styles.galleryMain} ref={wrapperRef}>
        {cellSize > 0 && filteredPhotos.length > 0 && (
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
                      onToggleHide={handleToggleHide}
                      onClick={() => setLightboxIndex(filteredPhotos.findIndex(p => p.id === photo.id))}
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
        {filteredPhotos.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <p>Bu filtrede fotoğraf bulunamadı.</p>
          </div>
        )}
      </div>

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
