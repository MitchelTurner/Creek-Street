import { Module } from '@nestjs/common';
import { GeoModule } from '../geo/geo.module';
import { OpenDataController } from './opendata.controller';
import { PublicController } from './public.controller';
import { ReadinessService } from './readiness.service';
import { SearchService } from './search.service';

@Module({
  imports: [GeoModule],
  controllers: [PublicController, OpenDataController],
  providers: [ReadinessService, SearchService],
  exports: [ReadinessService],
})
export class PublicModule {}
