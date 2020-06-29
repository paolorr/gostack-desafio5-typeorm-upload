import { Router } from 'express';
import multer from 'multer';
import { getCustomRepository } from 'typeorm';

import uploadConfig from '../config/upload';
import CreateTransactionService from '../services/CreateTransactionService';
import TransactionsRepository from '../repositories/TransactionsRepository';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  const repository = getCustomRepository(TransactionsRepository);
  return response.json({
    transactions: await repository.find({ relations: ['category'] }),
    balance: await repository.getBalance(),
  });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const service = new CreateTransactionService();

  const transaction = await service.execute({ title, value, type, category });

  return response.status(201).json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const service = new DeleteTransactionService();

  await service.execute({ id });

  return response.status(204).send();
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const service = new ImportTransactionsService();

    const transactions = await service.execute({
      filePath: request.file.path,
    });

    return response.status(201).json(transactions);
  },
);

export default transactionsRouter;
