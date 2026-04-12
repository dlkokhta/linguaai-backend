import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ExampleDto {
  @IsString()
  @IsNotEmpty()
  en: string;

  @IsString()
  @IsNotEmpty()
  ka: string;
}

export class SaveWordDto {
  @IsString()
  @IsNotEmpty()
  word: string;

  @IsString()
  @IsNotEmpty()
  translation: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExampleDto)
  examples: ExampleDto[];
}
