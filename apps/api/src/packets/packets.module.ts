import { Module } from '@nestjs/common';
import { Phase2Module } from '../phase2/phase2.module';
import { MeetingPacketService } from './meeting-packet.service';
import { PacketsController } from './packets.controller';

@Module({
  imports: [Phase2Module],
  controllers: [PacketsController],
  providers: [MeetingPacketService],
  exports: [MeetingPacketService],
})
export class PacketsModule {}
