'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type EligibilityResult = 'ELIGIBLE' | 'MAYBE' | 'NOT_ELIGIBLE';

interface Evaluation {
  result: EligibilityResult;
  score: number;
  summary: string;
  evaluations: {
    ruleId: string;
    ruleKey: string;
    passed: boolean;
    reason: string;
    required: boolean;
  }[];
}

interface ProgramRecommendation {
  program: {
    id: string;
    slug: string;
    title: string;
    entity: string | null;
    programType: string;
    status: string;
    summary: string | null;
    officialUrl: string | null;
  };
  evaluation: Evaluation;
}

interface RecommendationsData {
  user: {
    concelho: string;
    hasMainResidence: boolean;
  };
  recommendations: ProgramRecommendation[];
  total: number;
  eligible: number;
  maybe: number;
  notEligible: number;
}

export default function RecommendationsList() {
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EligibilityResult | 'ALL'>('ALL');

  useEffect(() => {
    async function loadRecommendations() {
      try {
        setLoading(true);
        const response = await fetch('/api/eligibility/recommendations');
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao carregar recomendações');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">A calcular elegibilidade...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Erro</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const filteredRecommendations = filter === 'ALL' 
    ? data.recommendations 
    : data.recommendations.filter(r => r.evaluation.result === filter);

  const getResultBadge = (result: EligibilityResult) => {
    switch (result) {
      case 'ELIGIBLE':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">✓ Elegível</span>;
      case 'MAYBE':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">? Talvez</span>;
      case 'NOT_ELIGIBLE':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">✗ Não elegível</span>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-2">
          Programas Recomendados para si
        </h2>
        <p className="text-blue-700 mb-4">
          Com base no seu perfil em <strong>{data.user.concelho}</strong>
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{data.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{data.eligible}</div>
            <div className="text-sm text-gray-600">Elegível</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{data.maybe}</div>
            <div className="text-sm text-gray-600">Talvez</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{data.notEligible}</div>
            <div className="text-sm text-gray-600">Não elegível</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos ({data.total})
        </button>
        <button
          onClick={() => setFilter('ELIGIBLE')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'ELIGIBLE'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Elegível ({data.eligible})
        </button>
        <button
          onClick={() => setFilter('MAYBE')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'MAYBE'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Talvez ({data.maybe})
        </button>
        <button
          onClick={() => setFilter('NOT_ELIGIBLE')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'NOT_ELIGIBLE'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Não elegível ({data.notEligible})
        </button>
      </div>

      {/* Lista de programas */}
      <div className="space-y-4">
        {filteredRecommendations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nenhum programa encontrado para este filtro.
          </div>
        ) : (
          filteredRecommendations.map((rec) => (
            <div
              key={rec.program.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <Link 
                    href={`/apoios/${rec.program.slug}`}
                    className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                  >
                    {rec.program.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                    <span className="font-medium">{rec.program.entity || 'Sem entidade'}</span>
                    <span>•</span>
                    <span className="capitalize">{rec.program.programType === 'NATIONAL' ? 'Nacional' : 'Municipal'}</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  {getResultBadge(rec.evaluation.result)}
                  <div className={`text-2xl font-bold mt-2 ${getScoreColor(rec.evaluation.score)}`}>
                    {rec.evaluation.score}%
                  </div>
                </div>
              </div>

              {/* Resumo da elegibilidade */}
              <div className="bg-gray-50 rounded-lg p-4 mb-3">
                <p className="text-gray-700">{rec.evaluation.summary}</p>
                {rec.program.summary && (
                  <p className="text-sm text-gray-600 mt-2">{rec.program.summary}</p>
                )}
              </div>

              {/* Detalhes das regras */}
              {rec.evaluation.evaluations.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Ver detalhes da avaliação ({rec.evaluation.evaluations.length} regras)
                  </summary>
                  <div className="mt-3 space-y-2">
                    {rec.evaluation.evaluations.map((ruleEval, idx) => (
                      <div
                        key={idx}
                        className={`text-sm p-2 rounded ${
                          ruleEval.passed ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        {ruleEval.reason}
                        {ruleEval.required && <span className="ml-2 text-xs font-semibold">(obrigatório)</span>}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Link oficial */}
              {rec.program.officialUrl && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <a
                    href={rec.program.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Ver página oficial →
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
