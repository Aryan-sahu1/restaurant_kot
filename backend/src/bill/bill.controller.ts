import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BillService } from './bill.service';
import { GenerateBillDto } from './dto/generate-bill.dto';
import { SettleBillDto } from './dto/settle-bill.dto';

@Controller('bill')
@UseGuards(JwtAuthGuard)
export class BillController {
  constructor(
    private readonly billService: BillService,
  ) {}

  @Get()
  findByKotIds(
    @Query('kot_ids') kotIds?: string,
  ) {
    return this.billService.findByKotIds(kotIds);
  }

  @Post('generate')
  generate(
    @Body() generateBillDto: GenerateBillDto,
  ) {
    return this.billService.generate(generateBillDto.kot_ids);
  }

  @Patch(':id/settle')
  settle(
    @Param('id', ParseIntPipe) id: number,
    @Body() settleBillDto: SettleBillDto,
  ) {
    return this.billService.settle(
      id,
      settleBillDto.cash,
      settleBillDto.online,
    );
  }

  @Get(':id/pdf')
  async pdf(
    @Param('id', ParseIntPipe) id: number,
    @Query('size') size: '58' | '80' = '80',
    @Res() response: Response,
  ) {
    const pdf = await this.billService.getPdf(
      id,
      size === '58' ? '58' : '80',
    );

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="bill-${id}.pdf"`);
    response.send(pdf);
  }
}
