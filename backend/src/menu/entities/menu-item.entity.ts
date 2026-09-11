import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    nullable: true,
  })
  code: string;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    nullable: true,
  })
  srate: number;

@Column({
    nullable: true,
  })
  trate: string;
}
