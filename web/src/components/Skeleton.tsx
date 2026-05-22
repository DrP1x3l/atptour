interface Props {
  className?: string;
}

export function Skeleton({ className = "" }: Props) {
  return (
    <div
      className={`bg-gradient-to-r from-card via-card2 to-card bg-[length:200%_100%] rounded-2xl ${className}`}
      style={{ animation: "shimmer 1.6s linear infinite" }}
    />
  );
}

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
      <div className="text-mono text-gold tracking-[0.4em] text-sm mb-6 animate-pulse">
        ATP TOUR
      </div>
      <div className="w-full max-w-sm space-y-3">
        <Skeleton className="h-14" />
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
        <Skeleton className="h-20" />
      </div>
    </div>
  );
}
