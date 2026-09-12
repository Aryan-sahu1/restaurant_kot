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
import { CreateTableNoDto } from './dto/create-table-no.dto';
import { TableNoService } from './table-no.service';

@Controller('table-no')
export class TableNoController {
  constructor(
    private readonly tableNoService: TableNoService,
  ) {}

  @Get()
  findAll() {
    return this.tableNoService.findAll();
  }

  @Post()
  create(
    @Body() createTableNoDto: CreateTableNoDto,
  ) {
    return this.tableNoService.create(createTableNoDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() createTableNoDto: CreateTableNoDto,
  ) {
    return this.tableNoService.update(id, createTableNoDto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.tableNoService.remove(id);
  }
}
