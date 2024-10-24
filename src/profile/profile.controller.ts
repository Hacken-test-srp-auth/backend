import {
  Controller,
  Get,
  Body,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Patch,
} from '@nestjs/common';

import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileDto } from './dto/profile.dto';
import { JwtAuthGuard } from '../lib/guards/jwt.guard';
import { UserService } from '../user/user.service';
import { GetUserId } from '../lib/decorators/get-user-id.decorator';

@Controller('profile')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ProfileController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getProfile(@GetUserId() userId: string): Promise<ProfileDto> {
    const user = await this.userService.findById(userId);
    return new ProfileDto(user);
  }

  @Patch()
  async updateProfile(
    @GetUserId() userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileDto> {
    const updatedUser = await this.userService.update(userId, updateProfileDto);
    return new ProfileDto(updatedUser);
  }
}
