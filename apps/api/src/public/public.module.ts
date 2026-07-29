import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { OpenDataController } from './opendata.controller';

@Module({
  controllers: [PublicController, OpenDataController],
})
export class PublicModule {}
