interface LegacyBook {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly year: number;
  readonly genre: string;
  readonly rating: number;
  readonly available: boolean;
}
export const books: readonly LegacyBook[];
export const genres: Readonly<Record<string, string>>;
