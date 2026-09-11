import { Controller, Get, Query } from '@nestjs/common';
import { MenuService } from './menu.service';

@Controller('menu')
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
  ) {}

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
}
