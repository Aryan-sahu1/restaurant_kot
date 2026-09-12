import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItem } from './entities/menu-item.entity';

type MenuSearchParams = {
  search?: string;
  name?: string;
  code?: string;
};

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuItem)
    private menuRepository: Repository<MenuItem>,
  ) {}

  create(createMenuItemDto: CreateMenuItemDto) {
    const menuItem = this.menuRepository.create({
      name: createMenuItemDto.name.trim(),
      code: createMenuItemDto.code?.trim() || null,
      srate: createMenuItemDto.srate,
      trate: createMenuItemDto.trate?.trim() || null,
    });

    return this.menuRepository.save(menuItem);
  }

  findAll() {
    return this.menuRepository.find({
      order: {
        name: 'ASC',
      },
    });
  }

  search({ search, name, code }: MenuSearchParams) {
    const query = this.menuRepository
      .createQueryBuilder('menu');

    const searchText = search?.trim();
    const nameText = name?.trim();
    const codeText = code?.trim();

    if (searchText) {
      query.where(
        '(LOWER(menu.name) LIKE LOWER(:search) OR LOWER(menu.code) LIKE LOWER(:search))',
        {
          search: `%${searchText}%`,
        },
      );
    }

    if (nameText) {
      const method = searchText ? 'andWhere' : 'where';
      query[method]('LOWER(menu.name) LIKE LOWER(:name)', {
        name: `%${nameText}%`,
      });
    }

    if (codeText) {
      const method = searchText || nameText ? 'andWhere' : 'where';
      query[method]('LOWER(menu.code) LIKE LOWER(:code)', {
        code: `%${codeText}%`,
      });
    }

    return query
      .orderBy('menu.name', 'ASC')
      .getMany();
  }

  async update(id: number, updateMenuItemDto: UpdateMenuItemDto) {
    const menuItem = await this.menuRepository.findOne({
      where: {
        id,
      },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    if (updateMenuItemDto.name !== undefined) {
      menuItem.name = updateMenuItemDto.name.trim();
    }

    if (updateMenuItemDto.code !== undefined) {
      menuItem.code = updateMenuItemDto.code.trim() || null;
    }

    if (updateMenuItemDto.srate !== undefined) {
      menuItem.srate = updateMenuItemDto.srate;
    }

    if (updateMenuItemDto.trate !== undefined) {
      menuItem.trate = updateMenuItemDto.trate.trim() || null;
    }

    return this.menuRepository.save(menuItem);
  }

  async remove(id: number) {
    const menuItem = await this.menuRepository.findOne({
      where: {
        id,
      },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    await this.menuRepository.delete(id);

    return {
      message: 'Menu item deleted successfully',
    };
  }
}
