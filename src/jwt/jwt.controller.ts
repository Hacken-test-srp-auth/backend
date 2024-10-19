import { Controller, Get, Param, Post } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { JwtDto } from './dto/jwt.dto';

@Controller('jwt')
export class JwtController {
  constructor(private readonly jwtService: JwtService) {}

  @Post('refresh')
  async refresh(refreshToken: string): Promise<JwtDto> {
    return this.jwtService.refreshTokens(refreshToken);
  }

  @Get('create/:userId')
  async create(@Param('userId') userId: string) {
    console.log('======>', userId);
    return this.jwtService.createTokens(userId);
  }
}
