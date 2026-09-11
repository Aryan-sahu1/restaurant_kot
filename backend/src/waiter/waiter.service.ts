import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateWaiterDto } from './dto/create-waiter.dto';
import { Waiter } from './entities/waiter.entity';

@Injectable()
export class WaiterService {
  constructor(
    @InjectRepository(Waiter)
    private readonly waiterRepository: Repository<Waiter>,
  ) {}

  async create(createWaiterDto: CreateWaiterDto) {
    const { name, code } =
      createWaiterDto;
    const normalizedCode = code.trim();

    const existingWaiter =
      await this.waiterRepository.findOne({
        where: {
          code: normalizedCode,
        },
      });

    if (existingWaiter) {
      throw new ConflictException(
        'Waiter with this code already exists',
      );
    }

    const waiter = this.waiterRepository.create({
      name: name.trim(),
      code: normalizedCode,
    });

    const savedWaiter =
      await this.waiterRepository.save(waiter);

    return savedWaiter;
  }

  async findById(id: number) {
    const waiter =
      await this.waiterRepository.findOne({
        where: { id },
      });

    if (!waiter) {
      throw new NotFoundException(
        'Waiter not found',
      );
    }

    return waiter;
  }

  async findAll() {
    return this.waiterRepository.find({
      select: {
        id: true,
        name: true,
        code: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
      },
    });
  }
}
