import { Controller, Get, Header, Query } from '@nestjs/common';
import { GeoService } from './geo.service';
import { EmbeddingPersistService } from './embedding.persist';

@Controller('geo')
export class GeoController {
  constructor(
    private readonly geo: GeoService,
    private readonly embeddings: EmbeddingPersistService,
  ) {}

  @Get('status')
  @Header('Cache-Control', 'no-store')
  status() {
    return this.geo.status();
  }

  @Get('notice-set')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  async noticeSet(@Query('parcelId') parcelId?: string) {
    if (!parcelId) {
      return { found: false, message: 'parcelId required' };
    }
    const subject = this.geo.resolveSubjectParcel({ parcelId });
    if (!subject) return { found: false, message: 'Parcel not found' };
    const result = await this.geo.parcelsWithinNotice(parcelId);
    return {
      found: true,
      subjectParcelId: parcelId,
      ...result,
    };
  }

  @Get('embeddings/status')
  @Header('Cache-Control', 'no-store')
  embeddingsStatus() {
    return this.embeddings.status();
  }
}
