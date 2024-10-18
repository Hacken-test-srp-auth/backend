import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { CompleteLoginDto } from './dto/complete-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() registerDTO: RegisterDto) {
    console.log('registerDTO =======>', registerDTO);
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
}
