import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const findProducts = await this.ormRepository.findByIds(products);

    return findProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const ids: string[] = [];

    products.forEach(e => {
      ids.push(e.id);
    });

    const findProduct = await this.ormRepository.findByIds(ids);

    findProduct.forEach((e, index) => {
      if (findProduct[index].quantity < products[index].quantity) {
        throw new AppError(
          'The quantity of products reported exceeds the quantity in stock',
        );
      }
      findProduct[index].quantity -= products[index].quantity;
      this.ormRepository.update(e.id, {
        quantity: findProduct[index].quantity,
      });
    });

    return findProduct;
  }
}

export default ProductsRepository;
