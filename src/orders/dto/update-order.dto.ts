import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsEnum, IsString, IsUUID } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { OrderStatusList } from '../enums';

export class UpdateOrderDto {
  @IsUUID()
  @IsString()
  id: string;

  @IsEnum(OrderStatusList, {
    message: `Possible status values are: ${OrderStatusList.join(', ')}`
  })
  status: OrderStatus;
}
