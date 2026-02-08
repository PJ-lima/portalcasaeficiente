'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Home } from 'lucide-react';

interface Concelho {
  id: string;
  name: string;
  distrito: string;
  label: string;
}

interface DossierFormData {
  address: string;
  postalCode: string;
  concelhoId: string;
  isMainResidence: boolean;
  buildingYear: number | '';
  propertyType: string;
  householdSize: number | '';
  annualIncome: number | '';
  hasSocialTariff: boolean;
  isDisabledPerson: boolean;
  hasElderly: boolean;
  energyCertificate: string;
}

type PostalValidationMessageType = 'success' | 'error' | 'warning' | '';
interface PostalValidationState {
  isValidating: boolean;
  isValidPostal: boolean | null;
  postalMessage: string;
  messageType: PostalValidationMessageType;
}

const INITIAL_POSTAL_VALIDATION_STATE: PostalValidationState = {
  isValidating: false,
  isValidPostal: null,
  postalMessage: '',
  messageType: '',
};

export function DossierForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [success, setSuccess] = useState(false);
  const [concelhos, setConcelhos] = useState<Concelho[]>([]);
  const [concelhoSearch, setConcelhoSearch] = useState('');
  const [showConcelhoDropdown, setShowConcelhoDropdown] = useState(false);

  const [formData, setFormData] = useState<DossierFormData>({
    address: '',
    postalCode: '',
    concelhoId: '',
    isMainResidence: true,
    buildingYear: '',
    propertyType: 'apartamento',
    householdSize: '',
    annualIncome: '',
    hasSocialTariff: false,
    isDisabledPerson: false,
    hasElderly: false,
    energyCertificate: '',
  });

  const [validationState, setValidationState] = useState<PostalValidationState>(INITIAL_POSTAL_VALIDATION_STATE);

  // Carregar dados existentes do dossiê
  useEffect(() => {
    const loadDossier = async () => {
      try {
        const response = await fetch('/api/dossier');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.dossier) {
            const dossier = data.dossier;
            setFormData({
              address: dossier.address || '',
              postalCode: dossier.postalCode || '',
              concelhoId: dossier.concelhoId || '',
              isMainResidence: dossier.isMainResidence ?? true,
              buildingYear: dossier.buildingYear || '',
              propertyType: dossier.propertyType || 'apartamento',
              householdSize: dossier.householdSize || '',
              annualIncome: dossier.annualIncome || '',
              hasSocialTariff: dossier.hasSocialTariff || false,
              isDisabledPerson: dossier.isDisabledPerson || false,
              hasElderly: dossier.hasElderly || false,
              energyCertificate: dossier.energyCertificate || '',
            });
            
            // Definir busca do concelho se já há concelhoId
            if (dossier.concelhoId) {
              const concelho = concelhos.find(c => c.id === dossier.concelhoId);
              if (concelho) {
                setConcelhoSearch(concelho.label);
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dossiê:', error);
      }
    };
    
    loadDossier();
  }, [concelhos]);

  // Carregar concelhos na inicialização
  useEffect(() => {
    fetch('/api/concelhos')
      .then(res => res.json())
      .then(data => setConcelhos(data.data || []))
      .catch(err => console.error('Erro ao carregar concelhos:', err));
  }, []);

  // Validação automática de código postal quando completo
  useEffect(() => {
    const validatePostalCode = async () => {
      if (!formData.postalCode || !isValidPostalCode(formData.postalCode)) {
        setValidationState(INITIAL_POSTAL_VALIDATION_STATE);
        return;
      }

      const selectedConcelhoName = formData.concelhoId
        ? concelhos.find((c) => c.id === formData.concelhoId)?.name
        : undefined;

      setValidationState(prev => ({ ...prev, isValidating: true }));

      try {
        const response = await fetch('/api/postal/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postalCode: formData.postalCode,
            concelho: selectedConcelhoName,
          })
        });

        const data = await response.json();

        if (data.ok && data.valid) {
          // Sugerir concelho automaticamente
          if (data.suggestion && !formData.concelhoId) {
            setFormData(prev => ({ ...prev, concelhoId: data.suggestion.id }));
            setConcelhoSearch(data.suggestion.label);
          }

          const locationLabel = [data.localidade, data.concelhoResolved]
            .filter(Boolean)
            .join(', ');
          const mismatchSuffix = data.match === false
            ? ' (não corresponde ao concelho selecionado)'
            : '';

          setValidationState({
            isValidating: false,
            isValidPostal: true,
            postalMessage: locationLabel
              ? `✓ ${locationLabel}${mismatchSuffix}`
              : `✓ Código postal válido${mismatchSuffix}`,
            messageType: data.stale ? 'warning' : 'success',
          });
        } else if (response.status >= 500) {
          setValidationState({
            isValidating: false,
            isValidPostal: null,
            postalMessage: 'Não foi possível validar automaticamente. Pode continuar.',
            messageType: 'warning',
          });
        } else {
          setValidationState({
            isValidating: false,
            isValidPostal: false,
            postalMessage: data.reason || 'Código postal não encontrado',
            messageType: 'error',
          });
        }
      } catch {
        setValidationState({
          isValidating: false,
          isValidPostal: null,
          postalMessage: 'Não foi possível validar automaticamente. Pode continuar.',
          messageType: 'warning',
        });
      }
    };

    const timeoutId = setTimeout(validatePostalCode, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.postalCode, formData.concelhoId, concelhos]);

  // Função para formatar código postal automaticamente
  const formatPostalCode = (value: string) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    // Aplica formato 0000-000
    if (digits.length <= 4) {
      return digits;
    } else {
      return `${digits.substring(0, 4)}-${digits.substring(4, 7)}`;
    }
  };

  // Função para validar código postal
  const isValidPostalCode = (code: string) => {
    return /^\d{4}-\d{3}$/.test(code);
  };

  // Filtrar concelhos para busca
  const filteredConcelhos = concelhos.filter(concelho =>
    concelho.label.toLowerCase().includes(concelhoSearch.toLowerCase())
  ).slice(0, 10); // Máximo 10 resultados

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setWarning('');
    setSuccess(false);

    // Validação obrigatória
    const requiredFields = {
      address: 'Morada',
      postalCode: 'Código Postal',
      concelhoId: 'Concelho',
      buildingYear: 'Ano de Construção',
      householdSize: 'Número de Pessoas',
      annualIncome: 'Rendimento Anual',
      energyCertificate: 'Certificado Energético'
    };

    const missingFields = [];
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field as keyof DossierFormData] || formData[field as keyof DossierFormData] === '') {
        missingFields.push(label);
      }
    }

    if (missingFields.length > 0) {
      setError(`Por favor preencha os seguintes campos obrigatórios: ${missingFields.join(', ')}`);
      setLoading(false);
      return;
    }

    // Validar formato do código postal
    if (!isValidPostalCode(formData.postalCode)) {
      setError('Código postal deve ter o formato 0000-000');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/dossier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          buildingYear: formData.buildingYear ? Number(formData.buildingYear) : null,
          householdSize: formData.householdSize ? Number(formData.householdSize) : null,
          annualIncome: formData.annualIncome ? Number(formData.annualIncome) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao guardar dossiê');
      }

      setSuccess(true);
      if (data.postalValidation && data.postalValidation.match === false) {
        const resolvedConcelho = data.postalValidation.concelhoResolved || 'outro concelho';
        setWarning(`Dossiê guardado, mas o código postal parece pertencer a ${resolvedConcelho}. Verifique o concelho selecionado.`);
        return;
      }

      setTimeout(() => {
        router.push('/apoios');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'postalCode') {
      // Formatar código postal automaticamente
      const formatted = formatPostalCode(value);
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Função específica para busca de concelhos
  const handleConcelhoSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConcelhoSearch(value);
    setShowConcelhoDropdown(value.length > 0);
    setFormData((prev) => ({ ...prev, concelhoId: '' })); // Reset seleção
  };

  // Função para selecionar concelho
  const selectConcelho = (concelho: Concelho) => {
    setFormData((prev) => ({ ...prev, concelhoId: concelho.id }));
    setConcelhoSearch(concelho.label);
    setShowConcelhoDropdown(false);
  };

  return (
    <div className="space-y-6">
      {/* Header com navegação */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar Atrás
          </button>
          
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <Home className="h-4 w-4" />
            Página Inicial
          </button>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900">O Meu Dossiê</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
      {/* Localização */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📍 Localização</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Morada *
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`w-full rounded-lg border px-4 py-2 ${
                !formData.address && error ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Rua, número, andar..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                Código Postal *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  maxLength={8}
                  className={`w-full rounded-lg border px-4 py-2 ${
                    validationState.isValidating
                      ? 'border-yellow-300 bg-yellow-50'
                      : validationState.messageType === 'warning'
                      ? 'border-yellow-300 bg-yellow-50'
                      : validationState.isValidPostal === true
                      ? 'border-green-300 bg-green-50'
                      : validationState.isValidPostal === false
                      ? 'border-red-300 bg-red-50'
                      : formData.postalCode && !isValidPostalCode(formData.postalCode)
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="0000-000"
                  required
                />
                {validationState.isValidating && (
                  <div className="absolute right-3 top-2.5">
                    <div className="animate-spin h-4 w-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              {formData.postalCode && !isValidPostalCode(formData.postalCode) && !validationState.isValidating && (
                <p className="text-red-500 text-xs mt-1">Formato: 0000-000 (7 dígitos)</p>
              )}
              {validationState.postalMessage && isValidPostalCode(formData.postalCode) && (
                <p className={`text-xs mt-1 ${
                  validationState.messageType === 'success'
                    ? 'text-green-600'
                    : validationState.messageType === 'warning'
                    ? 'text-yellow-700'
                    : 'text-red-500'
                }`}>
                  {validationState.postalMessage}
                </p>
              )}
            </div>

            <div className="relative">
              <label htmlFor="concelhoSearch" className="block text-sm font-medium text-gray-700 mb-1">
                Concelho *
              </label>
              <input
                type="text"
                id="concelhoSearch"
                name="concelhoSearch"
                value={concelhoSearch}
                onChange={handleConcelhoSearchChange}
                onFocus={() => setShowConcelhoDropdown(concelhoSearch.length > 0)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="Digite para pesquisar..."
                autoComplete="off"
                required
              />
              {showConcelhoDropdown && filteredConcelhos.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredConcelhos.map((concelho) => (
                    <button
                      key={concelho.id}
                      type="button"
                      onClick={() => selectConcelho(concelho)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100"
                    >
                      {concelho.label}
                    </button>
                  ))}
                </div>
              )}
              {formData.concelhoId && (
                <p className="text-green-600 text-xs mt-1">✓ Concelho selecionado</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Imóvel */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🏠 Imóvel</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isMainResidence"
              name="isMainResidence"
              checked={formData.isMainResidence}
              onChange={handleChange}
              className="rounded border-gray-300"
            />
            <label htmlFor="isMainResidence" className="text-sm text-gray-700">
              É a minha habitação própria permanente
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Imóvel
              </label>
              <select
                id="propertyType"
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              >
                <option value="apartamento">Apartamento</option>
                <option value="moradia">Moradia</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label htmlFor="buildingYear" className="block text-sm font-medium text-gray-700 mb-1">
                Ano de Construção *
              </label>
              <input
                type="number"
                id="buildingYear"
                name="buildingYear"
                value={formData.buildingYear}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-2 ${
                  !formData.buildingYear && error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Ex: 1990"
                min="1800"
                max={new Date().getFullYear()}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="energyCertificate" className="block text-sm font-medium text-gray-700 mb-1">
              Certificado Energético
            </label>
            <select
              id="energyCertificate"
              name="energyCertificate"
              value={formData.energyCertificate}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            >
              <option value="">Não sei / Não tenho</option>
              <option value="A+">A+</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="B-">B-</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
              <option value="F">F</option>
            </select>
          </div>
        </div>
      </section>

      {/* Agregado Familiar */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">👥 Agregado Familiar</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="householdSize" className="block text-sm font-medium text-gray-700 mb-1">
                Número de Pessoas
              </label>
              <input
                type="number"
                id="householdSize"
                name="householdSize"
                value={formData.householdSize}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="Ex: 3"
                min="1"
              />
            </div>

            <div>
              <label htmlFor="annualIncome" className="block text-sm font-medium text-gray-700 mb-1">
                Rendimento Anual (€)
              </label>
              <input
                type="number"
                id="annualIncome"
                name="annualIncome"
                value={formData.annualIncome}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="Ex: 25000"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasSocialTariff"
                name="hasSocialTariff"
                checked={formData.hasSocialTariff}
                onChange={handleChange}
                className="rounded border-gray-300"
              />
              <label htmlFor="hasSocialTariff" className="text-sm text-gray-700">
                Tenho tarifa social de energia
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDisabledPerson"
                name="isDisabledPerson"
                checked={formData.isDisabledPerson}
                onChange={handleChange}
                className="rounded border-gray-300"
              />
              <label htmlFor="isDisabledPerson" className="text-sm text-gray-700">
                Pessoa com deficiência no agregado
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasElderly"
                name="hasElderly"
                checked={formData.hasElderly}
                onChange={handleChange}
                className="rounded border-gray-300"
              />
              <label htmlFor="hasElderly" className="text-sm text-gray-700">
                Pessoa idosa (65+) no agregado
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Mensagens */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">
            ✅ Dossiê guardado com sucesso! {warning ? 'Reveja o aviso abaixo.' : 'A redirecionar...'}
          </p>
        </div>
      )}

      {warning && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm text-yellow-800">{warning}</p>
        </div>
      )}

      {/* Botões */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/apoios')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Ver Apoios Disponíveis
          </button>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {loading ? 'A guardar...' : 'Guardar Dossiê'}
        </button>
      </div>
    </form>
    </div>
  );
}
