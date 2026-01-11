import { Module } from '@nestjs/common';
import { BenchmarksModule } from '../benchmarks/benchmarks.module';
import { EstimateService } from './estimate.service';

@Module({
  imports: [BenchmarksModule],
  providers: [EstimateService],
  exports: [EstimateService],
})
export class EstimateModule {}
