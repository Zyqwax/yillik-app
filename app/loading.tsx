import SkeletonGrid from './components/SkeletonGrid';

export default function Loading() {
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0a0a0d', paddingTop: '60px' }}>
      <SkeletonGrid />
    </div>
  );
}
