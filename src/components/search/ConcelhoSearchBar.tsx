'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Loader2, X } from 'lucide-react';

interface Concelho {
  id: string;
  name: string;
  distrito: string;
  label: string;
}

export function ConcelhoSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentConcelho = searchParams.get('concelhoId');
  
  const [query, setQuery] = useState('');
  const [concelhoName, setConcelhoName] = useState<string | null>(null);
  const [results, setResults] = useState<Concelho[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carregar nome do concelho atual
  useEffect(() => {
    if (currentConcelho) {
      // Extrair nome do ID (formato: distrito-nome)
      const parts = currentConcelho.split('-');
      if (parts.length >= 2) {
        const name = parts.slice(1).join(' ').replace(/-/g, ' ');
        setConcelhoName(name.charAt(0).toUpperCase() + name.slice(1));
      }
    } else {
      setConcelhoName(null);
    }
  }, [currentConcelho]);

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

  const selectConcelho = (concelho: Concelho) => {
    setQuery('');
    setIsOpen(false);
    setConcelhoName(concelho.name);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('concelhoId', concelho.id);
    router.push(`/apoios?${params.toString()}`);
  };

  const clearConcelho = () => {
    setConcelhoName(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('concelhoId');
    router.push(`/apoios?${params.toString()}`);
  };

  // Se tem concelho selecionado, mostrar badge
  if (concelhoName) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">{concelhoName}</span>
        <button
          onClick={clearConcelho}
          className="ml-1 rounded-full p-0.5 hover:bg-primary/20 transition"
          aria-label="Remover filtro de concelho"
        >
          <X className="h-4 w-4 text-primary" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MapPin className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Escreve o teu concelho (ex.: Cascais)"
          className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Resultados dropdown */}
      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5">
          {results.map((concelho) => (
            <li
              key={concelho.id}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => selectConcelho(concelho)}
            >
              <span className="font-medium">{concelho.name}</span>
              <span className="text-gray-400 ml-1">({concelho.distrito})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
