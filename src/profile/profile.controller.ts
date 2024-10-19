import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';

import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileDto } from './dto/profile.dto';
import { JwtAuthGuard } from 'src/lib/decorators/guards/jwt.guard';
import { UserService } from 'src/user/user.service';
import { GetUserId } from 'src/lib/decorators/guards/get-user-id.decorator';

@Controller('profile')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ProfileController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getProfile(@GetUserId() userId: string): Promise<ProfileDto> {
    console.log('=======> ', userId);
    const user = await this.userService.findById(userId);
    return new ProfileDto(user);
  }

  @Put()
  async updateProfile(
    @GetUserId() userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileDto> {
    const updatedUser = await this.userService.update(userId, updateProfileDto);
    return new ProfileDto(updatedUser);
  }
}
