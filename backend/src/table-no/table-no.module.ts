import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableNoController } from './table-no.controller';
import { TableNoService } from './table-no.service';
import { TableNo } from './entities/table-no.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TableNo]),
  ],
  controllers: [
    TableNoController,
  ],
  providers: [
    TableNoService,
  ],
})
export class TableNoModule {}
