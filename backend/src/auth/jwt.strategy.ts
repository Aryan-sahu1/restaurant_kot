import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  PassportStrategy,
} from '@nestjs/passport';

import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

import { CashierService } from '../cashier/cashier.service';
import { jwtSecret } from './auth.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
) {
  constructor(
    private readonly cashierService: CashierService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: {
    sub: number;
    username: string;
    role: string;
    type?: string;
  }) {
    try {
      const cashier =
        await this.cashierService.findById(
          payload.sub,
        );

      if ((payload.type || payload.role) !== (cashier.type || 'cashier')) {
        throw new UnauthorizedException('Invalid user session');
      }

      return cashier;
    } catch {
      throw new UnauthorizedException('Invalid user session');
    }
  }
}
