import { Global, Module } from '@nestjs/common';
import { MemoryStore } from './memory.store';
import { PublicStore } from './public.store';

@Global()
@Module({
  providers: [MemoryStore, PublicStore],
  exports: [MemoryStore, PublicStore],
})
export class StoreModule {}
