import { ValueTransformer } from 'typeorm';
import { isNullOrUndefined } from '../../utils/utils';

export default class ColumnNumericTransformer implements ValueTransformer {
  to(data?: number | null): number | null {
    if (!isNullOrUndefined(data)) {
      return data;
    }
    return null;
  }

  from(data?: string | null): number | null {
    if (!isNullOrUndefined(data)) {
      const parsedDate = parseFloat(data);
      // eslint-disable-next-line no-restricted-globals
      if (isNaN(parsedDate)) {
        return null;
      }
      return parsedDate;
    }
    return null;
  }
}
