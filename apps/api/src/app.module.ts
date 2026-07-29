import { Module } from '@nestjs/common';
import { Phase1Module } from './phase1/phase1.module';
import { Phase2Module } from './phase2/phase2.module';
import { Phase3Module } from './phase3/phase3.module';
import { PublicModule } from './public/public.module';
import { StoreModule } from './store/store.module';

@Module({
  imports: [StoreModule, PublicModule, Phase1Module, Phase2Module, Phase3Module],
})
export class AppModule {}
