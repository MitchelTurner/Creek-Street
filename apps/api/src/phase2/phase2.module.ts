import { Module } from '@nestjs/common';
import { GeoModule } from '../geo/geo.module';
import { Phase1Module } from '../phase1/phase1.module';
import { AuthModule } from './auth.module';
import { PdfService } from './pdf.service';
import { Phase2Controller } from './phase2.controller';
import { Phase2Service } from './phase2.service';

@Module({
  imports: [Phase1Module, GeoModule, AuthModule],
  controllers: [Phase2Controller],
  providers: [PdfService, Phase2Service],
  exports: [AuthModule, Phase2Service],
})
export class Phase2Module {}
