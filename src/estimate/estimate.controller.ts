import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { EstimateService, EstimateInput } from './estimate.service';
import { PricingService } from '../pricing/pricing.service';
import { AIService } from '../ai/ai.service';
import { BenchmarksService } from '../benchmarks/benchmarks.service';
import {
  CreateEstimateDto,
  CreateEstimateFromDescriptionDto,
  EstimateResponseDto,
} from './dto/estimate.dto';
import type { AppCategory } from '../common/interfaces/app-type.interface';

@Controller('api')
export class EstimateController {
  constructor(
    private readonly estimateService: EstimateService,
    private readonly pricingService: PricingService,
    private readonly aiService: AIService,
    private readonly benchmarksService: BenchmarksService,
  ) {}

  /**
   * Gera estimativas a partir de uma descrição em linguagem natural
   * A IA analisa a descrição e extrai as informações necessárias
   */
  @Post('estimate')
  async createEstimateFromDescription(
    @Body() dto: CreateEstimateFromDescriptionDto,
  ): Promise<EstimateResponseDto> {
    // 1. Analisar descrição com IA
    const analysis = await this.aiService.analyzeProjectDescription(dto.description);

    // 2. Construir input para estimativa
    const estimateInput: EstimateInput = {
      appType: analysis.appType,
      targetMAU: dto.targetUsers.month6,
      features: [...analysis.detectedFeatures, ...analysis.suggestedFeatures],
      hasMediaUpload: analysis.detectedFeatures.includes('media-upload'),
      avgMediaSizeMB: analysis.detectedFeatures.includes('video-streaming') ? 50 : 2,
      hasRealtime: analysis.detectedFeatures.includes('real-time') ||
        analysis.detectedFeatures.includes('chat') ||
        analysis.detectedFeatures.includes('collaboration'),
      region: dto.region,
    };

    // 3. Gerar estimativas
    const estimate = this.estimateService.generateEstimate(estimateInput);

    // 4. Calcular pricing
    const pricing = this.pricingService.calculatePricing(estimate);

    // 5. Gerar insights da IA
    const insights = await this.aiService.enhanceEstimate(
      dto.description,
      analysis.appType,
      dto.targetUsers.month6,
    );

    // 6. Gerar timeline
    const timeline = this.estimateService.generateTimelineEstimates(estimateInput);

    return {
      analysis: {
        appType: analysis.appType,
        confidence: analysis.confidence,
        detectedFeatures: analysis.detectedFeatures,
        suggestedFeatures: analysis.suggestedFeatures,
        reasoning: analysis.reasoning,
      },
      estimate,
      pricing,
      insights,
      timeline: {
        month1: {
          mau: timeline.month1.users.mau,
          requestsPerSecond: timeline.month1.requests.avgPerSecond,
          storageGB: timeline.month1.storage.totalGB,
          estimatedCostUSD: pricing.estimates[0]?.monthlyTotal || 0,
        },
        month6: {
          mau: timeline.month6.users.mau,
          requestsPerSecond: timeline.month6.requests.avgPerSecond,
          storageGB: timeline.month6.storage.totalGB,
          estimatedCostUSD: this.pricingService.calculatePricing(timeline.month6).estimates[0]?.monthlyTotal || 0,
        },
        month12: {
          mau: timeline.month12.users.mau,
          requestsPerSecond: timeline.month12.requests.avgPerSecond,
          storageGB: timeline.month12.storage.totalGB,
          estimatedCostUSD: this.pricingService.calculatePricing(timeline.month12).estimates[0]?.monthlyTotal || 0,
        },
      },
    };
  }

  /**
   * Gera estimativas a partir de inputs diretos (sem IA)
   */
  @Post('estimate/direct')
  async createEstimateDirect(
    @Body() dto: CreateEstimateDto,
  ): Promise<EstimateResponseDto> {
    const estimateInput: EstimateInput = {
      appType: dto.appType,
      targetMAU: dto.targetMAU,
      features: dto.features,
      hasMediaUpload: dto.hasMediaUpload,
      avgMediaSizeMB: dto.avgMediaSizeMB || 2,
      hasRealtime: dto.hasRealtime,
      region: dto.region,
    };

    const estimate = this.estimateService.generateEstimate(estimateInput);
    const pricing = this.pricingService.calculatePricing(estimate);

    return {
      estimate,
      pricing,
    };
  }

  /**
   * Retorna todas as categorias de aplicação disponíveis
   */
  @Get('categories')
  getCategories() {
    return {
      categories: this.benchmarksService.getAllCategories(),
    };
  }

  /**
   * Retorna todas as features disponíveis
   */
  @Get('features')
  getFeatures() {
    return {
      features: this.benchmarksService.getAllFeatures(),
    };
  }

  /**
   * Retorna os benchmarks de uma categoria específica
   */
  @Get('benchmarks')
  getBenchmarks(@Query('category') category?: string) {
    if (category) {
      const benchmark = this.benchmarksService.getBenchmarkByCategory(category as AppCategory);
      return { benchmark };
    }
    return { benchmarks: this.benchmarksService.getAllBenchmarks() };
  }

  /**
   * Health check
   */
  @Get('health')
  health() {
    return {
      status: 'ok',
      aiConfigured: this.aiService.isConfigured(),
      timestamp: new Date().toISOString(),
    };
  }
}
