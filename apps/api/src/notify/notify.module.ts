import { Module } from '@nestjs/common';
import { Phase2Module } from '../phase2/phase2.module';
import { SubscriptionNotifyService } from './subscription.notify';

@Module({
  imports: [Phase2Module],
  providers: [SubscriptionNotifyService],
  exports: [SubscriptionNotifyService],
})
export class NotifyModule {}
