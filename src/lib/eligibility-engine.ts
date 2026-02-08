/**
 * Motor de Elegibilidade
 * 
 * Avalia se um utilizador é elegível para um programa com base nas regras definidas.
 * Cada programa tem regras em JSON que são avaliadas contra o perfil do utilizador/casa.
 */

export type EligibilityResult = 'ELIGIBLE' | 'MAYBE' | 'NOT_ELIGIBLE';

export interface ProgramRule {
  id: string;
  ruleKey: string;
  operator: string;
  value: unknown;
  description?: string | null;
  ruleType: string;
  priority: number;
}

export interface EligibilityCheck {
  concelhoId: string;
  propertyType: string;
  ownershipType: string;
  buildingYear?: number;
  householdSize?: number;
  annualIncome?: number;
  socialTariff?: boolean;
  desiredMeasures?: string[];
}

export interface RuleEvaluation {
  ruleId: string;
  ruleKey: string;
  passed: boolean;
  reason: string;
  required: boolean;
}

export interface EligibilityEvaluation {
  programId: string;
  programName: string;
  result: EligibilityResult;
  score: number; // 0-100
  evaluations: RuleEvaluation[];
  summary: string;
}

function isProgramRule(value: unknown): value is ProgramRule {
  if (!value || typeof value !== 'object') return false;
  const rule = value as Partial<ProgramRule>;
  return (
    typeof rule.id === 'string' &&
    typeof rule.ruleKey === 'string' &&
    typeof rule.operator === 'string' &&
    typeof rule.ruleType === 'string' &&
    typeof rule.priority === 'number'
  );
}

/**
 * Normaliza regras provenientes de JSON:
 * - Array de regras: [{...}]
 * - Objeto com "rules": { rules: [...] }
 * - Outro formato: []
 */
export function normalizeProgramRules(input: unknown): ProgramRule[] {
  if (Array.isArray(input)) {
    return input.filter(isProgramRule);
  }

  if (input && typeof input === 'object' && 'rules' in input) {
    const maybeRules = (input as { rules?: unknown }).rules;
    if (Array.isArray(maybeRules)) {
      return maybeRules.filter(isProgramRule);
    }
  }

  return [];
}

/**
 * Avalia uma regra individual contra os dados do utilizador
 */
function evaluateRule(
  rule: ProgramRule,
  userData: EligibilityCheck
): RuleEvaluation {
  const { ruleKey, operator, value, description } = rule;
  const ruleValue = value as unknown;
  
  let passed = false;
  let reason = description || '';
  let userValue: unknown = undefined;
  
  // Mapear ruleKey para campo do utilizador
  switch (ruleKey) {
    case 'ownership':
      userValue = userData.ownershipType;
      break;
    case 'property_type':
      userValue = userData.propertyType;
      break;
    case 'building_year':
      userValue = userData.buildingYear;
      break;
    case 'household_size':
      userValue = userData.householdSize;
      break;
    case 'annual_income':
      userValue = userData.annualIncome;
      break;
    case 'social_tariff':
      userValue = userData.socialTariff;
      break;
    case 'concelho':
      userValue = userData.concelhoId;
      break;
    default:
      // Regra desconhecida - assumir que passa (MAYBE)
      return {
        ruleId: rule.id,
        ruleKey,
        passed: true,
        reason: `Regra "${ruleKey}" não pôde ser verificada automaticamente`,
        required: false,
      };
  }
  
  // Se o utilizador não forneceu o dado, não podemos avaliar
  if (userValue === undefined || userValue === null) {
    return {
      ruleId: rule.id,
      ruleKey,
      passed: false,
      reason: reason || `Informação necessária não fornecida: ${ruleKey}`,
      required: rule.ruleType === 'ELIGIBILITY',
    };
  }
  
  // Avaliar operador
  switch (operator) {
    case '==':
      passed = userValue === ruleValue;
      break;
    case '!=':
      passed = userValue !== ruleValue;
      break;
    case '<':
      passed = typeof userValue === 'number' && userValue < (ruleValue as number);
      break;
    case '<=':
      passed = typeof userValue === 'number' && userValue <= (ruleValue as number);
      break;
    case '>':
      passed = typeof userValue === 'number' && userValue > (ruleValue as number);
      break;
    case '>=':
      passed = typeof userValue === 'number' && userValue >= (ruleValue as number);
      break;
    case 'in':
      passed = Array.isArray(ruleValue) && ruleValue.includes(userValue);
      break;
    case 'not_in':
      passed = Array.isArray(ruleValue) && !ruleValue.includes(userValue);
      break;
    case 'between':
      if (Array.isArray(ruleValue) && ruleValue.length === 2 && typeof userValue === 'number') {
        passed = userValue >= ruleValue[0] && userValue <= ruleValue[1];
      }
      break;
    default:
      passed = false;
      reason = `Operador desconhecido: ${operator}`;
  }
  
  return {
    ruleId: rule.id,
    ruleKey,
    passed,
    reason: passed ? `✓ ${reason}` : `✗ ${reason}`,
    required: rule.ruleType === 'ELIGIBILITY',
  };
}

/**
 * Avalia todas as regras de um programa para um utilizador
 */
export function evaluateEligibility(
  programId: string,
  programName: string,
  rulesInput: unknown,
  userData: EligibilityCheck
): EligibilityEvaluation {
  const rules = normalizeProgramRules(rulesInput);

  // Ordenar regras por prioridade
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);
  
  const evaluations: RuleEvaluation[] = [];
  let requiredPassed = 0;
  let requiredTotal = 0;
  let optionalPassed = 0;
  let optionalTotal = 0;
  
  for (const rule of sortedRules) {
    const evaluation = evaluateRule(rule, userData);
    evaluations.push(evaluation);
    
    if (evaluation.required) {
      requiredTotal++;
      if (evaluation.passed) requiredPassed++;
    } else {
      optionalTotal++;
      if (evaluation.passed) optionalPassed++;
    }
  }
  
  // Calcular resultado
  let result: EligibilityResult;
  let score: number;
  let summary: string;
  
  if (requiredTotal > 0 && requiredPassed < requiredTotal) {
    // Falhou em regras obrigatórias
    result = 'NOT_ELIGIBLE';
    score = Math.round((requiredPassed / requiredTotal) * 50);
    summary = `Não cumpre ${requiredTotal - requiredPassed} de ${requiredTotal} requisitos obrigatórios.`;
  } else if (requiredTotal === 0 || requiredPassed === requiredTotal) {
    // Passou em todas as obrigatórias
    if (optionalTotal === 0) {
      result = 'ELIGIBLE';
      score = 100;
      summary = 'Cumpre todos os requisitos verificados.';
    } else {
      const optionalRatio = optionalPassed / optionalTotal;
      if (optionalRatio >= 0.8) {
        result = 'ELIGIBLE';
        score = 80 + Math.round(optionalRatio * 20);
        summary = 'Cumpre todos os requisitos obrigatórios e a maioria dos opcionais.';
      } else if (optionalRatio >= 0.5) {
        result = 'MAYBE';
        score = 50 + Math.round(optionalRatio * 30);
        summary = 'Cumpre os requisitos obrigatórios mas pode haver condições adicionais.';
      } else {
        result = 'MAYBE';
        score = 50;
        summary = 'Cumpre os requisitos obrigatórios. Recomendamos verificar a sua situação junto da entidade.';
      }
    }
  } else {
    result = 'MAYBE';
    score = 50;
    summary = 'Não foi possível verificar todos os requisitos. Consulte os detalhes.';
  }
  
  return {
    programId,
    programName,
    result,
    score,
    evaluations,
    summary,
  };
}

/**
 * Gera uma explicação legível para o cidadão
 */
export function generateExplanation(evaluation: EligibilityEvaluation): string {
  const { result, summary, evaluations } = evaluation;
  
  const passed = evaluations.filter(e => e.passed);
  const failed = evaluations.filter(e => !e.passed);
  
  let explanation = '';
  
  switch (result) {
    case 'ELIGIBLE':
      explanation = `✅ **Provavelmente elegível**\n\n${summary}\n\n`;
      break;
    case 'MAYBE':
      explanation = `⚠️ **Talvez elegível**\n\n${summary}\n\n`;
      break;
    case 'NOT_ELIGIBLE':
      explanation = `❌ **Provavelmente não elegível**\n\n${summary}\n\n`;
      break;
  }
  
  if (passed.length > 0) {
    explanation += '**Requisitos cumpridos:**\n';
    for (const e of passed) {
      explanation += `• ${e.reason}\n`;
    }
    explanation += '\n';
  }
  
  if (failed.length > 0) {
    explanation += '**Requisitos não cumpridos ou não verificados:**\n';
    for (const e of failed) {
      explanation += `• ${e.reason}\n`;
    }
  }
  
  return explanation;
}
