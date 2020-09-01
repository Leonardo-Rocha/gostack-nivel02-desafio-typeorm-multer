import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const incomeTransactions = await this.find({
      select: ['value'],
      where: { type: 'income' },
    });

    const outcomeTransactions = await this.find({
      select: ['value'],
      where: { type: 'outcome' },
    });

    const income = this.sumTransactionsValues(incomeTransactions);
    const outcome = this.sumTransactionsValues(outcomeTransactions);

    const total = income - outcome;

    return {
      income,
      outcome,
      total,
    };
  }

  private sumTransactionsValues(transactions: Transaction[]): number {
    const { value } = transactions.reduce(
      (accumulator, currentValue) => {
        accumulator.value += currentValue.value;
        return accumulator;
      },
      {
        value: 0,
      },
    );

    return value;
  }
}

export default TransactionsRepository;
