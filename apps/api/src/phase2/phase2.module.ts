import { Module } from '@nestjs/common';
import { Phase1Module } from '../phase1/phase1.module';
import { ApplicantStore } from './applicant.store';
import { AuthGuard } from './auth.guard';
import { PdfService } from './pdf.service';
import { Phase2Controller } from './phase2.controller';
import { Phase2Service } from './phase2.service';

@Module({
  imports: [Phase1Module],
  controllers: [Phase2Controller],
  providers: [ApplicantStore, AuthGuard, PdfService, Phase2Service],
  exports: [ApplicantStore, Phase2Service],
})
export class Phase2Module {}
