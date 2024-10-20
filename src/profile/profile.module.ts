import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';

@Module({
  imports: [UserModule],
  controllers: [ProfileController],
  providers: [UserService],
})
export class ProfileModule {}
