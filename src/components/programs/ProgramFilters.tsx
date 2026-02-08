'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useState } from 'react';

interface ProgramFiltersProps {
  searchParams: {
    concelhoId?: string;
    status?: string | string[];
    programType?: string;
    q?: string;
  };
}

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Aberto' },
  { value: 'PLANNED', label: 'A anunciar' },
  { value: 'UNKNOWN', label: 'Sem data pública' },
  { value: 'CLOSED', label: 'Fechado' },
];

const PROGRAM_TYPE_OPTIONS = [
  { value: 'NATIONAL', label: 'Nacional' },
  { value: 'MUNICIPAL', label: 'Municipal' },
];

export function ProgramFilters({ searchParams }: ProgramFiltersProps) {
  const router = useRouter();
  const currentParams = useSearchParams();
  const [searchText, setSearchText] = useState(searchParams.q || '');

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(currentParams.toString());
    
    if (value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    router.push(`/apoios?${params.toString()}`);
  };

  const toggleStatus = (status: string) => {
    const params = new URLSearchParams(currentParams.toString());
    const current = params.getAll('status');
    
    if (current.includes(status)) {
      params.delete('status');
      current.filter(s => s !== status).forEach(s => params.append('status', s));
    } else {
      params.append('status', status);
    }
    
    router.push(`/apoios?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (searchParams.concelhoId) {
      params.set('concelhoId', searchParams.concelhoId);
    }
    router.push(`/apoios?${params.toString()}`);
  };

  const selectedStatuses = typeof searchParams.status === 'string'
    ? [searchParams.status]
    : searchParams.status || [];

  const hasFilters = selectedStatuses.length > 0 || searchParams.programType || searchParams.q;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Filtros</h2>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-primary hover:underline"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Pesquisa por texto */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Pesquisar</h3>
        <div className="relative">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateFilters('q', searchText);
              }
            }}
            placeholder="Título ou entidade..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
        {searchText && (
          <button
            onClick={() => {
              setSearchText('');
              updateFilters('q', null);
            }}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
          >
            Limpar pesquisa
          </button>
        )}
      </div>

      {/* Tipo de programa */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Tipo de programa</h3>
        <div className="space-y-2">
          <button
            onClick={() => updateFilters('programType', null)}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
              !searchParams.programType
                ? 'bg-primary/10 text-primary font-medium'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Todos
          </button>
          {PROGRAM_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateFilters('programType', option.value)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                searchParams.programType === option.value
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Estado do apoio</h3>
        <div className="space-y-2">
          {STATUS_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900"
            >
              <input
                type="checkbox"
                checked={selectedStatuses.includes(option.value)}
                onChange={() => toggleStatus(option.value)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
