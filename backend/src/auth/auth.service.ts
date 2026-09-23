import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { CashierService } from '../cashier/cashier.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly cashierService: CashierService,
    private readonly jwtService: JwtService,
  ) {}

  async cashierLogin(
    username: string,
    password: string,
  ) {
    return this.login(username, password, 'cashier');
  }

  async adminLogin(
    username: string,
    password: string,
  ) {
    return this.login(username, password, 'admin');
  }

  async changeAdminPassword(
    adminId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const admin = await this.cashierService.findByIdWithPassword(adminId);

    if (!admin || admin.type !== 'admin') {
      throw new ForbiddenException('Only admin can change this password');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.cashierService.updatePassword(admin.id, newPassword);

    return {
      message: 'Admin password changed successfully',
    };
  }

  private async login(
    username: string,
    password: string,
    type: 'admin' | 'cashier',
  ) {
    const cashier =
      await this.cashierService.findByUsername(username);

    if (!cashier) {
      throw new UnauthorizedException(
        'Invalid username or password',
      );
    }

    const isPasswordValid =
      await bcrypt.compare(
        password,
        cashier.password,
      );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Invalid username or password',
      );
    }

    if (type === 'admin' && cashier.type !== 'admin') {
      throw new UnauthorizedException(
        'Invalid username or password',
      );
    }

    if (
      type === 'cashier' &&
      cashier.type &&
      cashier.type !== 'cashier'
    ) {
      throw new UnauthorizedException(
        'Invalid username or password',
      );
    }

    const payload = {
      sub: cashier.id,
      username: cashier.username,
      role: cashier.type || 'cashier',
      type: cashier.type || 'cashier',
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',

      access_token: accessToken,

      cashier: {
        id: cashier.id,
        username: cashier.username,
        type: cashier.type || 'cashier',
      },
    };
  }
}
