import type { ZodError, ZodErrorMap, ZodIssue } from 'zod';
import { locales, util } from 'zod';

export type ZodLocaleMap = {
  zod: {
    errors: {
      invalid_type: string;
      invalid_type_received_undefined: string;
      invalid_literal: string;
      unrecognized_keys: string;
      invalid_union: string;
      invalid_union_discriminator: string;
      invalid_enum_value: string;
      invalid_arguments: string;
      invalid_return_type: string;
      invalid_date: string;
      custom: string;
      invalid_intersection_types: string;
      not_multiple_of: string;
      not_finite: string;
      invalid_string: {
        email: string;
        url: string;
        uuid: string;
        cuid: string;
        regex: string;
        datetime: string;
        startsWith: string;
        endsWith: string;
      };
      too_small: {
        array: {
          exact: string;
          inclusive: string;
          not_inclusive: string;
        };
        string: {
          exact: string;
          inclusive: string;
          not_inclusive: string;
        };
        number: {
          exact: string;
          inclusive: string;
          not_inclusive: string;
        };
        set: {
          exact: string;
          inclusive: string;
          not_inclusive: string;
        };
        date: {
          exact: string;
          inclusive: string;
          not_inclusive: string;
        };
      };
      too_big: {
        array: {
          exact: string;
          inclusive: string;
          not_inclusive: string;
        };
        string: {
          exact: string;
          inclusive: string;
          not_inclusive: string;
        };
        number: {
          exact: string;
          inclusive: string;
          not_inclusive: string;
        };
        set: {
          exact: string;
          inclusive: string;
          not_inclusive: string;
        };
        date: {
          exact: string;
          inclusive: string;
          not_inclusive: string;
        };
      };
    };
    validations: {
      email: string;
      url: string;
      uuid: string;
      cuid: string;
      regex: string;
      datetime: string;
    };
    types: {
      function: string;
      number: string;
      string: string;
      nan: string;
      integer: string;
      float: string;
      boolean: string;
      date: string;
      bigint: string;
      undefined: string;
      symbol: string;
      null: string;
      array: string;
      object: string;
      unknown: string;
      promise: string;
      void: string;
      never: string;
      map: string;
      set: string;
    };
  };
};

const jsonStringifyReplacer = (_: string, value: unknown): unknown => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

function joinValues<T extends unknown[]>(array: T, separator = ' | '): string {
  return array
    .map((val) => (typeof val === 'string' ? `'${val}'` : val))
    .join(separator);
}

const enLocaleError = locales.en().localeError;

function zodTypeKeyFromParsed(data: unknown): string {
  const p = util.parsedType(data);
  if (p === 'int') return 'integer';
  if (p === 'Date') return 'date';
  return p;
}

function zodTypeKeyFromExpected(expected: string): string {
  return expected === 'int' ? 'integer' : expected;
}

function zodTypeKeyFromReceived(input: unknown, issue: Record<string, unknown>): string {
  const rec = typeof issue.received === 'string' ? issue.received : undefined;
  if (rec !== undefined) {
    if (rec === 'Infinity' || rec === '-Infinity') {
      return 'number';
    }
    if (rec === 'Invalid Date') {
      return 'date';
    }
  }
  return zodTypeKeyFromParsed(input);
}

function tooKind(origin: string): keyof ZodLocaleMap['zod']['errors']['too_small'] {
  if (origin === 'int') return 'number';
  if (origin === 'file') return 'string';
  return origin as keyof ZodLocaleMap['zod']['errors']['too_small'];
}

export const zodRosettyMap: ZodErrorMap = (issue) => {
  const i = issue as ZodIssue;
  let message: string;

  switch (i.code) {
    case 'invalid_type': {
      if (
        String(i.expected) !== 'undefined' &&
        util.parsedType(i.input) === 'undefined'
      ) {
        message = `zod.errors.invalid_type_received_undefined`;
        break;
      }
      const inputInfinity =
        i.input === Number.POSITIVE_INFINITY ||
        i.input === Number.NEGATIVE_INFINITY;
      const recvInfinity =
        'received' in i &&
        typeof (i as { received?: unknown }).received === 'string' &&
        ((i as { received?: string }).received === 'Infinity' ||
          (i as { received?: string }).received === '-Infinity');
      if (inputInfinity || recvInfinity) {
        message = 'zod.errors.not_finite';
        break;
      }
      if (
        i.expected === 'date' &&
        i.input instanceof Date &&
        Number.isNaN(i.input.getTime())
      ) {
        message = 'zod.errors.invalid_date';
        break;
      }
      const expectedLabel = zodTypeKeyFromExpected(String(i.expected));
      const receivedLabel = zodTypeKeyFromReceived(
        i.input,
        i as unknown as Record<string, unknown>,
      );
      message = `zod.errors.invalid_type - ${JSON.stringify({
        expected: `zod.types.${expectedLabel}`,
        received: `zod.types.${receivedLabel}`,
      })}`;
      break;
    }
    case 'invalid_value': {
      if (i.values.length === 1) {
        message = `zod.errors.invalid_literal - ${JSON.stringify({
          expected: JSON.stringify(i.values[0], jsonStringifyReplacer),
        })}`;
      } else {
        message = `zod.errors.invalid_enum_value - ${JSON.stringify({
          options: joinValues([...i.values]),
          received: i.input,
        })}`;
      }
      break;
    }
    case 'unrecognized_keys':
      message = `zod.errors.unrecognized_keys - ${JSON.stringify({
        keys: joinValues(i.keys, ', '),
        count: i.keys.length,
      })}`;
      break;
    case 'invalid_union':
      if ('options' in i && Array.isArray(i.options) && i.options.length > 0) {
        message = `zod.errors.invalid_union_discriminator - ${JSON.stringify({
          options: joinValues([...i.options]),
        })}`;
      } else {
        message = 'zod.errors.invalid_union';
      }
      break;
    case 'invalid_format': {
      const fmt = i as unknown as Record<string, unknown>;
      if (fmt.format === 'starts_with') {
        message = `zod.errors.invalid_string.startsWith - ${JSON.stringify({
          startsWith: fmt.prefix,
        })}`;
        break;
      }
      if (fmt.format === 'ends_with') {
        message = `zod.errors.invalid_string.endsWith - ${JSON.stringify({
          endsWith: fmt.suffix,
        })}`;
        break;
      }
      message = `zod.errors.invalid_string.${fmt.format as string} - ${JSON.stringify({
        validation: `zod.validations.${fmt.format as string}`,
      })}`;
      break;
    }
    case 'too_small': {
      const minimum =
        i.origin === 'date'
          ? new Date(Number(i.minimum))
          : i.minimum;
      const kind = tooKind(String(i.origin));
      message = `zod.errors.too_small.${kind}.${i.exact ? 'exact' : i.inclusive ? 'inclusive' : 'not_inclusive'} - ${JSON.stringify({
        minimum,
        count: typeof minimum === 'number' ? minimum : undefined,
      })}`;
      break;
    }
    case 'too_big': {
      const maximum =
        i.origin === 'date'
          ? new Date(Number(i.maximum))
          : i.maximum;
      const kind = tooKind(String(i.origin));
      message = `zod.errors.too_big.${kind}.${i.exact ? 'exact' : i.inclusive ? 'inclusive' : 'not_inclusive'} - ${JSON.stringify({
        maximum,
        count: typeof maximum === 'number' ? maximum : undefined,
      })}`;
      break;
    }
    case 'not_multiple_of':
      message = `zod.errors.not_multiple_of - ${JSON.stringify({
        multipleOf: i.divisor,
      })}`;
      break;
    case 'invalid_key':
    case 'invalid_element':
      message = 'zod.errors.invalid_union';
      break;
    case 'custom':
      message = 'errors.custom';
      break;
    default: {
      const fb = enLocaleError(issue);
      message = typeof fb === 'string' ? fb : fb?.message ?? 'Invalid input';
    }
  }

  return { message };
};

export function translateZodErrorMessage(
  error: ZodError | undefined,
  /** Rosetty `t` translator (narrow keys are inferred at call sites via rosetty). */
  t?: unknown,
): string | undefined {
  if (!error || typeof t !== 'function') {
    return undefined;
  }

  const tr = t as (key: string, params?: Record<string, unknown>) => string | undefined;

  const message =
    typeof error.message === 'string' && !error.message.startsWith('[')
      ? error.message
      : JSON.parse(error.message)[0].message;

  const [key, valuesString] = message.split('-').map((part: string) => part.trim());

  if (!valuesString) {
    return tr(key);
  }
  const values = JSON.parse(valuesString);

  for (const [k, v] of Object.entries(values)) {
    if (typeof v === 'string' && v.startsWith('zod.')) {
      const [nestedKey, nestedValuesString] = v.split('-').map((part) =>
        part.trim(),
      );
      values[k] = tr(
        nestedKey,
        nestedValuesString ? JSON.parse(nestedValuesString) : {},
      );
      continue;
    }
  }

  return tr(key, values);
}
