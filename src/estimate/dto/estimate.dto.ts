import { AppCategory } from '../../common/interfaces/app-type.interface';

/**
 * DTO para request de estimativa via descrição natural
 */
export class CreateEstimateFromDescriptionDto {
  /**
   * Descrição em linguagem natural do projeto
   * @example "Quero criar um app tipo Notion focado em gestão de receitas para restaurantes"
   */
  description: string;

  /**
   * Meta de usuários ativos mensais
   */
  targetUsers: {
    month6: number;
    month12: number;
  };

  /**
   * Região principal de operação
   */
  region: 'brazil' | 'latam' | 'us' | 'europe' | 'global';

  /**
   * Apps de referência (opcional)
   * @example ["notion.so", "airtable.com"]
   */
  referenceApps?: string[];
}

/**
 * DTO para request de estimativa direta (sem IA)
 */
export class CreateEstimateDto {
  /**
   * Tipo de aplicação
   */
  appType: AppCategory;

  /**
   * Usuários ativos mensais estimados
   */
  targetMAU: number;

  /**
   * Features selecionadas
   * @example ["auth", "real-time", "media-upload", "search"]
   */
  features: string[];

  /**
   * App terá upload de mídia?
   */
  hasMediaUpload: boolean;

  /**
   * Tamanho médio do arquivo de mídia em MB
   * @example 2.5
   */
  avgMediaSizeMB?: number;

  /**
   * App terá funcionalidades real-time?
   */
  hasRealtime: boolean;

  /**
   * Região principal
   */
  region: 'brazil' | 'latam' | 'us' | 'europe' | 'global';
}

/**
 * Resposta completa de estimativa
 */
export class EstimateResponseDto {
  /**
   * Análise da IA (se disponível)
   */
  analysis?: {
    appType: AppCategory;
    confidence: number;
    detectedFeatures: string[];
    suggestedFeatures: string[];
    reasoning: string;
  };

  /**
   * Estimativas de volume
   */
  estimate: {
    appType: AppCategory;
    confidence: number;

    requests: {
      avgPerSecond: number;
      peakPerSecond: number;
      monthlyTotal: number;
      readPercentage: number;
      writePercentage: number;
    };

    storage: {
      databaseGB: number;
      mediaStorageGB: number;
      totalGB: number;
      monthlyGrowthGB: number;
    };

    bandwidth: {
      monthlyGB: number;
      avgMbps: number;
    };

    users: {
      mau: number;
      dau: number;
      concurrentPeak: number;
    };

    scenarios: {
      conservative: ScenarioDto;
      moderate: ScenarioDto;
      optimistic: ScenarioDto;
    };
  };

  /**
   * Estimativas de custo por provider
   */
  pricing: {
    estimates: CloudPricingDto[];
    recommendedProvider: string;
    recommendation: string;
  };

  /**
   * Insights adicionais da IA (se disponível)
   */
  insights?: {
    insights: string[];
    risks: string[];
    recommendations: string[];
    scalingConsiderations: string[];
  };

  /**
   * Timeline de crescimento projetado
   */
  timeline?: {
    month1: TimelinePointDto;
    month6: TimelinePointDto;
    month12: TimelinePointDto;
  };
}

export class ScenarioDto {
  multiplier: number;
  requests: number;
  storageGB: number;
  bandwidthGB: number;
  monthlyCostUSD: number;
}

export class CloudPricingDto {
  provider: string;
  name: string;
  tier: string;
  monthlyTotal: number;
  breakdown: {
    compute: number;
    database: number;
    storage: number;
    bandwidth: number;
    other: number;
  };
  notes: string[];
}

export class TimelinePointDto {
  mau: number;
  requestsPerSecond: number;
  storageGB: number;
  estimatedCostUSD: number;
}
