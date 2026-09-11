import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { jwtSecret } from './auth.config';

import { CashierModule } from '../cashier/cashier.module';

@Module({
  imports: [
    CashierModule,

    PassportModule,

    JwtModule.register({
      secret: jwtSecret,

      signOptions: {
        expiresIn: '7d',
      },
    }),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
    JwtStrategy,
  ],
})
export class AuthModule {}
