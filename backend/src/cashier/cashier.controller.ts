import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { CashierService } from './cashier.service';
import { CreateCashierDto } from './dto/create-cashier.dto';

@Controller('cashiers')
export class CashierController {
  constructor(
    private readonly cashierService: CashierService,
  ) {}

  @Post()
  create(
    @Body() createCashierDto: CreateCashierDto,
  ) {
    return this.cashierService.create(createCashierDto);
  }
}
