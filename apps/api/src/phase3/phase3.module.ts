import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Phase1Module } from '../phase1/phase1.module';
import { Phase2Module } from '../phase2/phase2.module';
import { RolesGuard } from '../phase2/roles.guard';
import { BoardStore } from './board.store';
import { ContractGate } from './contract.gate';
import { MeetingPrepService } from './meeting-prep.service';
import { Phase3Controller } from './phase3.controller';
import { Phase3Service } from './phase3.service';

@Module({
  imports: [Phase1Module, Phase2Module],
  controllers: [Phase3Controller],
  providers: [
    ContractGate,
    BoardStore,
    Phase3Service,
    MeetingPrepService,
    RolesGuard,
    Reflector,
  ],
  exports: [ContractGate],
})
export class Phase3Module {}
