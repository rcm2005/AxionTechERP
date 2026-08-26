export type ID = string;

export type Tone = 'green' | 'orange' | 'red' | 'blue' | 'neutral';

export interface Paginated<T> {
  items: T[];
  total: number;
}
