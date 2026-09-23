import {
  BadRequestException,
  Injectable,
  NotFoundException,
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

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function buildThermalPdf(lines: string[], size: '58' | '80' = '80') {
  const width = size === '58' ? 164 : 227;
  const height = Math.max(230, 36 + lines.length * 13);
  const startY = height - 24;
  const content = [
    'BT',
    '/F1 9 Tf',
    `10 ${startY} Td`,
    '13 TL',
    ...lines.map((line) => `(${escapePdfText(line)}) Tj T*`),
    'ET',
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf);
}

function centerText(text: string, width: number) {
  const trimmedText = text.slice(0, width);
  const leftPadding = Math.max(0, Math.floor((width - trimmedText.length) / 2));

  return `${' '.repeat(leftPadding)}${trimmedText}`;
}

function splitText(text: string, width: number) {
  const chunks: string[] = [];
  let remainingText = text.trim();

  while (remainingText.length > width) {
    chunks.push(remainingText.slice(0, width));
    remainingText = remainingText.slice(width);
  }

  chunks.push(remainingText);

  return chunks;
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

  async totalCount() {
    const totalKotCount = await this.kotRepository.count({
      withDeleted: true,
    });
    const runningKotCount = await this.kotRepository.count();

    return {
      kot_count: totalKotCount,
      total_kot_count: totalKotCount,
      running_kot_count: runningKotCount,
    };
  }

  async nextNumber() {
    const lastKot = await this.kotRepository
      .createQueryBuilder('kot')
      .withDeleted()
      .orderBy('kot.id', 'DESC')
      .getOne();

    return {
      next_kot_no: (lastKot?.id || 0) + 1,
    };
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

  async myOldKots(cashierId: number, date?: string, waiterId?: string) {
    const { selectedDate, startDate, endDate } =
      getDateRange(date);
    const parsedWaiterId = parseWaiterId(waiterId);

    const query = this.kotRepository
      .createQueryBuilder('kot')
      .withDeleted()
      .leftJoinAndSelect('kot.table', 'table')
      .leftJoinAndSelect('kot.waiter', 'waiter')
      .leftJoinAndSelect('kot.items', 'items')
      .leftJoinAndSelect('items.menuItem', 'menuItem')
      .where('kot.cashier_id = :cashierId', { cashierId })
      .andWhere('kot.deleted_at IS NOT NULL')
      .andWhere('kot.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('kot.deleted_at', 'DESC');

    if (parsedWaiterId) {
      query.andWhere('kot.waiter_id = :waiterId', {
        waiterId: parsedWaiterId,
      });
    }

    const kots = await query.getMany();

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
      deleted_at: kot.deleted_at,
      date: selectedDate,
      items: kot.items.map((item) => ({
        menu_item_id: item.menu_item_id,
        name: item.menuItem?.name || `Item ${item.menu_item_id}`,
        quantity: item.quantity,
        price: item.price,
      })),
    }));
  }

  async getPdf(id: number, size: '58' | '80' = '80') {
    const kot = await this.kotRepository.findOne({
      where: {
        id,
      },
      relations: {
        table: true,
        waiter: true,
        items: {
          menuItem: true,
        },
      },
    });

    if (!kot) {
      throw new NotFoundException('KOT not found');
    }

    const tableName = kot.table?.name || `Table ${kot.table_no}`;
    const lineWidth = size === '58' ? 32 : 40;
    const itemNameWidth = size === '58' ? 13 : 17;
    const separator = '-'.repeat(lineWidth);
    const orderDate = new Date(kot.created_at).toLocaleDateString('en-IN');
    const orderTime = new Date(kot.created_at).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const itemLines = kot.items.flatMap((item) => {
      const name = item.menuItem?.name || `Item ${item.menu_item_id}`;
      const quantity = Number(item.quantity);
      const rate = Number(item.price);
      const amount = quantity * rate;
      const nameLines = splitText(name, itemNameWidth);

      return nameLines.map((nameLine, index) => {
        if (index > 0) {
          return nameLine;
        }

        const qtyText = String(quantity).padStart(3, ' ');
        const rateText = rate.toFixed(2).padStart(7, ' ');
        const amountText = amount.toFixed(2).padStart(8, ' ');

        return `${nameLine.padEnd(itemNameWidth, ' ')}${qtyText}${rateText}${amountText}`;
      });
    });
    const lines = [
      centerText('MESS', lineWidth),
      centerText('* KOT *', lineWidth),
      '',
      `Membership No.: -`.slice(0, lineWidth),
      `Member: -`.slice(0, lineWidth),
      `Table No: ${tableName}`.slice(0, lineWidth),
      `Remarks :`.slice(0, lineWidth),
      `KOT No. : ${kot.id} Date: ${orderDate} ${orderTime}`.slice(0, lineWidth),
      separator,
      `${'ITEM NAME'.padEnd(itemNameWidth, ' ')}${'Qty'.padStart(3, ' ')}${'Rate'.padStart(7, ' ')}${'Amount'.padStart(8, ' ')}`,
      separator,
      ...itemLines,
      separator,
      `Waiter Name : ${kot.waiter?.name || '-'}`.slice(0, lineWidth),
      '***New Order***',
      '***DUPLICATE KOT***',
      '*',
      separator,
      '**A SA SOFTWARE 7081532300**'.slice(0, lineWidth),
      '*',
    ];

    return buildThermalPdf(lines, size);
  }
}
