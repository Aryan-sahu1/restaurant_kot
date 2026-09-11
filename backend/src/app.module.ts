import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuModule } from './menu/menu.module';
import { KotModule } from './kot/kot.module';
import { CustomerModule } from './customer/customer.module';
import { AuthModule } from './auth/auth.module';
import { WaiterModule } from './waiter/waiter.module';
import { CashierModule } from './cashier/cashier.module';
import { TableNoModule } from './table-no/table-no.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: 'localhost',
      port: 1433,
      username: 'sa',
      password: 'aryan@123',
      database: 'restaurant_kot',

      autoLoadEntities: true,
      synchronize: true,

      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    }),

    MenuModule,
    KotModule,
    CustomerModule,
    CashierModule,
    WaiterModule,
    TableNoModule,
    AuthModule,
  ],
})
export class AppModule {}
