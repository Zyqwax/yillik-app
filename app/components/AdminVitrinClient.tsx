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
  const [filterMode, setFilterMode] = useState<'all' | 'visible' | 'hidden'>('all');
  const [uploadEnabled, setUploadEnabled] = useState<boolean | null>(null);
  const [deleteEnabled, setDeleteEnabled] = useState<boolean | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

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
    current: boolean
  ) => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: !current }),
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

  const filteredPhotos = allPhotos.filter((photo) => {
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
            onClick={() => toggleSetting('uploadEnabled', uploadEnabled!)}
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
            onClick={() => toggleSetting('deleteEnabled', deleteEnabled!)}
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
        </div>
      </div>

      <main>
        <div className={styles.controlsWrapper}>
          <div className={styles.sortControls}>
            <button
              className={`${styles.viewBtn} ${filterMode === 'all' ? styles.activeViewBtn : ''}`}
              onClick={() => setFilterMode('all')}
            >
              Hepsi
            </button>
            <button
              className={`${styles.viewBtn} ${filterMode === 'visible' ? styles.activeViewBtn : ''}`}
              onClick={() => setFilterMode('visible')}
            >
              Sadece Görünürler
            </button>
            <button
              className={`${styles.viewBtn} ${filterMode === 'hidden' ? styles.activeViewBtn : ''}`}
              onClick={() => setFilterMode('hidden')}
            >
              Gizlenenler
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
