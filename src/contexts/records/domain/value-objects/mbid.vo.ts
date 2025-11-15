export class MBID {
  private constructor(private readonly raw: string) {}

  static from(value: string): MBID {
    const v = value?.trim();
    if (!v || !MBID.isValid(v)) {
      throw new Error('Invalid MBID format');
    }
    return new MBID(v.toLowerCase());
  }

  static isValid(value: string): boolean {
    const v = value?.trim();
    if (!v) return false;
    const uuidV4 =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89abAB][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidV4.test(v);
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
