"use client";

import { useState } from 'react';
import styles from './UploadModal.module.css';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }: { isOpen: boolean, onClose: () => void, onUploadSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Lütfen bir fotoğraf seçin.');
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', caption);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setFile(null);
        setCaption('');
        onUploadSuccess();
        onClose();
      } else {
        const data = await res.json();
        alert(data.message || 'Yükleme başarısız!');
      }
    } catch (error) {
      console.error(error);
      alert('Bir hata oluştu.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Fotoğraf Yükle</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.dropzone}>
            <label htmlFor="fileUpload" className={styles.fileLabel}>
              {file ? file.name : '📸 Bir fotoğraf seç veya sürükle'}
            </label>
            <input
              id="fileUpload"
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          
          <input
            type="text"
            placeholder="Kısa bir açıklama (Opsiyonel)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className={styles.textInput}
            maxLength={100}
          />
          
          <button type="submit" className={styles.submitBtn} disabled={isUploading || !file}>
            {isUploading ? 'Yükleniyor...' : 'Şamataya Katıl!'}
          </button>
        </form>
      </div>
    </div>
  );
}
