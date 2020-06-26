/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import path from 'path';

import uploadConfig from '../config/upload';
import Transaction from '../models/Transaction';
import { loadCSV, deleteFile } from '../utils/utils';
import CreateTransactionService from './CreateTransactionService';
import DeleteTransactionService from './DeleteTransactionService';

interface Request {
  filename: string;
}

class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const csvFilePath = path.resolve(uploadConfig.directory, filename);

    const lines = await loadCSV(csvFilePath);

    const createService = new CreateTransactionService();
    const deleteService = new DeleteTransactionService();

    const transactions: Transaction[] = [];

    // nao esta funcionando na primeira execucao pois esta incluindo fora de ordem
    // const promises = lines.map(async line => {
    //   console.log(line);
    //   const [title, type, value, category] = line;
    //   const transaction = await createService.execute({
    //     title,
    //     type,
    //     value,
    //     category,
    //   });

    //   transactions.push(transaction);
    // });

    // try {
    //   await Promise.all(promises);
    // } catch (err) {
    //   console.log(err);
    //   for (const transaction of transactions) {
    //     await deleteService.execute({ id: transaction.id });
    //   }
    //   throw err;
    // }

    // eslint-disable-next-line no-restricted-syntax
    for (const line of lines) {
      const [title, type, value, category] = line;
      try {
        // eslint-disable-next-line no-await-in-loop
        const transaction = await createService.execute({
          title,
          type,
          value,
          category,
        });

        transactions.push(transaction);
      } catch (err) {
        for (const transaction of transactions) {
          await deleteService.execute({ id: transaction.id });
        }
        await deleteFile(csvFilePath);
        throw err;
      }
    }

    await deleteFile(csvFilePath);

    return transactions;
  }
}

export default ImportTransactionsService;
