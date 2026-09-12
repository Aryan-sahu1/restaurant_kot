import { Injectable } from '@nestjs/common';

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
    const cashier =
      await this.cashierService.findById(
        payload.sub,
      );

    return cashier;
  }
}
