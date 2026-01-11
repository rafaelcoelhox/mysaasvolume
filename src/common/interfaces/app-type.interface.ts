export type AppCategory =
  | 'content-platform'
  | 'marketplace'
  | 'saas-b2b'
  | 'saas-b2c'
  | 'e-commerce'
  | 'social-network'
  | 'fintech'
  | 'edtech'
  | 'healthtech'
  | 'developer-tools';

export interface AppFeature {
  id: string;
  name: string;
  description: string;
  impactOnRequests: number; // multiplicador (1.0 = sem impacto, 1.5 = +50%)
  impactOnStorage: number;
  impactOnBandwidth: number;
  requiresRealtime?: boolean;
  requiresMediaUpload?: boolean;
}

export interface AppBenchmark {
  category: AppCategory;
  name: string;
  description: string;

  // Ratios de uso
  readWriteRatio: number; // 0.85 = 85% reads, 15% writes
  dauMauRatio: number; // DAU / MAU (0.25 = 25% dos MAU são DAU)
  peakMultiplier: number; // pico vs média (3 = pico é 3x a média)

  // Métricas por usuário ativo
  avgRequestsPerDAU: number; // requests por dia por usuário
  avgSessionDuration: number; // minutos
  avgSessionsPerDay: number;
  avgPageViewsPerSession: number;

  // Storage
  avgPageSize: number; // KB
  storagePerUser: number; // MB (perfil, preferências, etc)
  storagePerContentItem: number; // MB (post, produto, documento)
  avgContentItemsPerUser: number;

  // Features típicas
  typicalFeatures: string[];

  // Exemplos reais
  realWorldExamples: string[];

  // Fonte dos dados
  dataSource: string;
}

export interface UserInput {
  description: string;
  targetUsers: {
    month6: number;
    month12: number;
    month24: number;
  };
  region: 'brazil' | 'latam' | 'us' | 'europe' | 'global';
  features: string[];
  hasMediaUpload: boolean;
  avgMediaSizeMB?: number;
  hasRealtime: boolean;
  referenceApps?: string[];
}

export interface EstimateResult {
  appType: AppCategory;
  confidence: number; // 0-1

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
    conservative: EstimateScenario;
    moderate: EstimateScenario;
    optimistic: EstimateScenario;
  };
}

export interface EstimateScenario {
  multiplier: number;
  requests: number;
  storageGB: number;
  bandwidthGB: number;
  monthlyCostUSD: number;
}
