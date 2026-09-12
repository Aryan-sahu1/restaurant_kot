import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Kot } from '../kot/entities/kot.entity';
import { BillItem } from './entities/bill-item.entity';
import { Bill } from './entities/bill.entity';

function getPaymentMethod(cash: number, online: number) {
  if (cash > 0 && online > 0) {
    return 'mixed';
  }

  if (cash > 0) {
    return 'cash';
  }

  if (online > 0) {
    return 'online';
  }

  return null;
}

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function buildSimplePdf(lines: string[], size: '58' | '80' = '80') {
  const width = size === '58' ? 164 : 227;
  const height = Math.max(300, 36 + lines.length * 10);
  const startY = height - 24;
  const content = [
    'BT',
    '/F1 7 Tf',
    `10 ${startY} Td`,
    '10 TL',
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

function money(value: number) {
  return Number(value || 0).toFixed(2);
}

function getTaxRate(value?: string | number | null) {
  const rate = Number(value || 0);

  return Number.isFinite(rate) ? rate : 0;
}

function calculateBill(kots: Kot[]) {
  const itemMap = new Map<string, {
    name: string;
    quantity: number;
    price: number;
    amount: number;
    gst: number;
    tax: number;
  }>();

  kots.forEach((kot) => {
    kot.items.forEach((item) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      const gst = getTaxRate(item.menuItem?.trate);
      const amount = price * quantity;
      const tax = amount * gst / 100;
      const key = `${item.menu_item_id}-${price}-${gst}`;
      const existingItem = itemMap.get(key);

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.amount += amount;
        existingItem.tax += tax;
      } else {
        itemMap.set(key, {
          name: item.menuItem?.name || `Item ${item.menu_item_id}`,
          quantity,
          price,
          amount,
          gst,
          tax,
        });
      }
    });
  });

  const items = Array.from(itemMap.values());
  const subTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxTotal = items.reduce((sum, item) => sum + item.tax, 0);

  return {
    items,
    subTotal,
    taxTotal,
    grandTotal: subTotal + taxTotal,
  };
}

@Injectable()
export class BillService {
  constructor(
    @InjectRepository(Bill)
    private readonly billRepository: Repository<Bill>,

    @InjectRepository(BillItem)
    private readonly billItemRepository: Repository<BillItem>,

    @InjectRepository(Kot)
    private readonly kotRepository: Repository<Kot>,
  ) {}

  async findByKotIds(kotIds?: string) {
    const ids = kotIds
      ?.split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (!ids?.length) {
      return [];
    }

    const billItems = await this.billItemRepository.find({
      where: {
        kot_id: In(ids),
      },
      relations: {
        bill: {
          billItems: true,
        },
      },
      order: {
        id: 'DESC',
      },
    });

    const billsById = new Map<number, Bill>();

    billItems.forEach((billItem) => {
      billsById.set(billItem.bill.id, billItem.bill);
    });

    return Array.from(billsById.values()).map((bill) => ({
      ...bill,
      kot_ids: bill.billItems.map((billItem) => billItem.kot_id),
    }));
  }

  async generate(kotIds: number[]) {
    const uniqueKotIds = Array.from(new Set(kotIds));

    const existingBillItem = await this.billItemRepository.findOne({
      where: {
        kot_id: In(uniqueKotIds),
      },
      relations: {
        bill: {
          billItems: true,
        },
      },
    });

    if (existingBillItem) {
      return {
        ...existingBillItem.bill,
        kot_ids: existingBillItem.bill.billItems.map((billItem) => billItem.kot_id),
      };
    }

    const kots = await this.kotRepository.find({
      where: {
        id: In(uniqueKotIds),
      },
      relations: {
        items: {
          menuItem: true,
        },
      },
    });

    if (kots.length !== uniqueKotIds.length) {
      throw new NotFoundException('One or more KOTs were not found');
    }

    const tableNo = kots[0].table_no;
    const hasDifferentTable = kots.some((kot) => kot.table_no !== tableNo);

    if (hasDifferentTable) {
      throw new BadRequestException('A bill can only be generated for one table');
    }

    const billSummary = calculateBill(kots);

    const bill = this.billRepository.create({
      table_no: tableNo,
      cash: 0,
      online: 0,
      payment_method: null,
      is_bill_generate: true,
      total_amount: billSummary.grandTotal,
    });

    const savedBill = await this.billRepository.save(bill);

    const billItems = uniqueKotIds.map((kotId) =>
      this.billItemRepository.create({
        bill_id: savedBill.id,
        kot_id: kotId,
      }),
    );

    await this.billItemRepository.save(billItems);

    return {
      ...savedBill,
      kot_ids: uniqueKotIds,
    };
  }

  async settle(id: number, cash: number, online: number) {
    const bill = await this.billRepository.findOne({
      where: {
        id,
      },
      relations: {
        billItems: true,
      },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    const cashAmount = Number(cash) || 0;
    const onlineAmount = Number(online) || 0;
    const paidAmount = cashAmount + onlineAmount;

    if (Math.abs(paidAmount - Number(bill.total_amount)) > 0.009) {
      throw new BadRequestException('Paid amount must be equal to bill amount');
    }

    bill.cash = cashAmount;
    bill.online = onlineAmount;
    bill.payment_method = getPaymentMethod(cashAmount, onlineAmount);

    const savedBill = await this.billRepository.save(bill);

    await this.kotRepository.softDelete(
      bill.billItems.map((billItem) => billItem.kot_id),
    );

    return {
      ...savedBill,
      kot_ids: bill.billItems.map((billItem) => billItem.kot_id),
    };
  }

  async getPdf(id: number, size: '58' | '80' = '80') {
    const bill = await this.billRepository.findOne({
      where: {
        id,
      },
      relations: {
        billItems: true,
      },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    const kotIds = bill.billItems.map((billItem) => billItem.kot_id);
    const kots = await this.kotRepository
      .createQueryBuilder('kot')
      .withDeleted()
      .leftJoinAndSelect('kot.table', 'table')
      .leftJoinAndSelect('kot.waiter', 'waiter')
      .leftJoinAndSelect('kot.items', 'items')
      .leftJoinAndSelect('items.menuItem', 'menuItem')
      .where('kot.id IN (:...kotIds)', { kotIds })
      .getMany();

    if (kots.length === 0) {
      throw new NotFoundException('Bill KOTs not found');
    }

    const billSummary = calculateBill(kots);
    const firstKot = kots[0];
    const tableName = firstKot?.table?.name || `Table ${bill.table_no}`;
    const kotNumbers = bill.billItems.map((billItem) => `#${billItem.kot_id}`).join(', ');
    const lineWidth = size === '58' ? 32 : 42;
    const separator = '-'.repeat(lineWidth);
    const doubleSeparator = '='.repeat(lineWidth);
    const billDate = new Date(bill.bill_date).toLocaleDateString('en-IN');
    const billTime = new Date(bill.bill_date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const paymentMode = bill.payment_method || 'Pending';
    const cgst = billSummary.taxTotal / 2;
    const sgst = billSummary.taxTotal / 2;
    const netAmount = billSummary.grandTotal;
    const roundOff = Math.round(netAmount) - netAmount;
    const totalPaid = Number(bill.cash) + Number(bill.online);
    const itemLines = billSummary.items.flatMap((item, index) => {
      const itemName = item.name.slice(0, 17).padEnd(17, ' ');
      const quantity = String(item.quantity).padStart(3, ' ');
      const rate = money(item.price).padStart(7, ' ');
      const amount = money(item.amount).padStart(8, ' ');

      if (size === '58') {
        return [
          `${item.name.slice(0, 26)}`,
          `   Qty:${item.quantity} Rate:${money(item.price)} Amt:${money(item.amount)}`,
        ];
      }

      return [
        `${itemName}${quantity}${rate}${amount}`,
      ];
    });
    const lines = [
      centerText('GSTIN:09XXXXX1234H1ZU', lineWidth),
      centerText('FSSAI:12721045000134', lineWidth),
      centerText('RESTAURANT', lineWidth),
      centerText('33, Cantonment, Kanpur', lineWidth),
      centerText('BILL CUM TAX INVOICE', lineWidth),
      centerText('DUPLICATE BILL', lineWidth),
      '',
      'Membership No. : F & B'.slice(0, lineWidth),
      'Member : F & B STAFF'.slice(0, lineWidth),
      separator,
      `Bill No  : ${String(bill.id).padEnd(8, ' ')} Table No : ${tableName}`.slice(0, lineWidth),
      `Bill Date: ${String(billDate).padEnd(8, ' ')} Time     : ${billTime}`.slice(0, lineWidth),
      `KOT No.  : ${kotNumbers}`.slice(0, lineWidth),
      separator,
      size === '58'
        ? 'Particulars'
        : 'Particulars            Qty   Rate  Amount',
      separator,
      ...itemLines,
      separator,
      `${'Total'.padStart(lineWidth - 10, ' ')}${money(billSummary.subTotal).padStart(10, ' ')}`,
      '',
      centerText('GSTIN:09XXXXX1234H1ZU', lineWidth),
      centerText('FSSAI:12721045000134', lineWidth),
      centerText('RESTAURANT', lineWidth),
      centerText('33 Cantonment, Kanpur', lineWidth),
      centerText('TAX INVOICE', lineWidth),
      centerText('SAC-CODE:9965', lineWidth),
      centerText('DUPLICATE BILL', lineWidth),
      '',
      'Membership No. : F & B'.slice(0, lineWidth),
      'Member : F & B STAFF'.slice(0, lineWidth),
      separator,
      `Bill No  : ${String(bill.id).padEnd(8, ' ')} Table No : ${tableName}`.slice(0, lineWidth),
      `Bill Date: ${String(billDate).padEnd(8, ' ')} Time     : ${billTime}`.slice(0, lineWidth),
      `KOT NO.  : ${kotNumbers}`.slice(0, lineWidth),
      separator,
      size === '58'
        ? 'Particulars'
        : 'Particulars            Qty   Rate  Amount',
      separator,
      ...itemLines,
      separator,
      `${'Total'.padStart(lineWidth - 10, ' ')}${money(billSummary.subTotal).padStart(10, ' ')}`,
      `${'CGST@2.5%'.padEnd(lineWidth - 10, ' ')}${money(cgst).padStart(10, ' ')}`,
      `${'SGST@2.5%'.padEnd(lineWidth - 10, ' ')}${money(sgst).padStart(10, ' ')}`,
      `${'Round Off'.padEnd(lineWidth - 10, ' ')}${money(roundOff).padStart(10, ' ')}`,
      `${'Net Amount'.padEnd(lineWidth - 10, ' ')}${money(Math.round(netAmount)).padStart(10, ' ')}`,
      doubleSeparator,
      `${'Total Amt'.padEnd(lineWidth - 10, ' ')}${money(totalPaid || netAmount).padStart(10, ' ')}`,
      centerText('PROUD OF INDIAN ARMED FORCES', lineWidth),
      centerText('JAI HIND', lineWidth),
      '',
      `Payment Mode : ${paymentMode}`.slice(0, lineWidth),
      `Cash         : ${money(Number(bill.cash))}`.slice(0, lineWidth),
      `Online       : ${money(Number(bill.online))}`.slice(0, lineWidth),
      `Steward Name : ${firstKot?.waiter?.name || '-'}`.slice(0, lineWidth),
      'User Name : CASHIER'.slice(0, lineWidth),
    ];

    return buildSimplePdf(lines, size);
  }
}
