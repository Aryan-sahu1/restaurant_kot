import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}
