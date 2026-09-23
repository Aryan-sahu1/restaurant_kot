import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginCashierDto } from '../cashier/dto/login-cashier.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';

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

  @Post('admin/login')
  async adminLogin(
    @Body() loginCashierDto: LoginCashierDto,
  ) {
    return this.authService.adminLogin(
      loginCashierDto.username,
      loginCashierDto.password,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req) {
    return {
      cashier: req.user,
    };
  }

  @Post('admin/change-password')
  @UseGuards(JwtAuthGuard)
  changeAdminPassword(
    @Req() req,
    @Body() changeAdminPasswordDto: ChangeAdminPasswordDto,
  ) {
    return this.authService.changeAdminPassword(
      req.user.id,
      changeAdminPasswordDto.currentPassword,
      changeAdminPasswordDto.newPassword,
    );
  }
}
