import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuService } from './menu.service';

@Controller('menu')
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
  ) {}

  @Post()
  create(
    @Body() createMenuItemDto: CreateMenuItemDto,
  ) {
    return this.menuService.create(createMenuItemDto);
  }

  @Get()
  findAll() {
    return this.menuService.findAll();
  }

  @Get('search')
  search(
    @Query('search') search?: string,
    @Query('name') name?: string,
    @Query('code') code?: string,
  ) {
    return this.menuService.search({
      search,
      name,
      code,
    });
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
  ) {
    return this.menuService.update(id, updateMenuItemDto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.menuService.remove(id);
  }
}
