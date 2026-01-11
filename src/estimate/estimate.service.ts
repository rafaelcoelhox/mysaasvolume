import { Injectable } from '@nestjs/common';
import { BenchmarksService } from '../benchmarks/benchmarks.service';
import {
  AppCategory,
  EstimateResult,
  EstimateScenario,
  UserInput,
} from '../common/interfaces/app-type.interface';

export interface EstimateInput {
  appType: AppCategory;
  targetMAU: number; // usuários ativos mensais
  features: string[];
  hasMediaUpload: boolean;
  avgMediaSizeMB: number;
  hasRealtime: boolean;
  region: 'brazil' | 'latam' | 'us' | 'europe' | 'global';
}

@Injectable()
export class EstimateService {
  constructor(private readonly benchmarksService: BenchmarksService) {}

  /**
   * Gera estimativas completas baseadas no input do usuário
   */
  generateEstimate(input: EstimateInput): EstimateResult {
    const benchmark = this.benchmarksService.getBenchmarkByCategory(input.appType);

    if (!benchmark) {
      throw new Error(`Benchmark não encontrado para categoria: ${input.appType}`);
    }

    // Calcular impacto das features
    const featureImpact = this.benchmarksService.calculateFeatureImpact(input.features);

    // Calcular DAU baseado no ratio do benchmark
    const dau = Math.round(input.targetMAU * benchmark.dauMauRatio);

    // Calcular usuários concorrentes no pico
    // Assumindo que o pico dura ~4 horas e 60% dos DAU estão ativos nesse período
    const concurrentPeak = Math.round((dau * 0.6) / 4);

    // ========== REQUESTS ==========
    const baseRequestsPerDay = dau * benchmark.avgRequestsPerDAU * featureImpact.requestsMultiplier;

    // Adicionar overhead de real-time (WebSocket connections geram mais requests)
    const realtimeMultiplier = input.hasRealtime ? 1.5 : 1;
    const totalRequestsPerDay = baseRequestsPerDay * realtimeMultiplier;

    const avgRequestsPerSecond = totalRequestsPerDay / 86400;
    const peakRequestsPerSecond = avgRequestsPerSecond * benchmark.peakMultiplier;
    const monthlyRequests = totalRequestsPerDay * 30;

    // ========== STORAGE ==========
    // Storage de banco (usuários + conteúdo)
    const userStorageMB = input.targetMAU * benchmark.storagePerUser;
    const contentStorageMB =
      input.targetMAU * benchmark.avgContentItemsPerUser * benchmark.storagePerContentItem;

    // Storage de mídia (se aplicável)
    let mediaStorageMB = 0;
    if (input.hasMediaUpload) {
      // Estimar que cada usuário faz X uploads por mês
      const uploadsPerUserPerMonth = benchmark.avgContentItemsPerUser * 0.3;
      mediaStorageMB = input.targetMAU * uploadsPerUserPerMonth * input.avgMediaSizeMB;
    }

    const totalDatabaseGB = ((userStorageMB + contentStorageMB) * featureImpact.storageMultiplier) / 1024;
    const totalMediaGB = mediaStorageMB / 1024;
    const totalStorageGB = totalDatabaseGB + totalMediaGB;

    // Crescimento mensal (assumindo 10% de crescimento de usuários)
    const monthlyGrowthGB = totalStorageGB * 0.1;

    // ========== BANDWIDTH ==========
    // Pageviews por mês
    const pageviewsPerMonth = dau * benchmark.avgSessionsPerDay * benchmark.avgPageViewsPerSession * 30;

    // Bandwidth de páginas (em KB)
    const pageBandwidthKB = pageviewsPerMonth * benchmark.avgPageSize;

    // Bandwidth de mídia (assumindo que 30% do conteúdo é acessado)
    const mediaBandwidthKB = input.hasMediaUpload
      ? mediaStorageMB * 1024 * 0.3 // 30% do storage é servido por mês
      : 0;

    const totalBandwidthGB =
      ((pageBandwidthKB + mediaBandwidthKB) * featureImpact.bandwidthMultiplier) / 1024 / 1024;

    // Bandwidth médio em Mbps
    const avgBandwidthMbps = (totalBandwidthGB * 8 * 1024) / (30 * 24 * 3600);

    // ========== CENÁRIOS ==========
    const scenarios = this.generateScenarios(
      avgRequestsPerSecond,
      totalStorageGB,
      totalBandwidthGB,
    );

    return {
      appType: input.appType,
      confidence: 0.75, // TODO: calcular baseado na qualidade dos inputs

      requests: {
        avgPerSecond: Math.round(avgRequestsPerSecond * 100) / 100,
        peakPerSecond: Math.round(peakRequestsPerSecond * 100) / 100,
        monthlyTotal: Math.round(monthlyRequests),
        readPercentage: Math.round(benchmark.readWriteRatio * 100),
        writePercentage: Math.round((1 - benchmark.readWriteRatio) * 100),
      },

      storage: {
        databaseGB: Math.round(totalDatabaseGB * 100) / 100,
        mediaStorageGB: Math.round(totalMediaGB * 100) / 100,
        totalGB: Math.round(totalStorageGB * 100) / 100,
        monthlyGrowthGB: Math.round(monthlyGrowthGB * 100) / 100,
      },

      bandwidth: {
        monthlyGB: Math.round(totalBandwidthGB * 100) / 100,
        avgMbps: Math.round(avgBandwidthMbps * 1000) / 1000,
      },

      users: {
        mau: input.targetMAU,
        dau,
        concurrentPeak,
      },

      scenarios,
    };
  }

  /**
   * Gera os 3 cenários (conservador, moderado, otimista)
   */
  private generateScenarios(
    avgRequests: number,
    storageGB: number,
    bandwidthGB: number,
  ): {
    conservative: EstimateScenario;
    moderate: EstimateScenario;
    optimistic: EstimateScenario;
  } {
    return {
      conservative: {
        multiplier: 0.7,
        requests: Math.round(avgRequests * 0.7 * 100) / 100,
        storageGB: Math.round(storageGB * 0.7 * 100) / 100,
        bandwidthGB: Math.round(bandwidthGB * 0.7 * 100) / 100,
        monthlyCostUSD: 0, // será preenchido pelo PricingService
      },
      moderate: {
        multiplier: 1.0,
        requests: Math.round(avgRequests * 100) / 100,
        storageGB: Math.round(storageGB * 100) / 100,
        bandwidthGB: Math.round(bandwidthGB * 100) / 100,
        monthlyCostUSD: 0,
      },
      optimistic: {
        multiplier: 1.5,
        requests: Math.round(avgRequests * 1.5 * 100) / 100,
        storageGB: Math.round(storageGB * 1.5 * 100) / 100,
        bandwidthGB: Math.round(bandwidthGB * 1.5 * 100) / 100,
        monthlyCostUSD: 0,
      },
    };
  }

  /**
   * Calcula estimativas para diferentes horizontes de tempo
   */
  generateTimelineEstimates(
    input: EstimateInput,
    growthRate: number = 0.15, // 15% de crescimento mensal
  ): {
    month1: EstimateResult;
    month6: EstimateResult;
    month12: EstimateResult;
  } {
    const month1 = this.generateEstimate(input);

    const inputMonth6 = {
      ...input,
      targetMAU: Math.round(input.targetMAU * Math.pow(1 + growthRate, 5)),
    };
    const month6 = this.generateEstimate(inputMonth6);

    const inputMonth12 = {
      ...input,
      targetMAU: Math.round(input.targetMAU * Math.pow(1 + growthRate, 11)),
    };
    const month12 = this.generateEstimate(inputMonth12);

    return { month1, month6, month12 };
  }
}
