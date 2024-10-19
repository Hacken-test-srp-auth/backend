import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './lib/decorators/guards/jwt.guard';
import { GetUserId } from './lib/decorators/guards/get-user-id.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getHello(@GetUserId() userId: string) {
    console.log('========>', userId);
    return this.appService.getHello();
  }
}
