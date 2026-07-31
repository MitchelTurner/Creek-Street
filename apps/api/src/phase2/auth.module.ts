import { Global, Module } from '@nestjs/common';
import { ApplicantStore } from './applicant.store';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

/**
 * Global auth primitives so any controller can use @UseGuards(AuthGuard, RolesGuard)
 * without each feature module importing Phase2Module (avoids Packets/Compliance boot crashes).
 */
@Global()
@Module({
  providers: [ApplicantStore, AuthGuard, RolesGuard],
  exports: [ApplicantStore, AuthGuard, RolesGuard],
})
export class AuthModule {}
