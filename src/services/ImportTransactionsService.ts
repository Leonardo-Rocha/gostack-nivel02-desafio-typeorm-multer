import fs from 'fs';
import path from 'path';
import csvParse from 'csv-parse';

import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import CreateTransactionService from './CreateTransactionService';
import AppError from '../errors/AppError';

interface Request {
  filename: string;
}

class ImportTransactionsService {
  async execute({ filename: fileName }: Request): Promise<Transaction[]> {
    const rows = await this.loadCSV(fileName);

    if (!rows) {
      throw new AppError('Unable to read csv.', 400);
    }

    const createTransaction = new CreateTransactionService();

    const transactions = await Promise.all(
      rows.map(async row => {
        const [title, type, value, category] = row;

        try {
          const transaction = await createTransaction.execute({
            title,
            value: Number(value),
            type: type as 'income' | 'outcome',
            category,
          });

          return transaction;
        } catch (err) {
          throw new AppError('Unable to create transactions.', 500);
        }
      }),
    );

    return transactions;
  }

  private async loadCSV(fileName: string): Promise<string[][]> {
    const csvFilePath = path.join(uploadConfig.directory, fileName);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const lines: string[][] = [];

    parseCSV.on('data', line => {
      lines.push(line);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    return lines;
  }
}

export default ImportTransactionsService;
