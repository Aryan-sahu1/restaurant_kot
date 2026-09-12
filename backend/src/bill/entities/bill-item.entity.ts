import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { Kot } from '../../kot/entities/kot.entity';
import { Bill } from './bill.entity';

@Entity('bill_item')
export class BillItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  bill_id: number;

  @Column()
  kot_id: number;

  @ManyToOne(() => Bill, (bill) => bill.billItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;

  @ManyToOne(() => Kot, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'kot_id' })
  kot: Kot;
}
