import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class LoginCashierDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
