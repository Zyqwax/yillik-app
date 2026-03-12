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
  selectedBy?: string | null;
  selectedByUsername?: string | null;
};

interface UserType {
  name: string;
  username: string;
  userId: string;
}

export default function AdminVitrinClient({
  initialPhotos,
  user,
  userSelectionCounts = [],
  totalSelections = 0,
}: {
  initialPhotos: PhotoType[];
  user: UserType;
  userSelectionCounts?: { id: string; name: string; username: string; count: number }[];
  totalSelections?: number;
}) {
  const [allPhotos, setAllPhotos] = useState<PhotoType[]>(initialPhotos);
  const [filterMode, setFilterMode] = useState<'all' | 'visible' | 'hidden' | 'favorites' | 'selected'>('all');
  const [sortMode, setSortMode] = useState<'newest' | 'popular'>('newest');
  const [uploadEnabled, setUploadEnabled] = useState<boolean | null>(null);
  const [deleteEnabled, setDeleteEnabled] = useState<boolean | null>(null);
  const [selectionQuota, setSelectionQuota] = useState<number>(5);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingSelected, setIsDownloadingSelected] = useState(false);

  type UserStat = {
    id: string;
    name: string;
    username: string;
    selectionQuota: number | null;
    effectiveQuota: number;
    selectedCount: number;
    editingQuota?: number | string;
  };
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [globalQuota, setGlobalQuota] = useState<number>(5);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setUploadEnabled(data.uploadEnabled);
        setDeleteEnabled(data.deleteEnabled);
        setSelectionQuota(data.selectionQuota ?? 5);
        setGlobalQuota(data.selectionQuota ?? 5);
      })
      .catch(console.error);

    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => {
        setUserStats(data.users ?? []);
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
        const newGlobal = data.selectionQuota ?? 5;
        setGlobalQuota(newGlobal);
        // Refresh effective quotas for users without override
        setUserStats(prev => prev.map(u => ({
          ...u,
          effectiveQuota: u.selectionQuota ?? newGlobal,
        })));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUserQuotaSave = async (userId: string, quota: number | null) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectionQuota: quota }),
      });
      if (res.ok) {
        setUserStats(prev => prev.map(u =>
          u.id === userId
            ? { ...u, selectionQuota: quota, effectiveQuota: quota ?? globalQuota, editingQuota: undefined }
            : u
        ));
      } else {
        alert('Kota kaydedilemedi.');
      }
    } catch {
      alert('Kota kaydedilirken hata oluştu.');
    }
  };

  const filteredPhotos = [...allPhotos]
    .filter((photo) => {
      if (filterMode === 'all') return true;
      if (filterMode === 'visible') return !photo.isHidden;
      if (filterMode === 'hidden') return photo.isHidden;
      if (filterMode === 'favorites') return photo.isAdminFavorite;
      if (filterMode === 'selected') return !!photo.selectedBy;
      return true;
    })
    .sort((a, b) => {
      if (a.isAdminFavorite && !b.isAdminFavorite) return -1;
      if (!a.isAdminFavorite && b.isAdminFavorite) return 1;

      if (sortMode === 'popular') {
        return b.voteCount - a.voteCount;
      } else {
        return b.id.localeCompare(a.id);
      }
    });

  const handleDeletePhoto = (id: string) => {
    setAllPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearSelection = async (id: string) => {
    try {
      const res = await fetch(`/api/photos/${id}/clear-selection`, { method: 'POST' });
      if (res.ok) {
        setAllPhotos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, selectedBy: null, selectedByUsername: null } : p))
        );
      } else {
        const data = await res.json();
        alert(data.message || 'Seçim kaldırılırken bir hata oluştu.');
      }
    } catch (error) {
      console.error(error);
      alert('Seçim kaldırılırken bir hata oluştu.');
    }
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

  const handleDownloadSelected = async () => {
    if (totalSelections === 0) {
      alert('İndirilecek seçilmiş fotoğraf bulunamadı.');
      return;
    }
    
    setIsDownloadingSelected(true);
    try {
      const res = await fetch('/api/admin/download-selected');
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          const a = document.createElement('a');
          a.href = data.url;
          a.download = 'yillik_secilen_fotograflar.zip';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          alert('Toplu indirme başarısız oldu.');
        }
      } else {
        alert('Seçilenleri indirme hatası.');
      }
    } catch (error) {
      console.error(error);
      alert('Seçilenleri indirirken bir hata oluştu');
    } finally {
      setIsDownloadingSelected(false);
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

      {/* Seçim İstatistikleri & Kişiye Özel Kota */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, opacity: 0.8, fontSize: '0.9rem' }}>
            📊 Kullanıcı Seçim Kotaları
          </span>
          <button
            disabled={isDownloadingSelected || totalSelections === 0}
            onClick={handleDownloadSelected}
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: (isDownloadingSelected || totalSelections === 0) ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              background: 'rgba(168,85,247,0.2)',
              color: '#c084fc',
              transition: 'all 0.2s',
            }}
          >
            {isDownloadingSelected ? '⏳ İndiriliyor...' : `📥 Seçilenleri İndir (${totalSelections})`}
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '0.75rem',
          marginTop: '0.25rem'
        }}>
          {userStats.map(u => {
            const editVal = u.editingQuota !== undefined ? u.editingQuota : (u.selectionQuota ?? '');
            const isCustom = u.selectionQuota !== null;
            const done = u.selectedCount >= u.effectiveQuota;
            return (
              <div key={u.id} style={{ 
                background: 'rgba(0,0,0,0.2)', 
                padding: '0.75rem 1rem', 
                borderRadius: '10px',
                border: `1px solid ${done ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.07)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{u.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginLeft: '6px' }}>@{u.username}</span>
                  </div>
                  <span style={{ 
                    background: done ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)',
                    color: done ? '#4ade80' : 'white',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {u.selectedCount} / {u.effectiveQuota}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
                    {isCustom ? '⚡ Özel kota:' : '🌐 Global kota:'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder={`${globalQuota} (global)`}
                    value={editVal}
                    onChange={(e) => setUserStats(prev => prev.map(p =>
                      p.id === u.id ? { ...p, editingQuota: e.target.value } : p
                    ))}
                    style={{
                      width: '70px',
                      padding: '0.3rem 0.5rem',
                      borderRadius: '6px',
                      border: `1px solid ${isCustom ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.15)'}`,
                      background: 'rgba(0,0,0,0.3)',
                      color: isCustom ? '#fbbf24' : 'white',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                    }}
                  />
                  <button
                    onClick={() => {
                      const val = editVal === '' ? null : Number(editVal);
                      handleUserQuotaSave(u.id, val);
                    }}
                    style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'rgba(99,102,241,0.3)',
                      color: '#a5b4fc',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    Kaydet
                  </button>
                  {isCustom && (
                    <button
                      onClick={() => handleUserQuotaSave(u.id, null)}
                      title="Global kotaya dön"
                      style={{
                        padding: '0.3rem 0.5rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'rgba(239,68,68,0.15)',
                        color: '#f87171',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <div style={{ 
            background: 'rgba(59,130,246,0.15)', 
            padding: '0.75rem 1rem', 
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid rgba(59,130,246,0.3)'
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#93c5fd' }}>Toplam Seçim</span>
            <span style={{ 
              background: 'rgba(59,130,246,0.3)',
              color: 'white',
              padding: '0.2rem 0.6rem',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}>
              {totalSelections}
            </span>
          </div>
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
            <button
              className={`${styles.viewBtn} ${filterMode === 'selected' ? styles.activeViewBtn : ''}`}
              onClick={() => setFilterMode('selected')}
            >
              Seçilenler ({allPhotos.filter(p => !!p.selectedBy).length})
            </button>

            <span style={{ width: '1rem' }}></span>

            <button 
              className={`${styles.viewBtn} ${sortMode === 'newest' ? styles.activeViewBtn : ''}`}
              onClick={() => setSortMode('newest')}
            >
               En Yeni
            </button>
            <button 
              className={`${styles.viewBtn} ${sortMode === 'popular' ? styles.activeViewBtn : ''}`}
              onClick={() => setSortMode('popular')}
            >
               En Beğenilen
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
              onClearSelection={handleClearSelection}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
