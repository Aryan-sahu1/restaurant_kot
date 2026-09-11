import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

 
import { WaiterService } from './waiter.service';
import { WaiterController } from './waiter.controller';
import { Waiter } from './entities/waiter.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Waiter]),
  ],

  controllers: [
    WaiterController,
  ],

  providers: [
    WaiterService,
  ],

  exports: [
    WaiterService,
  ],
})
export class WaiterModule {}