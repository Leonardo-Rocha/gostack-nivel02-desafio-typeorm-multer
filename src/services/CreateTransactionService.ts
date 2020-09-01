import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const { total } = await transactionsRepository.getBalance();

    let categoryExists = await categoriesRepository.findOne({
      title: category,
    });

    if (!categoryExists) {
      categoryExists = await categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(categoryExists);
    }

    const isOutcomeBiggerThanTotal = value > total;

    if (type === 'outcome' && isOutcomeBiggerThanTotal) {
      throw new AppError(
        'Transaction outcome is bigger than total balance.',
        400,
      );
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryExists.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
