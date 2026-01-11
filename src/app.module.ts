import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BenchmarksModule } from './benchmarks/benchmarks.module';
import { EstimateModule } from './estimate/estimate.module';
import { PricingModule } from './pricing/pricing.module';
import { AIModule } from './ai/ai.module';
import { EstimateController } from './estimate/estimate.controller';
import { EstimateService } from './estimate/estimate.service';
import { PricingService } from './pricing/pricing.service';
import { AIService } from './ai/ai.service';
import { BenchmarksService } from './benchmarks/benchmarks.service';

@Module({
  imports: [BenchmarksModule, EstimateModule, PricingModule, AIModule],
  controllers: [AppController, EstimateController],
  providers: [
    AppService,
    EstimateService,
    PricingService,
    AIService,
    BenchmarksService,
  ],
})
export class AppModule {}
