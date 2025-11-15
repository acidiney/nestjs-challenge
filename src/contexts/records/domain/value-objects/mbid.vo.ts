import { BadRequestException } from '@nestjs/common';

export class MBID {
  private constructor(private readonly raw: string) {}

  static from(value: string): MBID {
    const v = value?.trim();

    if (!v || !MBID.isValid(v)) {
      throw new BadRequestException('Invalid MBID format');
    }
    return new MBID(v.toLowerCase());
  }

  static isValid(value: string): boolean {
    const v = value?.trim();
    if (!v) return false;
    const uuid4 =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return uuid4.test(v);
  }

  toString(): string {
    return this.raw;
  }

  equals(other: MBID | string): boolean {
    const otherVal =
      typeof other === 'string' ? other.trim().toLowerCase() : other.raw;
    return this.raw === otherVal;
  }
}
