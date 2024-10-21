import { Module } from '@nestjs/common';
import { SrpService } from './srp.service';

@Module({
  providers: [SrpService],
  exports: [SrpService],
})
export class SrpModule {}
