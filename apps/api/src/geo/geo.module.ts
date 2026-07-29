import { Module } from '@nestjs/common';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';
import { EmbeddingPersistService } from './embedding.persist';

@Module({
  controllers: [GeoController],
  providers: [GeoService, EmbeddingPersistService],
  exports: [GeoService, EmbeddingPersistService],
})
export class GeoModule {}
