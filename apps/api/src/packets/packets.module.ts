import { Module } from '@nestjs/common';
import { MeetingPacketService } from './meeting-packet.service';
import { PacketsController } from './packets.controller';

@Module({
  controllers: [PacketsController],
  providers: [MeetingPacketService],
  exports: [MeetingPacketService],
})
export class PacketsModule {}
