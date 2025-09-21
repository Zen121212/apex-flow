import { IsString, IsNumber } from "class-validator";

export class ExtractInvoiceDataDto {
  @IsString() filename!: string;
  @IsString() extractedText!: string;
  @IsNumber() size!: number;
}
