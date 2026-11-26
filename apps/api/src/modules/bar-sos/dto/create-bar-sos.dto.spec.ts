import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { BarSosCategory } from '../../../../generated/prisma/client.js';
import { CreateBarSosDto } from './create-bar-sos.dto.js';

function validate(payload: object) {
  return validateSync(Object.assign(new CreateBarSosDto(), payload));
}

describe('CreateBarSosDto', () => {
  it('accepts all five categories without a description', () => {
    expect(Object.values(BarSosCategory)).toHaveLength(5);
    for (const category of Object.values(BarSosCategory)) {
      expect(validate({ category })).toEqual([]);
    }
  });

  it('rejects a missing category', () => {
    expect(validate({}).map(error => error.property)).toContain('category');
  });

  it('rejects an unknown category', () => {
    expect(validate({ category: 'UNKNOWN' }).map(error => error.property)).toContain('category');
  });

  it('accepts an optional description of up to 500 characters', () => {
    expect(validate({ category: BarSosCategory.OTHER, message: 'a'.repeat(500) })).toEqual([]);
  });

  it('rejects an oversized or non-string description', () => {
    for (const message of ['a'.repeat(501), 123]) {
      expect(validate({ category: BarSosCategory.OTHER, message }).map(error => error.property)).toContain('message');
    }
  });
});
