import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SaveSentenceDto {
  @ApiProperty({ example: 'I love traveling.' })
  @IsString()
  @IsNotEmpty()
  en: string;

  @ApiProperty({ example: 'მიყვარს მოგზაურობა.' })
  @IsString()
  @IsNotEmpty()
  ka: string;

  @ApiProperty({ example: 'travel' })
  @IsString()
  @IsNotEmpty()
  topic: string;
}
