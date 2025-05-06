import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { PaginationDto } from 'src/common';
import { UpdateOrderDto } from './dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('Orders-Microservice');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma Client connected');
  }


  create(createOrderDto: CreateOrderDto) {
    return this.order.create({
      data: createOrderDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {

    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;
    const take = limit;

    const totalItems = await this.order.count();
    const lastPage = Math.ceil(totalItems / limit);

    const orders = await this.order.findMany({
      skip: skip,
      take: take,
    });

    return {
      data: orders,
      metadata: {
        totalItems,
        lastPage,
        page,
        limit
      }
    }
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({
      where: {
        id: id
      }
    });

    if (!order) {
      throw new RpcException({
        message: 'Order not found',
        status: 404
      });
    }

    return order;
  }

  async changeOrderStatus(updateOrderStatus: UpdateOrderDto) {
    const { id, status } = updateOrderStatus;

    await this.findOne(id);

    return this.order.update({
      where: {
        id: id
      },
      data: {
        status: status
      }
    });
  }
}
