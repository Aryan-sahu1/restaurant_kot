import {
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

    const payload = {
      sub: cashier.id,
      username: cashier.username,
      role: 'cashier',
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',

      access_token: accessToken,

      cashier: {
        id: cashier.id,
        username: cashier.username,
      },
    };
  }
}
