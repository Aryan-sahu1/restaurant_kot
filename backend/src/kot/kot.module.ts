import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KotController } from './kot.controller';
import { KotService } from './kot.service';

import { Kot } from './entities/kot.entity';
import { KotItem } from './entities/kot-item.entity';
import { MenuItem } from '../menu/entities/menu-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Kot,
      KotItem,
      MenuItem,
    ]),
  ],
  controllers: [KotController],
  providers: [KotService],
})
export class KotModule {}