"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import UploadModal from './UploadModal';

interface UserType {
  name: string;
  username: string;
  userId: string;
  role?: string;
}

export default function Sidebar({ user }: { user?: UserType }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const handleUploadSuccess = () => {
    // Refresh current page
    window.location.reload();
  };

  const navItems = [
    { label: 'Ana Sayfa', href: '/', icon: <HomeIcon /> },
    { label: 'Profil', href: '/profile', icon: <UserIcon /> },
    ...(user?.role === 'admin' ? [{ label: 'Admin', href: '/admin', icon: <ShieldIcon /> }] : []),
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button className={styles.mobileToggle} onClick={() => setIsOpen(o => !o)} aria-label={isOpen ? 'Menüyü Kapat' : 'Menüyü Aç'}>
        {isOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/* Sidebar Overlay (Mobile) */}
      <div 
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`} 
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Container */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.topSection}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>📸</span>
            <span className={styles.logoText}>Şamata</span>
          </div>

          <nav className={styles.nav}>
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  onClick={() => setIsOpen(false)}
                  title={item.label}
                >
                  <div className={styles.iconWrapper}>{item.icon}</div>
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              );
            })}
            <button 
              className={styles.uploadBtnSidebar} 
              onClick={() => { setIsOpen(false); setIsUploadOpen(true); }}
              title="Fotoğraf Yükle"
            >
              <div className={styles.iconWrapper}><UploadIcon /></div>
              <span className={styles.navLabel}>Yükle</span>
            </button>
          </nav>
        </div>

        <div className={styles.bottomSection}>
          {user && (
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>{user.name.charAt(0).toUpperCase()}</div>
              <div className={styles.userDetails}>
                <span className={styles.userName}>{user.name}</span>
                <span className={styles.userHandle}>@{user.username}</span>
              </div>
            </div>
          )}
          <button className={styles.logoutBtn} onClick={handleLogout} title="Çıkış Yap">
            <div className={styles.iconWrapper}><LogoutIcon /></div>
            <span className={styles.navLabel}>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {user && (
        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </>
  );
}

// Icons
function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}


function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  );
}
