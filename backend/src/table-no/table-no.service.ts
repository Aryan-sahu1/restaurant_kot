import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async update(id: number, createTableNoDto: CreateTableNoDto) {
    const tableNo = await this.tableNoRepository.findOne({
      where: {
        id,
      },
    });

    if (!tableNo) {
      throw new NotFoundException('Table not found');
    }

    tableNo.name = createTableNoDto.name.trim();
    tableNo.restaurant = createTableNoDto.restaurant?.trim() || null;

    return this.tableNoRepository.save(tableNo);
  }

  async remove(id: number) {
    const tableNo = await this.tableNoRepository.findOne({
      where: {
        id,
      },
    });

    if (!tableNo) {
      throw new NotFoundException('Table not found');
    }

    await this.tableNoRepository.softDelete(id);

    return {
      message: 'Table deleted successfully',
    };
  }
}
