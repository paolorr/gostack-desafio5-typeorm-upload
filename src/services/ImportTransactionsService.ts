/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import fs from 'fs';
import csvParse from 'csv-parse';
import { getRepository, getCustomRepository, In } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  filePath: string;
}

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ filePath }: Request): Promise<Transaction[]> {
    const readStream = fs.createReadStream(filePath);

    const parser = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readStream.pipe(parser);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line;

      if (!title || !type || !value || !category) {
        return;
      }

      categories.push(category);

      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepositories = getRepository(Category);

    const existentCategories = await categoriesRepositories.find({
      where: { title: In(categories) },
    });

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );
    const addCategoriesTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepositories.create(
      addCategoriesTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepositories.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return createdTransactions;

    // const lines = await loadCSV(filePath);

    // const createService = new CreateTransactionService();
    // const deleteService = new DeleteTransactionService();

    // const transactions: Transaction[] = [];

    // // nao esta funcionando na primeira execucao pois esta incluindo fora de ordem
    // // const promises = lines.map(async line => {
    // //   console.log(line);
    // //   const [title, type, value, category] = line;
    // //   const transaction = await createService.execute({
    // //     title,
    // //     type,
    // //     value,
    // //     category,
    // //   });

    // //   transactions.push(transaction);
    // // });

    // // try {
    // //   await Promise.all(promises);
    // // } catch (err) {
    // //   console.log(err);
    // //   for (const transaction of transactions) {
    // //     await deleteService.execute({ id: transaction.id });
    // //   }
    // //   throw err;
    // // }

    // // eslint-disable-next-line no-restricted-syntax
    // for (const line of lines) {
    //   const [title, type, value, category] = line;
    //   try {
    //     // eslint-disable-next-line no-await-in-loop
    //     const transaction = await createService.execute({
    //       title,
    //       type,
    //       value,
    //       category,
    //     });

    //     transactions.push(transaction);
    //   } catch (err) {
    //     for (const transaction of transactions) {
    //       await deleteService.execute({ id: transaction.id });
    //     }
    //     await deleteFile(filePath);
    //     throw err;
    //   }
    // }

    // await deleteFile(filePath);

    // return transactions;
  }
}

export default ImportTransactionsService;
