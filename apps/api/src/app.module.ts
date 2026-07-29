import { Module } from '@nestjs/common';
import { GeoModule } from './geo/geo.module';
import { IngestModule } from './ingest/ingest.module';
import { OpsModule } from './ops/ops.module';
import { Phase1Module } from './phase1/phase1.module';
import { Phase2Module } from './phase2/phase2.module';
import { Phase3Module } from './phase3/phase3.module';
import { Phase4Module } from './phase4/phase4.module';
import { PrismaModule } from './prisma/prisma.module';
import { PublicModule } from './public/public.module';
import { StoreModule } from './store/store.module';

@Module({
  imports: [
    OpsModule,
    PrismaModule,
    StoreModule,
    PublicModule,
    Phase1Module,
    Phase2Module,
    Phase3Module,
    Phase4Module,
    IngestModule,
    GeoModule,
  ],
})
export class AppModule {}
