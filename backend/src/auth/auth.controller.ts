import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginCashierDto } from '../cashier/dto/login-cashier.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('cashier/login')
  async cashierLogin(
    @Body() loginCashierDto: LoginCashierDto,
  ) {
    return this.authService.cashierLogin(
      loginCashierDto.username,
      loginCashierDto.password,
    );
  }
}
