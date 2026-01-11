import { Injectable } from '@nestjs/common';
import { EstimateResult } from '../common/interfaces/app-type.interface';

export interface CloudPricing {
  provider: string;
  name: string;
  monthlyTotal: number;
  breakdown: {
    compute: number;
    database: number;
    storage: number;
    bandwidth: number;
    other: number;
  };
  notes: string[];
  tier: string;
}

export interface PricingResult {
  estimates: CloudPricing[];
  recommendedProvider: string;
  recommendation: string;
}

/**
 * Preços aproximados das principais clouds (2024)
 * Esses valores são estimativas e devem ser atualizados periodicamente
 */
const CLOUD_PRICING = {
  vercel: {
    name: 'Vercel',
    // Pro plan: $20/mês base
    // Functions: $0.40 per 1M invocations
    // Bandwidth: $0.15 per GB after 1TB
    // Edge Functions: $2 per 1M invocations
    tiers: {
      hobby: { base: 0, functionsPerMillion: 0, bandwidthPerGB: 0, limitGB: 100 },
      pro: { base: 20, functionsPerMillion: 0.4, bandwidthPerGB: 0.15, limitGB: 1000 },
      enterprise: { base: 500, functionsPerMillion: 0.2, bandwidthPerGB: 0.1, limitGB: 5000 },
    },
  },
  railway: {
    name: 'Railway',
    // $5/mês por serviço base
    // $0.000463/GB-hour de RAM
    // $0.000231/vCPU-hour
    // Egress: $0.10 per GB
    tiers: {
      hobby: { base: 5, ramPerGBHour: 0.000463, cpuPerHour: 0.000231, egressPerGB: 0.1 },
      pro: { base: 20, ramPerGBHour: 0.000463, cpuPerHour: 0.000231, egressPerGB: 0.1 },
    },
  },
  aws: {
    name: 'AWS',
    // EC2 t3.small: ~$15/mês
    // RDS db.t3.micro: ~$15/mês
    // S3: $0.023/GB
    // CloudFront: $0.085/GB
    tiers: {
      small: { ec2: 15, rds: 15, s3PerGB: 0.023, cfPerGB: 0.085 },
      medium: { ec2: 50, rds: 50, s3PerGB: 0.023, cfPerGB: 0.085 },
      large: { ec2: 150, rds: 150, s3PerGB: 0.023, cfPerGB: 0.075 },
    },
  },
  supabase: {
    name: 'Supabase',
    // Free: 500MB DB, 1GB storage, 2GB bandwidth
    // Pro: $25/mês, 8GB DB, 100GB storage, 250GB bandwidth
    // Team: $599/mês
    tiers: {
      free: { base: 0, dbGB: 0.5, storageGB: 1, bandwidthGB: 2 },
      pro: { base: 25, dbGB: 8, storageGB: 100, bandwidthGB: 250, extraDBPerGB: 0.125, extraStoragePerGB: 0.021, extraBandwidthPerGB: 0.09 },
      team: { base: 599, dbGB: 50, storageGB: 500, bandwidthGB: 1000, extraDBPerGB: 0.125, extraStoragePerGB: 0.021, extraBandwidthPerGB: 0.09 },
    },
  },
  render: {
    name: 'Render',
    // Starter: $7/mês per service
    // PostgreSQL: starts at $7/mês
    // Bandwidth: $0.10/GB after 100GB
    tiers: {
      starter: { serviceBase: 7, dbBase: 7, bandwidthPerGB: 0.1, freeBandwidthGB: 100 },
      standard: { serviceBase: 25, dbBase: 25, bandwidthPerGB: 0.1, freeBandwidthGB: 500 },
    },
  },
  planetscale: {
    name: 'PlanetScale',
    // Scaler: $29/mês (10GB storage, 1B reads, 10M writes)
    // Extra storage: $2.50/GB
    tiers: {
      hobby: { base: 0, storageGB: 5, reads: 1_000_000_000, writes: 10_000_000 },
      scaler: { base: 29, storageGB: 10, reads: 1_000_000_000, writes: 10_000_000, extraStoragePerGB: 2.5 },
    },
  },
};

@Injectable()
export class PricingService {
  /**
   * Calcula o custo em todas as clouds baseado nas estimativas
   */
  calculatePricing(estimate: EstimateResult): PricingResult {
    const estimates: CloudPricing[] = [];

    // Vercel
    estimates.push(this.calculateVercelPricing(estimate));

    // Railway
    estimates.push(this.calculateRailwayPricing(estimate));

    // Supabase (Backend as a Service)
    estimates.push(this.calculateSupabasePricing(estimate));

    // Render
    estimates.push(this.calculateRenderPricing(estimate));

    // AWS (DIY)
    estimates.push(this.calculateAWSPricing(estimate));

    // Ordenar por preço
    estimates.sort((a, b) => a.monthlyTotal - b.monthlyTotal);

    // Gerar recomendação
    const recommended = this.generateRecommendation(estimate, estimates);

    return {
      estimates,
      recommendedProvider: recommended.provider,
      recommendation: recommended.text,
    };
  }

  private calculateVercelPricing(estimate: EstimateResult): CloudPricing {
    const { requests, bandwidth, storage } = estimate;

    // Determinar tier
    let tier = 'hobby';
    let pricing = CLOUD_PRICING.vercel.tiers.hobby;

    if (requests.monthlyTotal > 100_000 || bandwidth.monthlyGB > 100) {
      tier = 'pro';
      pricing = CLOUD_PRICING.vercel.tiers.pro;
    }
    if (requests.monthlyTotal > 10_000_000 || bandwidth.monthlyGB > 1000) {
      tier = 'enterprise';
      pricing = CLOUD_PRICING.vercel.tiers.enterprise;
    }

    const compute = pricing.base;
    const functionsMillions = requests.monthlyTotal / 1_000_000;
    const functionsCost = functionsMillions * pricing.functionsPerMillion;

    const excessBandwidth = Math.max(0, bandwidth.monthlyGB - pricing.limitGB);
    const bandwidthCost = excessBandwidth * pricing.bandwidthPerGB;

    // Vercel não inclui DB/storage - precisa de serviço externo
    const databaseCost = storage.databaseGB > 5 ? 25 : 0; // Supabase/Neon
    const storageCost = storage.mediaStorageGB * 0.02; // R2/S3

    const notes: string[] = [];
    if (tier === 'hobby') {
      notes.push('Free tier - limitado a projetos pessoais');
    }
    notes.push('Não inclui banco de dados (usar Supabase, Neon, ou PlanetScale)');
    if (storage.mediaStorageGB > 0) {
      notes.push('Storage de mídia via Cloudflare R2 ou S3');
    }

    return {
      provider: 'vercel',
      name: 'Vercel',
      tier,
      monthlyTotal: Math.round((compute + functionsCost + bandwidthCost + databaseCost + storageCost) * 100) / 100,
      breakdown: {
        compute: Math.round(compute * 100) / 100,
        database: Math.round(databaseCost * 100) / 100,
        storage: Math.round(storageCost * 100) / 100,
        bandwidth: Math.round((functionsCost + bandwidthCost) * 100) / 100,
        other: 0,
      },
      notes,
    };
  }

  private calculateRailwayPricing(estimate: EstimateResult): CloudPricing {
    const { requests, bandwidth, storage, users } = estimate;

    const tier = requests.avgPerSecond > 10 ? 'pro' : 'hobby';
    const pricing = CLOUD_PRICING.railway.tiers[tier];

    // Estimar recursos necessários
    const ramGB = Math.max(0.5, users.concurrentPeak / 500); // ~500 concurrent per GB RAM
    const cpuHours = 730; // horas por mês

    const computeCost = pricing.base + (ramGB * cpuHours * pricing.ramPerGBHour);
    const bandwidthCost = bandwidth.monthlyGB * pricing.egressPerGB;

    // Railway Postgres add-on
    const databaseCost = storage.databaseGB > 1 ? 10 + (storage.databaseGB * 0.5) : 5;

    // Volume storage
    const storageCost = storage.mediaStorageGB * 0.1;

    const notes: string[] = [
      'Inclui PostgreSQL como add-on',
      'Pricing por uso (RAM + CPU)',
      'Boa opção para MVPs e projetos menores',
    ];

    return {
      provider: 'railway',
      name: 'Railway',
      tier,
      monthlyTotal: Math.round((computeCost + databaseCost + storageCost + bandwidthCost) * 100) / 100,
      breakdown: {
        compute: Math.round(computeCost * 100) / 100,
        database: Math.round(databaseCost * 100) / 100,
        storage: Math.round(storageCost * 100) / 100,
        bandwidth: Math.round(bandwidthCost * 100) / 100,
        other: 0,
      },
      notes,
    };
  }

  private calculateSupabasePricing(estimate: EstimateResult): CloudPricing {
    const { storage, bandwidth } = estimate;

    // Determinar tier
    let tier = 'free';
    let pricing: any = CLOUD_PRICING.supabase.tiers.free;

    if (storage.databaseGB > 0.5 || bandwidth.monthlyGB > 2) {
      tier = 'pro';
      pricing = CLOUD_PRICING.supabase.tiers.pro;
    }
    if (storage.databaseGB > 8 || bandwidth.monthlyGB > 250) {
      tier = 'team';
      pricing = CLOUD_PRICING.supabase.tiers.team;
    }

    let totalCost = pricing.base;

    if (tier !== 'free') {
      const extraDB = Math.max(0, storage.databaseGB - pricing.dbGB);
      const extraStorage = Math.max(0, storage.mediaStorageGB - pricing.storageGB);
      const extraBandwidth = Math.max(0, bandwidth.monthlyGB - pricing.bandwidthGB);

      totalCost += extraDB * (pricing.extraDBPerGB || 0);
      totalCost += extraStorage * (pricing.extraStoragePerGB || 0);
      totalCost += extraBandwidth * (pricing.extraBandwidthPerGB || 0);
    }

    const notes: string[] = [
      'All-in-one: Auth, Database, Storage, Realtime',
      'Ótimo para MVPs e startups',
      tier === 'free' ? 'Limitações do free tier podem exigir upgrade rápido' : 'Inclui backups diários',
    ];

    return {
      provider: 'supabase',
      name: 'Supabase',
      tier,
      monthlyTotal: Math.round(totalCost * 100) / 100,
      breakdown: {
        compute: Math.round((pricing.base * 0.4) * 100) / 100,
        database: Math.round((pricing.base * 0.4) * 100) / 100,
        storage: Math.round((totalCost - pricing.base) * 0.5 * 100) / 100,
        bandwidth: Math.round((totalCost - pricing.base) * 0.5 * 100) / 100,
        other: 0,
      },
      notes,
    };
  }

  private calculateRenderPricing(estimate: EstimateResult): CloudPricing {
    const { bandwidth, storage, requests } = estimate;

    const tier = requests.avgPerSecond > 5 ? 'standard' : 'starter';
    const pricing = CLOUD_PRICING.render.tiers[tier];

    const computeCost = pricing.serviceBase;
    const databaseCost = pricing.dbBase + (storage.databaseGB > 1 ? storage.databaseGB * 2 : 0);

    const excessBandwidth = Math.max(0, bandwidth.monthlyGB - pricing.freeBandwidthGB);
    const bandwidthCost = excessBandwidth * pricing.bandwidthPerGB;

    // Disk storage
    const storageCost = storage.mediaStorageGB * 0.15;

    const notes: string[] = [
      'Setup simples, boa DX',
      'PostgreSQL managed incluso',
      'Auto-scaling disponível no tier pago',
    ];

    return {
      provider: 'render',
      name: 'Render',
      tier,
      monthlyTotal: Math.round((computeCost + databaseCost + storageCost + bandwidthCost) * 100) / 100,
      breakdown: {
        compute: Math.round(computeCost * 100) / 100,
        database: Math.round(databaseCost * 100) / 100,
        storage: Math.round(storageCost * 100) / 100,
        bandwidth: Math.round(bandwidthCost * 100) / 100,
        other: 0,
      },
      notes,
    };
  }

  private calculateAWSPricing(estimate: EstimateResult): CloudPricing {
    const { bandwidth, storage, requests, users } = estimate;

    // Determinar tier baseado no volume
    let tier = 'small';
    if (requests.avgPerSecond > 10 || users.concurrentPeak > 500) {
      tier = 'medium';
    }
    if (requests.avgPerSecond > 50 || users.concurrentPeak > 2000) {
      tier = 'large';
    }

    const pricing = CLOUD_PRICING.aws.tiers[tier];

    const computeCost = pricing.ec2;
    const databaseCost = pricing.rds + (storage.databaseGB > 20 ? (storage.databaseGB - 20) * 0.1 : 0);
    const storageCost = storage.mediaStorageGB * pricing.s3PerGB;
    const bandwidthCost = bandwidth.monthlyGB * pricing.cfPerGB;

    // Custos adicionais AWS
    const otherCosts = 10; // Route53, CloudWatch, etc

    const notes: string[] = [
      'Máxima flexibilidade e controle',
      'Requer mais conhecimento de DevOps',
      'Free tier disponível para novos usuários (12 meses)',
      'Considere usar AWS Amplify para simplificar',
    ];

    return {
      provider: 'aws',
      name: 'AWS (DIY)',
      tier,
      monthlyTotal: Math.round((computeCost + databaseCost + storageCost + bandwidthCost + otherCosts) * 100) / 100,
      breakdown: {
        compute: Math.round(computeCost * 100) / 100,
        database: Math.round(databaseCost * 100) / 100,
        storage: Math.round(storageCost * 100) / 100,
        bandwidth: Math.round(bandwidthCost * 100) / 100,
        other: otherCosts,
      },
      notes,
    };
  }

  private generateRecommendation(
    estimate: EstimateResult,
    pricings: CloudPricing[],
  ): { provider: string; text: string } {
    const { requests, storage, users } = estimate;

    // Lógica de recomendação baseada no perfil do projeto
    const isSmallProject = users.mau < 1000 && requests.avgPerSecond < 1;
    const isMediumProject = users.mau >= 1000 && users.mau < 50000;
    const isLargeProject = users.mau >= 50000;

    const needsRealtime = estimate.requests.writePercentage > 30;
    const heavyMedia = storage.mediaStorageGB > 50;

    if (isSmallProject) {
      return {
        provider: 'supabase',
        text: 'Para projetos iniciais, Supabase oferece o melhor custo-benefício com auth, database, storage e realtime inclusos. Comece no free tier e escale conforme cresce.',
      };
    }

    if (isMediumProject && needsRealtime) {
      return {
        provider: 'supabase',
        text: 'Supabase Pro é ideal para seu volume com necessidade de realtime. A combinação de PostgreSQL + Realtime subscriptions atende bem esse caso de uso.',
      };
    }

    if (isMediumProject && !heavyMedia) {
      return {
        provider: 'railway',
        text: 'Railway oferece boa relação custo/simplicidade para projetos médios. O pricing por uso permite otimizar custos conforme a demanda real.',
      };
    }

    if (isLargeProject || heavyMedia) {
      return {
        provider: 'aws',
        text: 'Para seu volume, AWS oferece melhor escalabilidade e controle de custos a longo prazo. Considere usar serviços managed (RDS, ElastiCache, S3) para reduzir overhead operacional.',
      };
    }

    // Default: mais barato
    return {
      provider: pricings[0].provider,
      text: `${pricings[0].name} é a opção mais econômica para seu caso de uso atual. Monitore o crescimento e reavalie em 3-6 meses.`,
    };
  }
}
