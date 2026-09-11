import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Between, Repository } from 'typeorm';

import { Kot } from './entities/kot.entity';
import { KotItem } from './entities/kot-item.entity';
import { MenuItem } from '../menu/entities/menu-item.entity';

import { CreateKotDto } from './dto/create-kot.dto';

function getDateRange(date?: string) {
  const selectedDate =
    date?.trim() || new Date().toISOString().slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    throw new BadRequestException(
      'Date must be in YYYY-MM-DD format',
    );
  }

  return {
    selectedDate,
    startDate: new Date(`${selectedDate}T00:00:00.000`),
    endDate: new Date(`${selectedDate}T23:59:59.999`),
  };
}

function parseWaiterId(waiterId?: string) {
  if (!waiterId?.trim()) {
    return undefined;
  }

  const parsedWaiterId = Number(waiterId);

  if (!Number.isInteger(parsedWaiterId) || parsedWaiterId <= 0) {
    throw new BadRequestException('Waiter id must be a valid number');
  }

  return parsedWaiterId;
}

@Injectable()
export class KotService {
  constructor(
    @InjectRepository(Kot)
    private kotRepository: Repository<Kot>,

    @InjectRepository(KotItem)
    private kotItemRepository: Repository<KotItem>,

    @InjectRepository(MenuItem)
    private menuRepository: Repository<MenuItem>,
  ) {}

  async create(
    createKotDto: CreateKotDto,
    cashierId: number,
  ) {
    const { table_no, waiter_id, items } = createKotDto;

    // 1. Create KOT
    const kot = this.kotRepository.create({
      table_no,
      cashier_id: cashierId,
      waiter_id,
      status: 'OPEN',
    });

    const savedKot = await this.kotRepository.save(kot);

    // 2. Loop items
    for (const item of items) {
      // Menu item find
      const menuItem = await this.menuRepository.findOne({
        where: {
          id: item.menu_item_id,
        },
      });

      if (!menuItem) {
        throw new BadRequestException(
          `Menu item ${item.menu_item_id} not found`,
        );
      }

      // Create KOT Item
      const kotItem = this.kotItemRepository.create({
        kot_id: savedKot.id,
        menu_item_id: menuItem.id,
        quantity: item.quantity,
        price: menuItem.srate,
      });

      await this.kotItemRepository.save(kotItem);
    }

    return {
      message: 'KOT generated successfully',
      kot_id: savedKot.id,
      cashier_id: cashierId,
      waiter_id,
    };
  }

  cashierCounts() {
    return this.kotRepository
      .createQueryBuilder('kot')
      .leftJoin('kot.cashier', 'cashier')
      .select('cashier.id', 'cashier_id')
      .addSelect('cashier.username', 'cashier_username')
      .addSelect('COUNT(kot.id)', 'kot_count')
      .where('kot.cashier_id IS NOT NULL')
      .andWhere('kot.deleted_at IS NULL')
      .groupBy('cashier.id')
      .addGroupBy('cashier.username')
      .orderBy('kot_count', 'DESC')
      .getRawMany();
  }

  async myCount(cashierId: number, date?: string, waiterId?: string) {
    const { selectedDate, startDate, endDate } =
      getDateRange(date);
    const parsedWaiterId = parseWaiterId(waiterId);

    const kotCount = await this.kotRepository.count({
      where: {
        cashier_id: cashierId,
        ...(parsedWaiterId ? { waiter_id: parsedWaiterId } : {}),
        created_at: Between(startDate, endDate),
      },
    });

    const totalResultQuery = this.kotItemRepository
      .createQueryBuilder('kotItem')
      .innerJoin('kotItem.kot', 'kot')
      .select(
        'COALESCE(SUM(kotItem.price * kotItem.quantity), 0)',
        'total_amount',
      )
      .where('kot.cashier_id = :cashierId', { cashierId })
      .andWhere('kot.deleted_at IS NULL')
      .andWhere('kot.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (parsedWaiterId) {
      totalResultQuery.andWhere('kot.waiter_id = :waiterId', {
        waiterId: parsedWaiterId,
      });
    }

    const totalResult = await totalResultQuery
      .getRawOne<{ total_amount: string }>();

    return {
      date: selectedDate,
      cashier_id: cashierId,
      waiter_id: parsedWaiterId || null,
      kot_count: kotCount,
      total_amount: Number(totalResult?.total_amount) || 0,
    };
  }

  async myKots(cashierId: number, date?: string, waiterId?: string) {
    const { selectedDate, startDate, endDate } =
      getDateRange(date);
    const parsedWaiterId = parseWaiterId(waiterId);

    const kots = await this.kotRepository.find({
      where: {
        cashier_id: cashierId,
        ...(parsedWaiterId ? { waiter_id: parsedWaiterId } : {}),
        created_at: Between(startDate, endDate),
      },
      relations: {
        table: true,
        waiter: true,
        items: {
          menuItem: true,
        },
      },
      order: {
        created_at: 'DESC',
      },
    });

    return kots.map((kot) => ({
      id: kot.id,
      table_no: kot.table_no,
      table: kot.table
        ? {
            id: kot.table.id,
            name: kot.table.name,
            restaurant: kot.table.restaurant,
          }
        : null,
      status: kot.status,
      waiter: kot.waiter
        ? {
            id: kot.waiter.id,
            name: kot.waiter.name,
            code: kot.waiter.code,
          }
        : null,
      created_at: kot.created_at,
      date: selectedDate,
      items: kot.items.map((item) => ({
        menu_item_id: item.menu_item_id,
        name: item.menuItem?.name || `Item ${item.menu_item_id}`,
        quantity: item.quantity,
        price: item.price,
      })),
    }));
  }
}
