import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { KotService } from './kot.service';
import { CreateKotDto } from './dto/create-kot.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('kots')
export class KotController {
  constructor(
    private readonly kotService: KotService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createKotDto: CreateKotDto,
    @Req() req,
  ) {
    return this.kotService.create(
      createKotDto,
      req.user.id,
    );
  }

  @Get('cashier-counts')
  @UseGuards(JwtAuthGuard)
  cashierCounts() {
    return this.kotService.cashierCounts();
  }

  @Get('my-count')
  @UseGuards(JwtAuthGuard)
  myCount(
    @Req() req,
    @Query('date') date?: string,
    @Query('waiter_id') waiterId?: string,
  ) {
    return this.kotService.myCount(
      req.user.id,
      date,
      waiterId,
    );
  }

  @Get('my-kots')
  @UseGuards(JwtAuthGuard)
  myKots(
    @Req() req,
    @Query('date') date?: string,
    @Query('waiter_id') waiterId?: string,
  ) {
    return this.kotService.myKots(
      req.user.id,
      date,
      waiterId,
    );
  }
}
