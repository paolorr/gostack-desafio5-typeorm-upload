import { getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  id: string;
}
class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const repository = getCustomRepository(TransactionsRepository);
    const transaction = await repository.findOne(id);

    if (!transaction) {
      throw new AppError('Transaction not found');
    }

    await repository.remove(transaction);
  }
}

export default DeleteTransactionService;
