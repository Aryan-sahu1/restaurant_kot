import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateWaiterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
