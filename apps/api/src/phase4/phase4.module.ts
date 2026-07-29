import { Module } from '@nestjs/common';
import { Phase2Module } from '../phase2/phase2.module';
import { Phase4Controller } from './phase4.controller';
import { Phase4Service } from './phase4.service';

@Module({
  imports: [Phase2Module],
  controllers: [Phase4Controller],
  providers: [Phase4Service],
  exports: [Phase4Service],
})
export class Phase4Module {}
