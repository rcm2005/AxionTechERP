import type { InputHTMLAttributes } from 'react';

type SearchInputProps = InputHTMLAttributes<HTMLInputElement>;

export function SearchInput(props: SearchInputProps) {
  return <input type="text" {...props} />;
}
