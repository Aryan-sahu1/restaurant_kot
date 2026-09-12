import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateCashierDto } from './dto/create-cashier.dto';
import { UpdateCashierDto } from './dto/update-cashier.dto';
import { Cashier } from './entities/cashier.entity';

@Injectable()
export class CashierService {
  constructor(
    @InjectRepository(Cashier)
    private readonly cashierRepository: Repository<Cashier>,
  ) {}

  async create(createCashierDto: CreateCashierDto) {
    return this.createWithType(createCashierDto, 'cashier');
  }

  async createAdmin(createCashierDto: CreateCashierDto) {
    return this.createWithType(createCashierDto, 'admin');
  }

  async findAll() {
    const cashiers = await this.cashierRepository.find({
      order: {
        id: 'DESC',
      },
    });

    return cashiers.map((cashier) => {
      const { password: _, ...result } = cashier;
      return result;
    });
  }

  async update(id: number, updateCashierDto: UpdateCashierDto) {
    const cashier = await this.cashierRepository.findOne({
      where: {
        id,
      },
    });

    if (!cashier) {
      throw new NotFoundException('Cashier not found');
    }

    if (updateCashierDto.username) {
      const normalizedUsername = updateCashierDto.username.trim();
      const existingCashier = await this.cashierRepository.findOne({
        where: {
          username: normalizedUsername,
        },
      });

      if (existingCashier && existingCashier.id !== id) {
        throw new ConflictException(
          'Cashier with this username already exists',
        );
      }

      cashier.username = normalizedUsername;
    }

    if (updateCashierDto.password) {
      cashier.password = await bcrypt.hash(
        updateCashierDto.password,
        10,
      );
    }

    const savedCashier = await this.cashierRepository.save(cashier);
    const { password: _, ...result } = savedCashier;

    return result;
  }

  async remove(id: number) {
    const cashier = await this.cashierRepository.findOne({
      where: {
        id,
      },
    });

    if (!cashier) {
      throw new NotFoundException('Cashier not found');
    }

    await this.cashierRepository.softDelete(id);

    return {
      message: 'Cashier deleted successfully',
    };
  }

  private async createWithType(
    createCashierDto: CreateCashierDto,
    type: 'admin' | 'cashier',
  ) {
    const { username, password } = createCashierDto;
    const normalizedUsername = username.trim();

    const existingCashier =
      await this.cashierRepository.findOne({
        where: {
          username: normalizedUsername,
        },
      });

    if (existingCashier) {
      throw new ConflictException(
        'Cashier with this username already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10,
    );

    const cashier = this.cashierRepository.create({
      username: normalizedUsername,
      password: hashedPassword,
      type,
    });

    const savedCashier =
      await this.cashierRepository.save(cashier);

    const { password: _, ...result } = savedCashier;

    return result;
  }

  async findByUsername(username: string) {
    return this.cashierRepository.findOne({
      where: {
        username: username.trim(),
      },
    });
  }

  async findById(id: number) {
    const cashier =
      await this.cashierRepository.findOne({
        where: {
          id,
        },
      });

    if (!cashier) {
      throw new NotFoundException('Cashier not found');
    }

    const { password: _, ...result } = cashier;

    return result;
  }
}
