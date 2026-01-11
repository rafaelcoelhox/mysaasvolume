import { Injectable } from '@nestjs/common';
import { AppBenchmark, AppCategory, AppFeature } from '../common/interfaces/app-type.interface';
import { APP_BENCHMARKS, APP_FEATURES, REGION_MULTIPLIERS } from './data/benchmarks.data';

@Injectable()
export class BenchmarksService {
  getBenchmarkByCategory(category: AppCategory): AppBenchmark | undefined {
    return APP_BENCHMARKS.find((b) => b.category === category);
  }

  getAllBenchmarks(): AppBenchmark[] {
    return APP_BENCHMARKS;
  }

  getAllCategories(): { id: AppCategory; name: string; description: string }[] {
    return APP_BENCHMARKS.map((b) => ({
      id: b.category,
      name: b.name,
      description: b.description,
    }));
  }

  getFeatureById(featureId: string): AppFeature | undefined {
    return APP_FEATURES.find((f) => f.id === featureId);
  }

  getAllFeatures(): AppFeature[] {
    return APP_FEATURES;
  }

  getRegionConfig(region: keyof typeof REGION_MULTIPLIERS) {
    return REGION_MULTIPLIERS[region];
  }

  /**
   * Encontra o benchmark mais similar baseado em keywords
   */
  findSimilarBenchmark(keywords: string[]): AppBenchmark | null {
    const keywordLower = keywords.map((k) => k.toLowerCase());

    const scores = APP_BENCHMARKS.map((benchmark) => {
      let score = 0;

      // Check description
      keywordLower.forEach((kw) => {
        if (benchmark.description.toLowerCase().includes(kw)) score += 2;
        if (benchmark.name.toLowerCase().includes(kw)) score += 3;
        if (benchmark.realWorldExamples.some((ex) => ex.toLowerCase().includes(kw))) score += 5;
        if (benchmark.typicalFeatures.some((f) => f.toLowerCase().includes(kw))) score += 1;
      });

      return { benchmark, score };
    });

    const best = scores.sort((a, b) => b.score - a.score)[0];
    return best.score > 0 ? best.benchmark : null;
  }

  /**
   * Calcula o impacto das features selecionadas
   */
  calculateFeatureImpact(featureIds: string[]): {
    requestsMultiplier: number;
    storageMultiplier: number;
    bandwidthMultiplier: number;
  } {
    let requestsMultiplier = 1;
    let storageMultiplier = 1;
    let bandwidthMultiplier = 1;

    featureIds.forEach((featureId) => {
      const feature = this.getFeatureById(featureId);
      if (feature) {
        // Aplicar multiplicadores de forma não-linear (evitar explosão)
        requestsMultiplier *= Math.pow(feature.impactOnRequests, 0.7);
        storageMultiplier *= Math.pow(feature.impactOnStorage, 0.7);
        bandwidthMultiplier *= Math.pow(feature.impactOnBandwidth, 0.7);
      }
    });

    return {
      requestsMultiplier: Math.round(requestsMultiplier * 100) / 100,
      storageMultiplier: Math.round(storageMultiplier * 100) / 100,
      bandwidthMultiplier: Math.round(bandwidthMultiplier * 100) / 100,
    };
  }
}
