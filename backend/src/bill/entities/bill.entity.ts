import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BillItem } from './bill-item.entity';

@Entity('bill')
export class Bill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  table_no: number;

  @CreateDateColumn()
  bill_date: Date;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
  })
  cash: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
  })
  online: number;

  @Column({
    nullable: true,
  })
  payment_method: string;

  @Column({
    default: true,
  })
  is_bill_generate: boolean;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
  })
  total_amount: number;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deleted_at: Date;

  @OneToMany(() => BillItem, (billItem) => billItem.bill)
  billItems: BillItem[];
}
