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

function buildA4Pdf(lines: string[]) {
  const width = 595;
  const height = 842;
  const marginX = 36;
  const startY = 806;
  const lineHeight = 10;
  const linesPerPage = 76;
  const pages: string[][] = [];

  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }

  if (pages.length === 0) {
    pages.push([]);
  }

  const objects: string[] = [];
  const pageObjectIds: number[] = [];

  pages.forEach((pageLines, pageIndex) => {
    const pageObjectId = 4 + pageIndex * 2;
    const contentObjectId = pageObjectId + 1;
    const content = [
      'BT',
      '/F1 8 Tf',
      `${marginX} ${startY} Td`,
      `${lineHeight} TL`,
      ...pageLines.map((line) => `(${escapePdfText(line)}) Tj T*`),
      `(${escapePdfText(`Page ${pageIndex + 1} of ${pages.length}`)}) Tj`,
      'ET',
    ].join('\n');

    pageObjectIds.push(pageObjectId);
    objects[pageObjectId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
    objects[contentObjectId - 1] = `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`;
  });

  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[2] = '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>';
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

function getPayableAmount(value: number) {
  return Math.round(Number(value || 0));
}

function getPeriodBounds(startDate?: string, endDate?: string) {
  const currentDate = new Date();
  const today = currentDate.toISOString().slice(0, 10);
  const from = startDate || today;
  const to = endDate || from;
  const start = new Date(`${from}T00:00:00.000`);
  const end = new Date(`${to}T23:59:59.999`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new BadRequestException('Invalid report period');
  }

  if (start > end) {
    throw new BadRequestException('Start date cannot be after end date');
  }

  return {
    start,
    end,
    startDate: from,
    endDate: to,
  };
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

  async report(startDate?: string, endDate?: string) {
    const period = getPeriodBounds(startDate, endDate);
    const kots = await this.kotRepository
      .createQueryBuilder('kot')
      .withDeleted()
      .leftJoinAndSelect('kot.table', 'table')
      .leftJoinAndSelect('kot.waiter', 'waiter')
      .leftJoinAndSelect('kot.cashier', 'cashier')
      .leftJoinAndSelect('kot.items', 'items')
      .leftJoinAndSelect('items.menuItem', 'menuItem')
      .where('kot.created_at BETWEEN :startDate AND :endDate', {
        startDate: period.start,
        endDate: period.end,
      })
      .orderBy('kot.created_at', 'DESC')
      .getMany();
    const bills = await this.billRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.billItems', 'billItems')
      .where('bill.bill_date BETWEEN :startDate AND :endDate', {
        startDate: period.start,
        endDate: period.end,
      })
      .orderBy('bill.bill_date', 'DESC')
      .getMany();
    const kotRows = kots.map((kot) => {
      const total = kot.items.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0,
      );

      return {
        id: kot.id,
        table_no: kot.table_no,
        table_name: kot.table?.name || `Table ${kot.table_no}`,
        waiter_name: kot.waiter?.name || '-',
        cashier_name: kot.cashier?.username || '-',
        item_count: kot.items.reduce((sum, item) => sum + Number(item.quantity), 0),
        total_amount: total,
        status: kot.deleted_at ? 'SETTLED' : 'RUNNING',
        created_at: kot.created_at,
        settled_at: kot.deleted_at,
      };
    });
    const billRows = bills.map((bill) => ({
      id: bill.id,
      table_no: bill.table_no,
      bill_date: bill.bill_date,
      kot_count: bill.billItems?.length || 0,
      total_amount: Number(bill.total_amount),
      cash: Number(bill.cash),
      online: Number(bill.online),
      payment_method: bill.payment_method || 'pending',
      is_bill_generate: bill.is_bill_generate,
    }));
    const kotTotal = kotRows.reduce((sum, kot) => sum + kot.total_amount, 0);
    const billTotal = billRows.reduce((sum, bill) => sum + bill.total_amount, 0);
    const cashTotal = billRows.reduce((sum, bill) => sum + bill.cash, 0);
    const onlineTotal = billRows.reduce((sum, bill) => sum + bill.online, 0);

    return {
      period: {
        start_date: period.startDate,
        end_date: period.endDate,
      },
      kot_report: {
        total_kots: kotRows.length,
        running_kots: kotRows.filter((kot) => kot.status === 'RUNNING').length,
        settled_kots: kotRows.filter((kot) => kot.status === 'SETTLED').length,
        total_amount: kotTotal,
        rows: kotRows,
      },
      bill_report: {
        total_bills: billRows.length,
        total_amount: billTotal,
        cash: cashTotal,
        online: onlineTotal,
        pending_amount: Math.max(0, billTotal - cashTotal - onlineTotal),
        rows: billRows,
      },
    };
  }

  async getReportPdf(startDate?: string, endDate?: string, type: 'kot' | 'bill' = 'kot') {
    const report = await this.report(startDate, endDate);
    const lineWidth = 118;
    const separator = '-'.repeat(lineWidth);
    const title = type === 'bill' ? 'BILL REPORT' : 'KOT REPORT';
    const cell = (value: string | number, width: number, align: 'left' | 'right' = 'left') => {
      const text = String(value ?? '').slice(0, width);

      return align === 'right' ? text.padStart(width, ' ') : text.padEnd(width, ' ');
    };
    const formatDate = (value?: Date | string | null) => {
      if (!value) {
        return '-';
      }

      return new Date(value).toLocaleString('en-IN', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    };
    const kotRows = report.kot_report.rows.flatMap((kot) => [
      [
        cell(`#${kot.id}`, 8),
        cell(kot.table_name, 18),
        cell(kot.waiter_name, 18),
        cell(kot.cashier_name, 16),
        cell(kot.status, 10),
        cell(kot.item_count, 8, 'right'),
        cell(money(kot.total_amount), 12, 'right'),
        cell(formatDate(kot.created_at), 24),
      ].join(' '),
    ]);
    const billRows = report.bill_report.rows.flatMap((bill) => [
      [
        cell(`#${bill.id}`, 8),
        cell(bill.table_no, 10),
        cell(bill.kot_count, 8, 'right'),
        cell(bill.payment_method, 12),
        cell(money(bill.cash), 12, 'right'),
        cell(money(bill.online), 12, 'right'),
        cell(money(bill.total_amount), 12, 'right'),
        cell(formatDate(bill.bill_date), 24),
      ].join(' '),
    ]);
    const summaryLines = type === 'bill'
      ? [
        `Total Bills    : ${report.bill_report.total_bills}`,
        `Bill Amount    : Rs. ${money(report.bill_report.total_amount)}`,
        `Cash           : Rs. ${money(report.bill_report.cash)}`,
        `Online         : Rs. ${money(report.bill_report.online)}`,
        `Pending Amount : Rs. ${money(report.bill_report.pending_amount)}`,
      ]
      : [
        `Total KOTs     : ${report.kot_report.total_kots}`,
        `Running KOTs   : ${report.kot_report.running_kots}`,
        `Settled KOTs   : ${report.kot_report.settled_kots}`,
        `KOT Amount     : Rs. ${money(report.kot_report.total_amount)}`,
      ];
    const kotReportLines = [
      separator,
      'KOT REPORT',
      separator,
      [
        cell('KOT', 8),
        cell('Table', 18),
        cell('Waiter', 18),
        cell('Cashier', 16),
        cell('Status', 10),
        cell('Qty', 8, 'right'),
        cell('Amount', 12, 'right'),
        cell('Created', 24),
      ].join(' '),
      separator,
      ...(kotRows.length ? kotRows : ['No KOTs found.']),
      separator,
    ];
    const billReportLines = [
      separator,
      'BILL REPORT',
      separator,
      [
        cell('Bill', 8),
        cell('Table', 10),
        cell('KOTs', 8, 'right'),
        cell('Method', 12),
        cell('Cash', 12, 'right'),
        cell('Online', 12, 'right'),
        cell('Total', 12, 'right'),
        cell('Bill Date', 24),
      ].join(' '),
      separator,
      ...(billRows.length ? billRows : ['No bills found.']),
      separator,
    ];
    const lines = [
      centerText(title, lineWidth),
      centerText(`Period: ${report.period.start_date} to ${report.period.end_date}`, lineWidth),
      centerText(`Generated: ${formatDate(new Date())}`, lineWidth),
      '',
      separator,
      'SUMMARY',
      separator,
      ...summaryLines,
      '',
      ...(type === 'bill' ? billReportLines : kotReportLines),
    ];

    return buildA4Pdf(lines);
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
    const existingBill = existingBillItem?.bill;
    const allKotIds = existingBill
      ? Array.from(new Set([
        ...existingBill.billItems.map((billItem) => billItem.kot_id),
        ...uniqueKotIds,
      ]))
      : uniqueKotIds;

    const kots = await this.kotRepository.find({
      where: {
        id: In(allKotIds),
      },
      relations: {
        items: {
          menuItem: true,
        },
      },
    });

    if (kots.length !== allKotIds.length) {
      throw new NotFoundException('One or more KOTs were not found');
    }

    const tableNo = kots[0].table_no;
    const hasDifferentTable = kots.some((kot) => kot.table_no !== tableNo);

    if (hasDifferentTable) {
      throw new BadRequestException('A bill can only be generated for one table');
    }

    const billSummary = calculateBill(kots);

    if (existingBill) {
      existingBill.table_no = tableNo;
      existingBill.total_amount = getPayableAmount(billSummary.grandTotal);
      existingBill.is_bill_generate = true;

      const savedBill = await this.billRepository.save(existingBill);
      const existingKotIds = new Set(
        existingBill.billItems.map((billItem) => billItem.kot_id),
      );
      const missingBillItems = allKotIds
        .filter((kotId) => !existingKotIds.has(kotId))
        .map((kotId) =>
          this.billItemRepository.create({
            bill_id: savedBill.id,
            kot_id: kotId,
          }),
        );

      if (missingBillItems.length > 0) {
        await this.billItemRepository.save(missingBillItems);
      }

      return {
        ...savedBill,
        kot_ids: allKotIds,
      };
    }

    const bill = this.billRepository.create({
      table_no: tableNo,
      cash: 0,
      online: 0,
      payment_method: null,
      is_bill_generate: true,
      total_amount: getPayableAmount(billSummary.grandTotal),
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
      kot_ids: allKotIds,
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
    const payableAmount = getPayableAmount(Number(bill.total_amount));

    if (Math.abs(paidAmount - payableAmount) > 0.009) {
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
    const payableAmount = Number(bill.total_amount || getPayableAmount(netAmount));
    const roundOff = payableAmount - netAmount;
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
      `${'Net Amount'.padEnd(lineWidth - 10, ' ')}${money(payableAmount).padStart(10, ' ')}`,
      doubleSeparator,
      `${'Total Amt'.padEnd(lineWidth - 10, ' ')}${money(totalPaid || payableAmount).padStart(10, ' ')}`,
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
