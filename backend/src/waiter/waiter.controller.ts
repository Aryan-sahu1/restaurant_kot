import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { WaiterService } from './waiter.service';
import { CreateWaiterDto } from './dto/create-waiter.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';



@Controller('waiters')
export class WaiterController {
  constructor(
    private readonly waiterService: WaiterService,
  ) {}

  @Post('/')
  async create(
    @Body() createWaiterDto: CreateWaiterDto,
  ) {
    return this.waiterService.create(
      createWaiterDto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.waiterService.findAll();
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async profile(@Req() req) {
    return {
      waiter: req.user,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.waiterService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() createWaiterDto: CreateWaiterDto,
  ) {
    return this.waiterService.update(id, createWaiterDto);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.waiterService.remove(id);
  }
}
