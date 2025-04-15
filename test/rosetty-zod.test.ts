/**
 * @jest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { rosetty } from 'rosetty';
import { z, ZodError, ZodErrorMap } from 'zod';

import { translateZodErrorMessage, zodRosettyMap } from '../src';

z.setErrorMap(zodRosettyMap);

const rosettyMap: Partial<ZodErrorMap> = {
  zod: {
    errors: {
      invalid_type_received_undefined: 'Required',
      invalid_string: {
        email: 'Invalid {{validation}}',
      },
      invalid_type: 'Expected {{expected}}, received {{received}}',
    },
    validations: {
      email: 'email',
    },
    types: {
      string: 'string',
      number: 'number',
    },
  },
};

const getMessageError = (zodError: ZodError) => {
  return JSON.parse(zodError.message)[0].message;
};

describe('Rosetty Zod', () => {
  describe('makeZodRosettyMap', () => {
    it('should be able to convert errors with values to string', async () => {
      const schema = z.string().email();
      //@ts-ignore
      expect(getMessageError(schema.safeParse('test').error)).toBe(
        'zod.errors.invalid_string.email - {"validation":"zod.validations.email"}',
      );
    });

    it('should be able to convert errors ', async () => {
      const schema = z.string();
      //@ts-ignore
      expect(getMessageError(schema.safeParse().error)).toBe(
        'zod.errors.invalid_type_received_undefined',
      );
    });
  });

  describe('translateZodErrorMessage', () => {
    const { t } = rosetty({ en: { dict: rosettyMap, locale: "en-GB" } }, 'en');

    it('should be able to convert errors with values to string', async () => {
      const schema = z.string().email();
      //@ts-ignore
      expect(translateZodErrorMessage(schema.safeParse('test').error, t)).toBe(
        'Invalid email',
      );
      //@ts-ignore
      expect(translateZodErrorMessage(schema.safeParse(123).error, t)).toBe(
        'Expected string, received number',
      );
    });

    it('should be able to convert errors ', async () => {
      const schema = z.string();
      //@ts-ignore
      expect(translateZodErrorMessage(schema.safeParse().error, t)).toBe(
        'Required',
      );
    });

    it('should return nothing if no translation function ', async () => {
      const schema = z.string();
      //@ts-ignore
      expect(translateZodErrorMessage(schema.safeParse().error)).toBe(
        undefined,
      );
    });
  });

  describe('test all schema', () => {
    it('should be able to validate all schema', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let schema: any = z.string();
      expect(
        getMessageError(schema.safeParse(undefined).error),
      ).toMatchSnapshot();

      schema = z.literal('CHECK');

      expect(getMessageError(schema.safeParse('tr').error)).toMatchSnapshot();

      schema = z.object({}).strict();

      expect(
        getMessageError(schema.safeParse({ tot: true }).error),
      ).toMatchSnapshot();

      schema = z.union([
        z.object({ a: z.number() }),
        z.object({ b: z.number() }),
      ]);

      expect(
        getMessageError(schema.safeParse({ tot: true }).error),
      ).toMatchSnapshot();

      schema = z.enum(['Foo', 'Bar']);

      expect(getMessageError(schema.safeParse('to').error)).toMatchSnapshot();

      schema = z.string().startsWith('toto');

      expect(getMessageError(schema.safeParse('qwe').error)).toMatchSnapshot();

      schema = z.string().endsWith('toto');

      expect(getMessageError(schema.safeParse('qwe').error)).toMatchSnapshot();

      schema = z.string().min(5);

      expect(getMessageError(schema.safeParse('qwe').error)).toMatchSnapshot();

      schema = z.string().max(2);

      expect(getMessageError(schema.safeParse('qwe').error)).toMatchSnapshot();

      schema = z.custom((v) => v === true);

      expect(getMessageError(schema.safeParse(false).error)).toMatchSnapshot();

      schema = z.intersection(
        z.number(),
        z.number().transform((x) => x + 1),
      );

      expect(getMessageError(schema.safeParse(123).error)).toMatchSnapshot();

      schema = z.number().multipleOf(3);

      expect(getMessageError(schema.safeParse(2).error)).toMatchSnapshot();

      schema = z.number().finite();

      expect(
        getMessageError(schema.safeParse(Number.POSITIVE_INFINITY).error),
      ).toMatchSnapshot();

      schema = z.number().finite();

      expect(
        getMessageError(schema.safeParse(BigInt(3)).error),
      ).toMatchSnapshot();

      schema = z.discriminatedUnion('type', [
        z.object({ type: z.literal('a'), a: z.string() }),
        z.object({ type: z.literal('b'), b: z.string() }),
      ]);

      expect(
        getMessageError(schema.safeParse({ type: 'x', a: 'abc' }).error),
      ).toMatchSnapshot();

      schema = z.date();

      expect(
        getMessageError(schema.safeParse(new Date('invalid')).error),
      ).toMatchSnapshot();

      schema = z
        .function(z.tuple([z.string()]), z.boolean())
        .implement((arg) => {
          return arg.length as any;
        });

      try {
        schema('12' as any);
      } catch (err) {
        //@ts-ignore
        expect(getMessageError(err)).toMatchSnapshot();
      }

      schema = z
        .function(z.tuple([z.string()]), z.boolean())
        .implement((arg) => {
          return arg.length as any;
        });

      try {
        schema(12 as any);
      } catch (err) {
        //@ts-ignore
        expect(getMessageError(err)).toMatchSnapshot();
      }
    });
  });
});
