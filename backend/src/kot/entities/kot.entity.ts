import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { KotItem } from './kot-item.entity';
import { Cashier } from '../../cashier/entities/cashier.entity';
import { Waiter } from '../../waiter/entities/waiter.entity';
import { TableNo } from '../../table-no/entities/table-no.entity';

@Entity('kots')
export class Kot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  table_no: number;

  @Column({
    nullable: true,
  })
  cashier_id: number;

  @Column({
    nullable: true,
  })
  waiter_id: number;

  @Column({
    default: 'OPEN',
  })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({
    nullable: true,
  })
  deleted_at: Date;

  @OneToMany(() => KotItem, (kotItem) => kotItem.kot)
  items: KotItem[];

  @ManyToOne(() => Cashier, (cashier) => cashier.kots, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'cashier_id' })
  cashier: Cashier;

  @ManyToOne(() => Waiter, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'waiter_id' })
  waiter: Waiter;

  @ManyToOne(() => TableNo, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'table_no' })
  table: TableNo;
}
