import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { CompleteLoginDto } from './dto/complete-login.dto';
import { JwtAuthGuard } from '../lib/guards/jwt.guard';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() registerDTO: RegisterDto) {
    return this.authService.register(registerDTO);
  }

  @Post('login-init')
  @HttpCode(HttpStatus.OK)
  loginInit(@Body('email') email: string) {
    return this.authService.loginInit(email);
  }

  @Post('login-complete')
  @HttpCode(HttpStatus.OK)
  loginComplete(@Body() completeLoginDto: CompleteLoginDto) {
    return this.authService.loginComplete(completeLoginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    const accessToken = req.headers.authorization.split(' ')[1];
    const refreshToken = req.body.refreshToken;
    await this.authService.logout(accessToken, refreshToken);
    return { message: 'Logout successful' };
  }
}
