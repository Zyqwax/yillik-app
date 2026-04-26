"use client";

import { useEffect, useState, useRef } from 'react';
import styles from './SkeletonGrid.module.css';

export default function SkeletonGrid() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const gap = 10;
  const cols = containerWidth > 0 ? (containerWidth < 480 ? 3 : containerWidth < 900 ? 4 : 5) : 4;
  const cellSize = containerWidth > 0
    ? Math.floor((containerWidth - gap * (cols - 1)) / cols)
    : 0;

  // Render a full screen of skeletons
  const rows = Array.from({ length: 6 });
  const cells = Array.from({ length: cols });

  return (
    <div className={styles.container} ref={wrapperRef}>
      {cellSize > 0 && rows.map((_, rowIdx) => (
        <div key={rowIdx} className={styles.row} style={{ gap: `${gap}px`, marginBottom: `${gap}px` }}>
          {cells.map((_, colIdx) => (
            <div 
              key={colIdx} 
              className={styles.skeletonCard} 
              style={{ width: cellSize, height: cellSize }}
            >
              <div className={styles.skeletonStrip}>
                <div className={styles.skeletonAvatar} />
                <div className={styles.skeletonText} />
                <div className={styles.skeletonVote} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
