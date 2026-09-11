import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTableNoDto } from './dto/create-table-no.dto';
import { TableNo } from './entities/table-no.entity';

@Injectable()
export class TableNoService {
  constructor(
    @InjectRepository(TableNo)
    private readonly tableNoRepository: Repository<TableNo>,
  ) {}

  findAll() {
    return this.tableNoRepository.find({
      order: {
        id: 'DESC',
      },
    });
  }

  create(createTableNoDto: CreateTableNoDto) {
    const tableNo = this.tableNoRepository.create({
      name: createTableNoDto.name.trim(),
      restaurant: createTableNoDto.restaurant?.trim() || null,
    });

    return this.tableNoRepository.save(tableNo);
  }

  async remove(id: number) {
    await this.tableNoRepository.softDelete(id);

    return {
      message: 'Table deleted successfully',
    };
  }
}
