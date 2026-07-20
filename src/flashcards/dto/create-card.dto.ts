import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCardDto {
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  @IsNotEmpty()
  @MaxLength(500)
  front: string;

  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  @IsNotEmpty()
  @MaxLength(500)
  back: string;
}
