import {
  IsArray,
  IsInt,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

class KotItemDto {
  @IsInt()
  menu_item_id: number;

  @IsInt()
  quantity: number;
}

export class CreateKotDto {
  @IsInt()
  table_no: number;

  @IsInt()
  waiter_id: number;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => KotItemDto)
  items: KotItemDto[];
}
