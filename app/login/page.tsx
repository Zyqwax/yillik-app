"use client";

import styles from './page.module.css';

export default function Login() {
  return (
    <main className={styles.container}>
      <div className={styles.glassPanel}>
        <div className={styles.logo}>📸 Şamata</div>
        <h1 className={styles.title}>Yıllık Oylama Vitrini</h1>
        <p className={styles.subtitle}>Giriş yaparak fotoğraflara göz at ve oy ver!</p>
        
        <form className={styles.form} action="/api/auth/login" method="POST" onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const username = formData.get('username');
          const password = formData.get('password');
          
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (res.ok) {
            window.location.href = '/';
          } else {
            const data = await res.json();
            alert(data.message || 'Giriş başarısız!');
          }
        }}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="username">Kullanıcı Adı</label>
            <input 
              className={styles.input} 
              type="text" 
              id="username" 
              name="username" 
              placeholder="ogrenci1" 
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">Şifre</label>
            <input 
              className={styles.input} 
              type="password" 
              id="password" 
              name="password" 
              placeholder="••••••••" 
              required 
            />
          </div>
          <button type="submit" className={styles.button}>Giriş Yap</button>
        </form>
      </div>
    </main>
  );
}
