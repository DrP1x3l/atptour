// Avatar component. Mostra emoji o data:image, oppure fallback iniziali.
interface Props {
  src?: string | null;
  name?: string;
  size?: number;
  ring?: boolean;
  className?: string;
}

export function Av({ src, name, size = 44, ring, className = "" }: Props) {
  const isImg = !!src && src.startsWith("data:");
  const isEmoji = !!src && !isImg;
  const initials = (name ?? "?").slice(0, 1).toUpperCase();

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-card2 border ${
        ring ? "border-gold glow-gold" : "border-border2"
      } overflow-hidden ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.5, lineHeight: 1 }}
    >
      {isImg ? (
        <img src={src!} alt={name ?? ""} className="w-full h-full object-cover" />
      ) : isEmoji ? (
        <span className="select-none">{src}</span>
      ) : (
        <span className="font-bold text-text2 select-none" style={{ fontSize: size * 0.42 }}>
          {initials}
        </span>
      )}
    </div>
  );
}
