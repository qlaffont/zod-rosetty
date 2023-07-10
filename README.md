[![Maintainability](https://api.codeclimate.com/v1/badges/9079044bcd955c2a6d59/maintainability)](https://codeclimate.com/github/qlaffont/zod-rosetty/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/9079044bcd955c2a6d59/test_coverage)](https://codeclimate.com/github/qlaffont/zod-rosetty/test_coverage) ![npm](https://img.shields.io/npm/v/zod-rosetty) ![npm](https://img.shields.io/npm/dm/zod-rosetty) ![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/zod-rosetty) ![NPM](https://img.shields.io/npm/l/zod-rosetty)
# zod-rosetty

Translate Zod Errors with rosetty

Inspired by [aiji42/zod-i18n](https://github.com/aiji42/zod-i18n) .

## Usage

```bash

pnpm install zod-rosetty zod rosetty

```


## How to use?

```js
import { z } from "zod";
import { zodRosettyMap, ZodErrorMap } from "zod-rosetty";
import { locales, rosetty } from 'rosetty';

//Initialize Rosetty Error Map
z.setErrorMap(zodRosettyMap);

//Initialize Rosetty
const rosettyMap: ZodErrorMap = {
  zod: {
    errors: {
      invalid_string: {
        email: 'Invalid {{validation}}',
      },
    },
    validations: {
      email: 'email',
    },
  },
};
const { t } = rosetty<typeof rosettyMap>(
  { en: { dict: rosettyMap, locale: locales.enGB } },
  'en',
);

const schema = z.string().email();
translateZodErrorMessage(schema.safeParse('test').error, t) // 'Invalid email'
```

## Test

To test this package:

```bash
pnpm test
```

## Maintain

This package use [TSdx](https://github.com/jaredpalmer/tsdx). Please check documentation to update this package.
