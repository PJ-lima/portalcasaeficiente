'use client';

import { useState } from 'react';
import { 
  measureTypeLabels, 
  propertyTypeLabels, 
  ownershipTypeLabels,
  eligibilityLabels,
  formatCurrency,
} from '@/lib/utils';
import { ChevronRight, ChevronLeft, Loader2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Concelho {
  id: string;
  name: string;
  distrito: string;
}

interface EligibilityWizardProps {
  programSlug?: string;
}

type Step = 'location' | 'property' | 'situation' | 'measures' | 'results';

interface FormData {
  concelhoId: string;
  concelhoName: string;
  propertyType: string;
  ownershipType: string;
  buildingYear?: number;
  householdSize?: number;
  annualIncome?: number;
  socialTariff: boolean;
  desiredMeasures: string[];
}

interface EligibilityResult {
  program: {
    id: string;
    slug: string;
    name: string;
    entity: string;
    supportType: string;
    maxAmount: number;
    measures: string[];
  };
  evaluation: {
    result: 'ELIGIBLE' | 'MAYBE' | 'NOT_ELIGIBLE';
    score: number;
    summary: string;
  };
  explanation: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    total: number;
    summary: {
      eligible: number;
      maybe: number;
      notEligible: number;
    };
    evaluations: EligibilityResult[];
  };
}

const PROPERTY_TYPES = ['APARTMENT', 'HOUSE', 'VILLA', 'TOWNHOUSE', 'OTHER'];
const OWNERSHIP_TYPES = ['OWNER', 'TENANT', 'USUFRUCT', 'OTHER'];
const MEASURE_TYPES = ['WINDOWS', 'INSULATION', 'ROOF', 'HEAT_PUMP', 'SOLAR_PV', 'WATER_HEATING'];

export function EligibilityWizard({ programSlug }: EligibilityWizardProps) {
  const [step, setStep] = useState<Step>('location');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ApiResponse['data'] | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    concelhoId: '',
    concelhoName: '',
    propertyType: '',
    ownershipType: '',
    socialTariff: false,
    desiredMeasures: [],
  });

  // Concelho search state
  const [concelhoQuery, setConcelhoQuery] = useState('');
  const [concelhoResults, setConcelhoResults] = useState<Concelho[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search for concelhos
  const searchConcelhos = async (query: string) => {
    if (query.length < 2) {
      setConcelhoResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/concelhos/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success) {
        setConcelhoResults(data.data);
      }
    } catch (error) {
      console.error('Erro ao pesquisar:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectConcelho = (concelho: Concelho) => {
    setFormData({ ...formData, concelhoId: concelho.id, concelhoName: concelho.name });
    setConcelhoQuery(concelho.name);
    setConcelhoResults([]);
  };

  const toggleMeasure = (measure: string) => {
    const current = formData.desiredMeasures;
    if (current.includes(measure)) {
      setFormData({ ...formData, desiredMeasures: current.filter(m => m !== measure) });
    } else {
      setFormData({ ...formData, desiredMeasures: [...current, measure] });
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 'location':
        return !!formData.concelhoId;
      case 'property':
        return !!formData.propertyType && !!formData.ownershipType;
      case 'situation':
        return true; // Optional fields
      case 'measures':
        return formData.desiredMeasures.length > 0;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const steps: Step[] = ['location', 'property', 'situation', 'measures', 'results'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      if (steps[currentIndex + 1] === 'results') {
        submitEligibility();
      } else {
        setStep(steps[currentIndex + 1]);
      }
    }
  };

  const prevStep = () => {
    const steps: Step[] = ['location', 'property', 'situation', 'measures', 'results'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const submitEligibility = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/eligibility/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data: ApiResponse = await response.json();
      if (data.success) {
        const filteredEvaluations = programSlug
          ? data.data.evaluations.filter((evaluation) => evaluation.program.slug === programSlug)
          : data.data.evaluations;

        const normalizedResults: ApiResponse['data'] = {
          total: filteredEvaluations.length,
          summary: {
            eligible: filteredEvaluations.filter((evaluation) => evaluation.evaluation.result === 'ELIGIBLE').length,
            maybe: filteredEvaluations.filter((evaluation) => evaluation.evaluation.result === 'MAYBE').length,
            notEligible: filteredEvaluations.filter((evaluation) => evaluation.evaluation.result === 'NOT_ELIGIBLE').length,
          },
          evaluations: filteredEvaluations,
        };

        setResults(normalizedResults);
        setStep('results');
      }
    } catch (error) {
      console.error('Erro ao verificar elegibilidade:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepNumber = () => {
    const steps: Step[] = ['location', 'property', 'situation', 'measures'];
    return steps.indexOf(step) + 1;
  };

  // Render steps
  if (step === 'results' && results) {
    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-xl font-semibold text-ink">Resultado da verificação</h2>
          <p className="mt-2 text-muted-foreground">
            Analisámos {results.total} programas para {formData.concelhoName}.
          </p>
          
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-success-50 p-4 text-center">
              <p className="font-display text-2xl font-bold text-success-700">{results.summary.eligible}</p>
              <p className="text-sm text-success-700">Elegível</p>
            </div>
            <div className="rounded-lg bg-sun-100 p-4 text-center">
              <p className="font-display text-2xl font-bold text-sun-600">{results.summary.maybe}</p>
              <p className="text-sm text-sun-foreground">Talvez</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 text-center">
              <p className="font-display text-2xl font-bold text-red-700">{results.summary.notEligible}</p>
              <p className="text-sm text-red-700">Não elegível</p>
            </div>
          </div>
        </div>

        {/* Results list */}
        <div className="space-y-4">
          {results.evaluations.map((result) => (
            <div
              key={result.program.id}
              className="rounded-xl border border-border bg-card p-6 shadow-card"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {result.evaluation.result === 'ELIGIBLE' && (
                      <CheckCircle2 className="h-5 w-5 text-success-600" />
                    )}
                    {result.evaluation.result === 'MAYBE' && (
                      <AlertCircle className="h-5 w-5 text-sun-500" />
                    )}
                    {result.evaluation.result === 'NOT_ELIGIBLE' && (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      result.evaluation.result === 'ELIGIBLE' ? 'text-success-700' :
                      result.evaluation.result === 'MAYBE' ? 'text-sun-600' : 'text-red-700'
                    }`}>
                      {eligibilityLabels[result.evaluation.result]}
                    </span>
                  </div>
                  <h3 className="mt-2 font-semibold text-ink">{result.program.name}</h3>
                  <p className="text-sm text-muted-foreground">{result.program.entity}</p>
                </div>
                {result.program.maxAmount && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Até</p>
                    <p className="font-display font-semibold text-success-700">
                      {formatCurrency(result.program.maxAmount)}
                    </p>
                  </div>
                )}
              </div>
              
              <p className="mt-3 text-sm text-muted-foreground">
                {result.evaluation.summary}
              </p>
              
              <div className="mt-4 flex gap-3">
                <Link
                  href={`/apoios/${result.program.slug}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Ver detalhes
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => setStep('location')}
            className="flex-1 rounded-lg border border-input bg-card py-3 font-medium text-ink transition hover:border-primary-300 hover:bg-primary-50"
          >
            Nova verificação
          </button>
          <Link
            href="/apoios"
            className="flex-1 rounded-lg bg-primary py-3 text-center font-semibold text-primary-foreground transition hover:bg-primary-800"
          >
            Ver todos os apoios
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Passo {getStepNumber()} de 4</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-muted">
          <div 
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(getStepNumber() / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Step: Location */}
      {step === 'location' && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-ink">Onde moras?</h2>
          <p className="text-muted-foreground">Indica o teu concelho para encontrarmos os apoios disponíveis.</p>
          
          <div className="relative">
            <input
              type="text"
              value={concelhoQuery}
              onChange={(e) => {
                setConcelhoQuery(e.target.value);
                searchConcelhos(e.target.value);
              }}
              placeholder="Pesquisar concelho..."
              className="w-full rounded-lg border border-input bg-card p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {isSearching && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                A pesquisar concelhos...
              </div>
            )}
            
            {concelhoResults.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg bg-card shadow-lg ring-1 ring-ink/5">
                {concelhoResults.map((c) => (
                  <li
                    key={c.id}
                    onClick={() => selectConcelho(c)}
                    className="cursor-pointer px-4 py-2 hover:bg-muted"
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground ml-1">({c.distrito})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {formData.concelhoId && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-success-700"><CheckCircle2 className="h-4 w-4" /> {formData.concelhoName} selecionado</p>
          )}
        </div>
      )}

      {/* Step: Property */}
      {step === 'property' && (
        <div className="space-y-6">
          <h2 className="font-display text-xl font-semibold text-ink">Que tipo de casa tens?</h2>
          
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Tipo de imóvel
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setFormData({ ...formData, propertyType: type })}
                  className={`rounded-lg border p-3 text-sm transition ${
                    formData.propertyType === type
                      ? 'border-primary bg-primary-50 text-primary font-medium'
                      : 'border-border bg-card hover:border-primary-200'
                  }`}
                >
                  {propertyTypeLabels[type] || type}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Qual é a tua situação?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OWNERSHIP_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setFormData({ ...formData, ownershipType: type })}
                  className={`rounded-lg border p-3 text-sm transition ${
                    formData.ownershipType === type
                      ? 'border-primary bg-primary-50 text-primary font-medium'
                      : 'border-border bg-card hover:border-primary-200'
                  }`}
                >
                  {ownershipTypeLabels[type] || type}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Ano de construção (opcional)
            </label>
            <input
              type="number"
              value={formData.buildingYear || ''}
              onChange={(e) => setFormData({ ...formData, buildingYear: parseInt(e.target.value) || undefined })}
              placeholder="Ex: 1985"
              min="1800"
              max={new Date().getFullYear()}
              className="w-full rounded-lg border border-input bg-card p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )}

      {/* Step: Situation */}
      {step === 'situation' && (
        <div className="space-y-6">
          <h2 className="font-display text-xl font-semibold text-ink">A tua situação</h2>
          <p className="text-muted-foreground">Estas informações são opcionais mas ajudam a encontrar apoios específicos.</p>
          
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Número de pessoas no agregado
            </label>
            <input
              type="number"
              value={formData.householdSize || ''}
              onChange={(e) => setFormData({ ...formData, householdSize: parseInt(e.target.value) || undefined })}
              placeholder="Ex: 3"
              min="1"
              className="w-full rounded-lg border border-input bg-card p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.socialTariff}
                onChange={(e) => setFormData({ ...formData, socialTariff: e.target.checked })}
                className="h-5 w-5 rounded border-input text-primary focus:ring-primary"
              />
              <div>
                <span className="font-medium text-ink">Tenho tarifa social de energia</span>
                <p className="text-sm text-muted-foreground">Alguns programas dão prioridade a beneficiários da tarifa social</p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Step: Measures */}
      {step === 'measures' && (
        <div className="space-y-6">
          <h2 className="font-display text-xl font-semibold text-ink">Que obras queres fazer?</h2>
          <p className="text-muted-foreground">Seleciona os tipos de intervenção que te interessam.</p>
          
          <div className="space-y-2">
            {MEASURE_TYPES.map((measure) => (
              <label
                key={measure}
                className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition ${
                  formData.desiredMeasures.includes(measure)
                    ? 'border-primary bg-primary-50'
                    : 'border-border bg-card hover:border-primary-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.desiredMeasures.includes(measure)}
                  onChange={() => toggleMeasure(measure)}
                  className="h-5 w-5 rounded border-input text-primary focus:ring-primary"
                />
                <span className="font-medium text-ink">
                  {measureTypeLabels[measure] || measure}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex gap-4">
        {step !== 'location' && (
          <button
            onClick={prevStep}
            className="flex items-center gap-2 rounded-lg border border-input bg-card px-4 py-3 font-medium text-ink transition hover:border-primary-300 hover:bg-primary-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>
        )}
        
        <button
          onClick={nextStep}
          disabled={!canProceed() || isLoading}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              A verificar...
            </>
          ) : step === 'measures' ? (
            'Ver resultados'
          ) : (
            <>
              Continuar
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
