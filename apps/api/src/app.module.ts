import { Module } from '@nestjs/common';
import { PublicModule } from './public/public.module';
import { StoreModule } from './store/store.module';

@Module({
  imports: [StoreModule, PublicModule],
})
export class AppModule {}
