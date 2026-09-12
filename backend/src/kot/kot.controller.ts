import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';

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

  @Get('total-count')
  @UseGuards(JwtAuthGuard)
  totalCount() {
    return this.kotService.totalCount();
  }

  @Get('next-number')
  @UseGuards(JwtAuthGuard)
  nextNumber() {
    return this.kotService.nextNumber();
  }

  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard)
  async pdf(
    @Param('id', ParseIntPipe) id: number,
    @Query('size') size: '58' | '80' = '80',
    @Res() response: Response,
  ) {
    const pdf = await this.kotService.getPdf(
      id,
      size === '58' ? '58' : '80',
    );

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="kot-${id}.pdf"`);
    response.send(pdf);
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
