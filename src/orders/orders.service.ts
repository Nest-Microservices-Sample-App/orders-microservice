import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PaginationDto } from 'src/common';
import { UpdateOrderDto } from './dto';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { PRODUCTS_MICROSERVICE } from 'src/config';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('Orders-Microservice');

  constructor(
    @Inject(PRODUCTS_MICROSERVICE) private readonly productsMicroservice: ClientProxy
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma Client connected');
  }


  async create(createOrderDto: CreateOrderDto) {

    try {
      const { items } = createOrderDto;
      const ids = items.map(item => item.productId);

      // Product Validation
      const products: any[] = await firstValueFrom(
        this.productsMicroservice.send({ cmd: 'validate_product' }, ids)
      );

      const totalAmount = createOrderDto.items.reduce((acc, item) => {
        const productPrice = products.find(p => p.id === item.productId).price;

        return acc + productPrice * item.quantity;

      }, 0);

      const totalItems = createOrderDto.items.reduce((acc, item) => {
        return acc + item.quantity;
      }, 0);

      const order = await this.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          orderItems: {
            createMany: {
              data: createOrderDto.items.map((item) => ({
                price: products.find(p => p.id === item.productId).price,
                quantity: item.quantity,
                productId: item.productId
              }))
            }
          },
          paid: false
        },
        include: {
          orderItems: {
            select: {
              price: true,
              quantity: true,
              productId: true
            }
          }
        }
      });

      return {
        ...order,
        orderItems: order.orderItems.map((orderItem) => ({
          ...orderItem,
          name: products.find(p => p.id === orderItem.productId).name,
        }))
      };

    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Products Validation error'
      });
    }
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {

    const { page = 1, limit = 10, status } = orderPaginationDto;
    const skip = (page - 1) * limit;
    const take = limit;

    const totalItems = await this.order.count({
      where: {
        status: status
      }
    });
    const lastPage = Math.ceil(totalItems / limit);

    const orders = await this.order.findMany({
      skip: skip,
      take: take,
      where: {
        status: status
      }
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
      },
      include: {
        orderItems: {
          select: {
            price: true,
            quantity: true,
            productId: true
          }
        }
      }
    });

    if (!order) {
      throw new RpcException({
        message: 'Order not found',
        status: HttpStatus.NOT_FOUND
      });
    }

    try {
      const products: any[] = await firstValueFrom(
        this.productsMicroservice.send({ cmd: 'validate_product' }, order.orderItems.map(item => item.productId))
      );

      return {
        ...order,
        orderItems: order.orderItems.map((orderItem) => ({
          ...orderItem,
          name: products.find(p => p.id === orderItem.productId).name,
        }))
      }

    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Orders Service Error'
      });
    }
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
