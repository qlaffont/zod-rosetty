/// <reference types="bun-types" />

import type { Language } from "rosetty";
import { rosetty } from "rosetty";
import type { ZodError } from "zod";
import { z } from "zod";
import { describe, it, expect } from "bun:test";

import { translateZodErrorMessage, zodRosettyMap } from "../src";

z.setErrorMap(zodRosettyMap);

const rosettyMap = {
  zod: {
    errors: {
      invalid_type_received_undefined: "Required",
      invalid_string: {
        email: "Invalid {{validation}}",
      },
      invalid_type: "Expected {{expected}}, received {{received}}",
    },
    validations: {
      email: "email",
    },
    types: {
      string: "string",
      number: "number",
    },
  },
} as Language["dict"];

const getMessageError = (zodError: ZodError) => {
  return JSON.parse(zodError.message)[0].message;
};

describe("Rosetty Zod", () => {
  describe("makeZodRosettyMap", () => {
    it("should be able to convert errors with values to string", () => {
      const schema = z.string().email();
      expect(getMessageError(schema.safeParse("test").error!)).toBe(
        'zod.errors.invalid_string.email - {"validation":"zod.validations.email"}',
      );
    });

    it("should be able to convert errors ", () => {
      const schema = z.string();
      expect(getMessageError(schema.safeParse(undefined).error!)).toBe(
        "zod.errors.invalid_type_received_undefined",
      );
    });
  });

  describe("translateZodErrorMessage", () => {
    const { t } = rosetty({ en: { dict: rosettyMap, locale: "en-GB" } }, "en");

    it("should be able to convert errors with values to string", () => {
      const schema = z.string().email();
      expect(translateZodErrorMessage(schema.safeParse("test").error, t)).toBe("Invalid email");
      expect(translateZodErrorMessage(schema.safeParse(123).error, t)).toBe(
        "Expected string, received number",
      );
    });

    it("should be able to convert errors ", () => {
      const schema = z.string();
      expect(translateZodErrorMessage(schema.safeParse(undefined).error, t)).toBe("Required");
    });

    it("should return nothing if no translation function ", () => {
      const schema = z.string();
      expect(translateZodErrorMessage(schema.safeParse(undefined).error)).toBe(undefined);
    });
  });

  describe("test all schema", () => {
    it("should be able to validate all schema", () => {
      let schema: z.ZodType = z.string();
      expect(getMessageError(schema.safeParse(undefined).error!)).toMatchSnapshot();

      schema = z.literal("CHECK");

      expect(getMessageError(schema.safeParse("tr").error!)).toMatchSnapshot();

      schema = z.object({}).strict();

      expect(getMessageError(schema.safeParse({ tot: true }).error!)).toMatchSnapshot();

      schema = z.union([z.object({ a: z.number() }), z.object({ b: z.number() })]);

      expect(getMessageError(schema.safeParse({ tot: true }).error!)).toMatchSnapshot();

      schema = z.enum(["Foo", "Bar"]);

      expect(getMessageError(schema.safeParse("to").error!)).toMatchSnapshot();

      schema = z.string().startsWith("toto");

      expect(getMessageError(schema.safeParse("qwe").error!)).toMatchSnapshot();

      schema = z.string().endsWith("toto");

      expect(getMessageError(schema.safeParse("qwe").error!)).toMatchSnapshot();

      schema = z.string().min(5);

      expect(getMessageError(schema.safeParse("qwe").error!)).toMatchSnapshot();

      schema = z.string().max(2);

      expect(getMessageError(schema.safeParse("qwe").error!)).toMatchSnapshot();

      schema = z.custom((v: unknown) => v === true);

      expect(getMessageError(schema.safeParse(false).error!)).toMatchSnapshot();

      schema = z.intersection(z.string(), z.number());

      expect(getMessageError(schema.safeParse("x").error!)).toMatchSnapshot();

      schema = z.number().multipleOf(3);

      expect(getMessageError(schema.safeParse(2).error!)).toMatchSnapshot();

      schema = z.number().finite();

      expect(getMessageError(schema.safeParse(Number.POSITIVE_INFINITY).error!)).toMatchSnapshot();

      schema = z.number().finite();

      expect(getMessageError(schema.safeParse(BigInt(3)).error!)).toMatchSnapshot();

      schema = z.discriminatedUnion("type", [
        z.object({ type: z.literal("a"), a: z.string() }),
        z.object({ type: z.literal("b"), b: z.string() }),
      ]);

      expect(getMessageError(schema.safeParse({ type: "x", a: "abc" }).error!)).toMatchSnapshot();

      schema = z.date();

      expect(getMessageError(schema.safeParse(new Date("invalid")).error!)).toMatchSnapshot();

      const fnSchemaBadReturn = z
        .function({
          input: z.tuple([z.string()]),
          output: z.boolean(),
        })
        .implement(((s: string) => s.length) as unknown as (s: string) => boolean);

      try {
        fnSchemaBadReturn("12");
      } catch (err) {
        expect(getMessageError(err as ZodError)).toMatchSnapshot();
      }

      const fnSchemaBadArg = z
        .function({
          input: z.tuple([z.string()]),
          output: z.boolean(),
        })
        .implement((s: string) => Boolean(s.length));

      try {
        fnSchemaBadArg(12 as unknown as string);
      } catch (err) {
        expect(getMessageError(err as ZodError)).toMatchSnapshot();
      }
    });
  });
});
