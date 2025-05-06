import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsPositive, Min } from "class-validator";

export class PaginationDto {
    @IsPositive()
    @IsOptional()
    @Type(() => Number)
    public page?: number = 0;

    @IsPositive()
    @IsOptional()
    @Type(() => Number)
    public limit?: number = 10;
}