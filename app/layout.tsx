import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Şamata Sayfası - Yıllık Foto',
  description: 'Sınıf yıllığı şamata sayfası fotoğraf vitrini ve oylaması',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at top right, rgba(168, 85, 247, 0.15), transparent 40%), radial-gradient(circle at bottom left, rgba(236, 72, 153, 0.1), transparent 40%)',
          zIndex: -1,
          pointerEvents: 'none'
        }} />
        {children}
      </body>
    </html>
  );
}
