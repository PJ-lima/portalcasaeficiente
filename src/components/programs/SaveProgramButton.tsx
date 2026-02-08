'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Heart, Loader2 } from 'lucide-react';

interface SaveProgramButtonProps {
  slug: string;
  initialSaved?: boolean;
  onSavedChange?: (saved: boolean) => void;
  size?: 'sm' | 'md';
}

export function SaveProgramButton({
  slug,
  initialSaved = false,
  onSavedChange,
  size = 'md',
}: SaveProgramButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsSaved(initialSaved);
  }, [initialSaved]);

  async function handleSaveToggle() {
    if (status === 'loading' || isLoading) {
      return;
    }

    if (status === 'unauthenticated') {
      const query = searchParams.toString();
      const callbackUrl = pathname ? `${pathname}${query ? `?${query}` : ''}` : '/apoios';
      router.push(`/conta?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const method = isSaved ? 'DELETE' : 'POST';
      const response = await fetch(`/api/programs/${slug}/save`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: isSaved ? undefined : JSON.stringify({}),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Não foi possível atualizar favoritos');
      }

      const nextValue = !isSaved;
      setIsSaved(nextValue);
      onSavedChange?.(nextValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar favoritos');
    } finally {
      setIsLoading(false);
    }
  }

  const paddingClass = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm';
  const savedClass = isSaved
    ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50';

  return (
    <div>
      <button
        type="button"
        onClick={handleSaveToggle}
        disabled={status === 'loading' || isLoading}
        className={`inline-flex items-center gap-2 rounded-lg border font-medium transition disabled:opacity-60 disabled:cursor-not-allowed ${paddingClass} ${savedClass}`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
        )}
        {isSaved ? 'Guardado' : 'Guardar'}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
