"use client";

import { useState, useEffect } from 'react';
import styles from './VitrinClient.module.css';
import PhotoCard from './PhotoCard';
import Link from 'next/link';

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
};

interface UserType {
  name: string;
  username: string;
  userId: string;
}

export default function AdminVitrinClient({
  initialPhotos,
  user,
}: {
  initialPhotos: PhotoType[];
  user: UserType;
}) {
  const [allPhotos, setAllPhotos] = useState<PhotoType[]>(initialPhotos);
  const [filterMode, setFilterMode] = useState<'all' | 'visible' | 'hidden' | 'favorites'>('all');
  const [uploadEnabled, setUploadEnabled] = useState<boolean | null>(null);
  const [deleteEnabled, setDeleteEnabled] = useState<boolean | null>(null);
  const [selectionQuota, setSelectionQuota] = useState<number>(5);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setUploadEnabled(data.uploadEnabled);
        setDeleteEnabled(data.deleteEnabled);
        setSelectionQuota(data.selectionQuota ?? 5);
      })
      .catch(console.error);
  }, []);

  const toggleSetting = async (
    key: 'uploadEnabled' | 'deleteEnabled' | 'selectionQuota',
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
        setSelectionQuota(data.selectionQuota ?? 5);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const filteredPhotos = [...allPhotos]
    .filter((photo) => {
      if (filterMode === 'all') return true;
      if (filterMode === 'visible') return !photo.isHidden;
      if (filterMode === 'hidden') return photo.isHidden;
      if (filterMode === 'favorites') return photo.isAdminFavorite;
      return true;
    })
    .sort((a, b) => {
      if (a.isAdminFavorite && !b.isAdminFavorite) return -1;
      if (!a.isAdminFavorite && b.isAdminFavorite) return 1;
      return 0; // maintain original order, which is by create date descending as queried in backend
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

  const handleToggleFavorite = async (id: string) => {
    try {
      const res = await fetch(`/api/photos/${id}/favorite`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAllPhotos((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, isAdminFavorite: data.isAdminFavorite } : p
          )
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const downloadIndividually = async (favorites: PhotoType[]) => {
    for (let i = 0; i < favorites.length; i++) {
        try {
          const photo = favorites[i];
          const response = await fetch(photo.url);
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = blobUrl;
          // Extract original extension or use jpg
          const extMatch = photo.url.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/);
          const ext = extMatch ? extMatch[1] : 'jpg';
          a.download = `favori_${i + 1}_${photo.id}.${ext}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(blobUrl);
          document.body.removeChild(a);
          // Wait 300ms between downloads to avoid browser block
          await new Promise(r => setTimeout(r, 300));
        } catch (e) {
          console.error('Bireysel indirme hatası:', e);
        }
    }
  };

  const handleDownloadFavorites = async () => {
    const favorites = allPhotos.filter(p => p.isAdminFavorite);
    if (favorites.length === 0) {
      alert('İndirilecek favori fotoğraf bulunamadı.');
      return;
    }
    
    setIsDownloading(true);
    try {
      const res = await fetch('/api/admin/download-favorites');
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          // Open the ZIP download URL
          const a = document.createElement('a');
          a.href = data.url;
          a.download = 'yillik_favori_fotograflar.zip';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          // Fallback to individual
          await downloadIndividually(favorites);
        }
      } else {
        // Fallback to individual
        await downloadIndividually(favorites);
      }
    } catch (error) {
      console.error(error);
      // Fallback
      await downloadIndividually(favorites);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoInfo}>
          <div className={styles.logo}>👑 Admin Paneli</div>
          <p className={styles.subtitle}>Tüm Fotoğraflar Yönetimi</p>
        </div>

        <div className={styles.actions}>
          <span className={styles.greeting}>
            Merhaba, <strong>{user.name}</strong>
          </span>
          <Link href="/" className={styles.uploadBtn} style={{ textDecoration: 'none' }}>
            Ana Sayfaya Dön
          </Link>
        </div>
      </header>

      {/* Site Ayarları */}
      <div
        style={{
          margin: '0 auto 1.5rem',
          maxWidth: '1200px',
          padding: '1rem 1.5rem',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <span style={{ fontWeight: 600, opacity: 0.8, fontSize: '0.9rem' }}>
          ⚙️ Site Ayarları
        </span>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            disabled={settingsLoading || uploadEnabled === null}
            onClick={() => toggleSetting('uploadEnabled', !uploadEnabled)}
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: settingsLoading ? 'wait' : 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              background: uploadEnabled
                ? 'rgba(34,197,94,0.2)'
                : 'rgba(239,68,68,0.2)',
              color: uploadEnabled ? '#4ade80' : '#f87171',
              transition: 'all 0.2s',
            }}
          >
            {uploadEnabled === null
              ? '...'
              : uploadEnabled
              ? '📤 Yükleme: Açık'
              : '📤 Yükleme: Kapalı'}
          </button>

          <button
            disabled={settingsLoading || deleteEnabled === null}
            onClick={() => toggleSetting('deleteEnabled', !deleteEnabled)}
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: settingsLoading ? 'wait' : 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              background: deleteEnabled
                ? 'rgba(34,197,94,0.2)'
                : 'rgba(239,68,68,0.2)',
              color: deleteEnabled ? '#4ade80' : '#f87171',
              transition: 'all 0.2s',
            }}
          >
            {deleteEnabled === null
              ? '...'
              : deleteEnabled
              ? '🗑️ Silme: Açık'
              : '🗑️ Silme: Kapalı'}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '1rem' }}>
             <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
               Seçim Kotası:
             </label>
             <input
               type="number"
               min="1"
               max="50"
               value={selectionQuota}
               onChange={(e) => setSelectionQuota(Number(e.target.value))}
               onBlur={() => toggleSetting('selectionQuota', selectionQuota)}
               disabled={settingsLoading || uploadEnabled === null}
               style={{
                 padding: '0.4rem',
                 borderRadius: '6px',
                 border: '1px solid rgba(255,255,255,0.2)',
                 background: 'rgba(0,0,0,0.2)',
                 color: 'white',
                 width: '60px',
                 textAlign: 'center'
               }}
             />
          </div>

          <button
            disabled={isDownloading || allPhotos.filter(p => p.isAdminFavorite).length === 0}
            onClick={handleDownloadFavorites}
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: (isDownloading || allPhotos.filter(p => p.isAdminFavorite).length === 0) ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              background: 'rgba(59,130,246,0.2)',
              color: '#60a5fa',
              transition: 'all 0.2s',
              marginLeft: 'auto'
            }}
          >
            {isDownloading ? '⏳ İndiriliyor...' : `📥 Favorileri İndir (${allPhotos.filter(p => p.isAdminFavorite).length})`}
          </button>
        </div>
      </div>

      <main>
        <div className={styles.controlsWrapper}>
          <div className={styles.sortControls}>
            <button
              className={`${styles.viewBtn} ${filterMode === 'all' ? styles.activeViewBtn : ''}`}
              onClick={() => setFilterMode('all')}
            >
              Hepsi ({allPhotos.length})
            </button>
            <button
              className={`${styles.viewBtn} ${filterMode === 'visible' ? styles.activeViewBtn : ''}`}
              onClick={() => setFilterMode('visible')}
            >
              Sadece Görünürler ({allPhotos.filter(p => !p.isHidden).length})
            </button>
            <button
              className={`${styles.viewBtn} ${filterMode === 'hidden' ? styles.activeViewBtn : ''}`}
              onClick={() => setFilterMode('hidden')}
            >
              Gizlenenler ({allPhotos.filter(p => p.isHidden).length})
            </button>
            <button
              className={`${styles.viewBtn} ${filterMode === 'favorites' ? styles.activeViewBtn : ''}`}
              onClick={() => setFilterMode('favorites')}
            >
              Sadece Favoriler ({allPhotos.filter(p => p.isAdminFavorite).length})
            </button>
          </div>
        </div>

        <div className={styles.grid}>
          {filteredPhotos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onDelete={handleDeletePhoto}
              onToggleHide={handleToggleHide}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
