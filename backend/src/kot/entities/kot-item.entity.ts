import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Kot } from './kot.entity';
import { MenuItem } from '../../menu/entities/menu-item.entity';

@Entity('kot_items')
export class KotItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  kot_id: number;

  @Column()
  menu_item_id: number;

  @Column()
  quantity: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
  })
  price: number;

  @ManyToOne(() => Kot, (kot) => kot.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'kot_id' })
  kot: Kot;

  @ManyToOne(() =>  MenuItem)
  @JoinColumn({ name: 'menu_item_id' })
  menuItem: MenuItem;
}