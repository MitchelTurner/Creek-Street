import { Module } from '@nestjs/common';
import { GeoModule } from '../geo/geo.module';
import { Phase1Module } from '../phase1/phase1.module';
import { ApplicantStore } from './applicant.store';
import { AuthGuard } from './auth.guard';
import { PdfService } from './pdf.service';
import { Phase2Controller } from './phase2.controller';
import { Phase2Service } from './phase2.service';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [Phase1Module, GeoModule],
  controllers: [Phase2Controller],
  providers: [ApplicantStore, AuthGuard, RolesGuard, PdfService, Phase2Service],
  exports: [ApplicantStore, AuthGuard, RolesGuard, Phase2Service],
})
export class Phase2Module {}
