import { useState } from 'react';
import { HeartHandshake } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ResilientImage({ src, alt, className = '' }: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-[#EAE5DC] text-[#183D32] p-6 text-center border border-[#242824]/10 ${className}`}
      >
        <HeartHandshake className="w-8 h-8 text-[#B99A64] mb-2" aria-hidden="true" />
        <span className="font-serif text-base text-[#242824]">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
