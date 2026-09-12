import {
  IsNumber,
  Min,
} from 'class-validator';

export class SettleBillDto {
  @IsNumber()
  @Min(0)
  cash: number;

  @IsNumber()
  @Min(0)
  online: number;
}
