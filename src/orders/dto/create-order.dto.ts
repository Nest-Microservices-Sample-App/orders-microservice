import { OrderStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive } from "class-validator";
import { OrderStatusList } from "../enums";

export class CreateOrderDto {

    @IsPositive()
    @IsNumber()
    @Type(() => Number)
    totalAmount: number;

    @IsPositive()
    @IsNumber()
    @Type(() => Number)
    totalItems: number;

    @IsOptional()
    @IsEnum(OrderStatusList, {
        message: `Possible status values are: ${OrderStatusList.join(', ')}`
    })
    status: OrderStatus = OrderStatus.PENDING;

    @IsOptional()
    @IsBoolean()
    paid: boolean = false;

}
