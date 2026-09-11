import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTableNoDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  restaurant?: string;
}
