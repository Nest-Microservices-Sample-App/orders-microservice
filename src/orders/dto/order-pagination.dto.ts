import { IsEnum, IsOptional } from "class-validator";
import { PaginationDto } from "src/common";
import { OrderStatusList } from "../enums";
import { OrderStatus } from "@prisma/client";


export class OrderPaginationDto extends PaginationDto {

    @IsOptional()
    @IsEnum(OrderStatusList, {
        message: `Possible status values are: ${OrderStatusList}`
    })
    status?: OrderStatus;
}