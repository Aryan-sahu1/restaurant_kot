import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CashierService } from './cashier.service';
import { CreateCashierDto } from './dto/create-cashier.dto';
import { UpdateCashierDto } from './dto/update-cashier.dto';

@Controller('cashiers')
export class CashierController {
  constructor(
    private readonly cashierService: CashierService,
  ) {}

  @Get()
  findAll() {
    return this.cashierService.findAll();
  }

  @Post()
  create(
    @Body() createCashierDto: CreateCashierDto,
  ) {
    return this.cashierService.create(createCashierDto);
  }

  @Post('admin')
  createAdmin(
    @Body() createCashierDto: CreateCashierDto,
  ) {
    return this.cashierService.createAdmin(createCashierDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCashierDto: UpdateCashierDto,
  ) {
    return this.cashierService.update(id, updateCashierDto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cashierService.remove(id);
  }
}
