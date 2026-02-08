'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Loader2 } from 'lucide-react';

interface Concelho {
  id: string;
  name: string;
  distrito: string;
  label: string;
}

export function ConcelhoSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Concelho[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/concelhos/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (data.success) {
          setResults(data.data);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Erro ao pesquisar:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          selectConcelho(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const selectConcelho = (concelho: Concelho) => {
    setQuery(concelho.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    router.push(`/apoios?concelhoId=${concelho.id}`);
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Escreve o teu concelho (ex.: Cascais)"
          className="block w-full rounded-xl border border-gray-300 bg-white py-4 pl-12 pr-12 text-lg placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      <p className="mt-2 text-sm text-gray-500">
        Mostramos apoios nacionais + municipais ligados ao teu concelho.
      </p>

      {/* Resultados dropdown */}
      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white py-2 shadow-lg ring-1 ring-black/5"
          role="listbox"
        >
          {results.map((concelho, index) => (
            <li
              key={concelho.id}
              role="option"
              aria-selected={index === selectedIndex}
              className={`cursor-pointer px-4 py-3 transition ${
                index === selectedIndex
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => selectConcelho(concelho)}
            >
              <div className="font-medium">{concelho.name}</div>
              <div className="text-sm text-gray-500">{concelho.distrito}</div>
            </li>
          ))}
        </ul>
      )}

      {/* Sem resultados */}
      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 mt-2 w-full rounded-xl bg-white p-4 shadow-lg ring-1 ring-black/5">
          <p className="text-sm text-gray-500">
            Nenhum concelho encontrado para &ldquo;{query}&rdquo;
          </p>
        </div>
      )}

      {/* Botão de pesquisa */}
      <button
        type="button"
        onClick={() => {
          if (query) {
            router.push(`/apoios?q=${encodeURIComponent(query)}`);
          }
        }}
        className="mt-4 w-full rounded-xl bg-primary px-6 py-4 text-lg font-medium text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
      >
        Ver apoios abertos
      </button>
    </div>
  );
}
