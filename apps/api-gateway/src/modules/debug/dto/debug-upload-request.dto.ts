import { IsString, IsNumber, IsOptional, IsIn } from "class-validator";

export class DebugUploadRequestDto {
  @IsString() filename!: string;
  @IsString() mimeType!: string;
  @IsNumber() size!: number;

  @IsOptional()
  @IsIn(["manual", "auto", "hybrid"])
  workflowSelectionMode?: "manual" | "auto" | "hybrid";

  @IsOptional() @IsString() workflowId?: string;
  @IsOptional() @IsString() documentCategory?: string;
}
