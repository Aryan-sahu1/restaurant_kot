import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('dummy')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, nullable: true })
  name: string | null;
}