import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

interface IFindProducts {
  id: string;
}

interface IProductOrder {
  product_id: string;
  price: number;
  quantity: number;
}

@injectable()
class CreateProductService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found');
    }

    const ids: IFindProducts[] = [];
    products.forEach(e => {
      ids.push({ id: e.id });
    });

    const listProducts = await this.productsRepository.findAllById(ids);

    products.forEach((_, index) => {
      if (!listProducts[index]) {
        throw new AppError('Product(s) not found', 400);
      }
    });

    await this.productsRepository.updateQuantity(products);

    const listProductsOrder: IProductOrder[] = [];

    listProducts.forEach(el => {
      listProductsOrder.push({
        product_id: el.id,
        quantity: el.quantity,
        price: el.price,
      });
    });

    products.forEach((el, index) => {
      listProductsOrder[index].quantity = el.quantity;
    });

    const order = await this.ordersRepository.create({
      customer,
      products: listProductsOrder,
    });

    order.order_products.forEach(e => {
      delete e.created_at;
      delete e.updated_at;
      delete e.order_id;
      delete e.id;
    });

    delete customer.created_at;
    delete customer.updated_at;
    Object.assign(order, { customer });
    return order;
  }
}

export default CreateProductService;
