import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;
}