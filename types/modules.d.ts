declare module "clsx" {
  export type ClassValue =
    | ClassArray
    | ClassDictionary
    | string
    | number
    | null
    | boolean
    | undefined;

  export interface ClassDictionary {
    [id: string]: unknown;
  }

  export type ClassArray = ClassValue[];

  export function clsx(...inputs: ClassValue[]): string;
  export default clsx;
}

declare module "tailwind-merge" {
  export type ClassNameValue =
    | string
    | null
    | boolean
    | undefined
    | ClassNameValue[];

  export function twMerge(...classLists: ClassNameValue[]): string;
  export function createTailwindMerge(...args: unknown[]): (...classLists: ClassNameValue[]) => string;
}
