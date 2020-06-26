import csvParse from 'csv-parse';
import fs from 'fs';

// eslint-disable-next-line import/prefer-default-export
export function isNullOrUndefined<T>(
  obj: T | null | undefined,
): obj is null | undefined {
  return typeof obj === 'undefined' || obj === null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadCSV(filePath: string): Promise<any[]> {
  const readCSVStream = fs.createReadStream(filePath);

  const parseStream = csvParse({
    from_line: 2,
    ltrim: true,
    rtrim: true,
  });

  const parseCSV = readCSVStream.pipe(parseStream);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lines: any[] = [];

  parseCSV.on('data', line => {
    lines.push(line);
  });

  await new Promise(resolve => {
    parseCSV.on('end', resolve);
  });

  return lines;
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    const csvFileExists = await fs.promises.stat(filePath);

    if (csvFileExists) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.log(err);
  }
}
