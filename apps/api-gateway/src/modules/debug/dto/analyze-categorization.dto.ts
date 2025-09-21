import { IsString, IsNumber } from "class-validator";

export class AnalyzeCategorizationDto {
  @IsString() filename!: string;
  @IsString() mimeType!: string;
  @IsNumber() size!: number;
}
