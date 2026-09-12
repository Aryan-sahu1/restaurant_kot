import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kot } from '../kot/entities/kot.entity';
import { BillController } from './bill.controller';
import { BillService } from './bill.service';
import { BillItem } from './entities/bill-item.entity';
import { Bill } from './entities/bill.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Bill,
      BillItem,
      Kot,
    ]),
  ],
  controllers: [
    BillController,
  ],
  providers: [
    BillService,
  ],
})
export class BillModule {}
