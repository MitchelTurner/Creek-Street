import { Module } from '@nestjs/common';
import { Phase1Module } from './phase1/phase1.module';
import { PublicModule } from './public/public.module';
import { StoreModule } from './store/store.module';

@Module({
  imports: [StoreModule, PublicModule, Phase1Module],
})
export class AppModule {}
