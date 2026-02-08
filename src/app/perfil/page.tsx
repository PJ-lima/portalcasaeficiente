'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FileText, Users, Home, Heart, Settings, ArrowRight, User, Mail, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';

interface DossierSummary {
  hasData: boolean;
  address?: string;
  completionPercentage: number;
  lastUpdated?: string;
}

export default function PerfilPage() {
  const { data: session, status } = useSession();
  const [dossier, setDossier] = useState<DossierSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDossier = async () => {
      try {
        const response = await fetch('/api/dossier');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.dossier) {
            // Calcular percentagem de completude
            const fields = [
              data.dossier.address,
              data.dossier.postalCode,
              data.dossier.concelhoId,
              data.dossier.buildingYear,
              data.dossier.householdSize,
              data.dossier.annualIncome,
              data.dossier.energyCertificate
            ];
            const completed = fields.filter(Boolean).length;
            const percentage = Math.round((completed / fields.length) * 100);
            
            setDossier({
              hasData: true,
              address: data.dossier.address,
              completionPercentage: percentage,
              lastUpdated: new Date(data.dossier.updatedAt).toLocaleDateString('pt-PT')
            });
          } else {
            setDossier({
              hasData: false,
              completionPercentage: 0
            });
          }
        } else {
          setDossier({
            hasData: false,
            completionPercentage: 0
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dossiê:', error);
        setDossier({
          hasData: false,
          completionPercentage: 0
        });
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchDossier();
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // O middleware já protege esta rota
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  const completionPercentage = dossier?.completionPercentage ?? 0;
  const canSeeRecommendations = Boolean(dossier?.hasData && completionPercentage >= 70);

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo, {session.user.name?.split(' ')[0] || 'Utilizador'}! 👋
          </h1>
          <p className="text-gray-600">Gere o teu dossiê de eficiência energética</p>
        </div>

        {/* Perfil */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <User className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {session.user.name || 'Utilizador'}
                </h2>
              </div>
            </div>

            <span className="inline-flex w-fit px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              {session.user.role === 'ADMIN' ? 'Administrador' : 'Utilizador'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{session.user.email || 'Sem email'}</p>
              </div>
            </div>

            {session.user.nif && (
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">NIF</p>
                  <p className="text-sm text-gray-900">{session.user.nif}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cards principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Dossiê Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">O Meu Dossiê</h2>
              </div>
              {loading ? (
                <div className="animate-pulse h-4 w-12 bg-gray-200 rounded"></div>
              ) : (
                <span className={`text-sm font-medium px-2 py-1 rounded ${
                  completionPercentage === 100
                    ? 'bg-green-100 text-green-800'
                    : completionPercentage >= 50
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {completionPercentage}%
                </span>
              )}
            </div>
            
            {loading ? (
              <div className="space-y-3">
                <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : dossier?.hasData ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  📍 {dossier.address || 'Morada não definida'}
                </p>
                <p className="text-sm text-gray-500">
                  Última atualização: {dossier.lastUpdated}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      completionPercentage === 100
                        ? 'bg-green-500'
                        : completionPercentage >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Ainda não criou o seu dossiê energético
                </p>
                <p className="text-xs text-gray-500">
                  Preencha os seus dados para receber recomendações personalizadas
                </p>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link 
                href="/conta/dossier" 
                className="flex items-center justify-between text-sm font-medium text-blue-600 hover:text-blue-700 transition"
              >
                {dossier?.hasData ? 'Editar Dossiê' : 'Criar Dossiê'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Recomendações Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Recomendações</h2>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {canSeeRecommendations
                  ? 'Veja os apoios disponíveis para si'
                  : 'Complete o dossiê para ver recomendações'
                }
              </p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link 
                href={canSeeRecommendations
                  ? "/conta/recomendacoes" 
                  : "/conta/dossier"}
                className="flex items-center justify-between text-sm font-medium text-green-600 hover:text-green-700 transition"
              >
                {canSeeRecommendations
                  ? 'Ver Recomendações'
                  : 'Completar Dossiê'
                }
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Apoios Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Home className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Explorar Apoios</h2>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Descubra todos os programas de apoio disponíveis
              </p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link 
                href="/apoios" 
                className="flex items-center justify-between text-sm font-medium text-purple-600 hover:text-purple-700 transition"
              >
                Ver Todos os Apoios
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Link 
              href="/conta/dossier" 
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition group"
            >
              <FileText className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Editar Dossiê</span>
            </Link>
            
            <Link 
              href="/conta/recomendacoes" 
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition group"
            >
              <Users className="h-5 w-5 text-gray-600 group-hover:text-green-600" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">Ver Recomendações</span>
            </Link>
            
            <Link 
              href="/apoios" 
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition group"
            >
              <Home className="h-5 w-5 text-gray-600 group-hover:text-purple-600" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Explorar Apoios</span>
            </Link>

            <Link 
              href="/conta/favoritos" 
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition group"
            >
              <Heart className="h-5 w-5 text-gray-600 group-hover:text-red-600" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-red-700">Ver Favoritos</span>
            </Link>
            
            <Link 
              href="/verificar" 
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition group"
            >
              <Settings className="h-5 w-5 text-gray-600 group-hover:text-orange-600" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">Verificar Elegibilidade</span>
            </Link>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
