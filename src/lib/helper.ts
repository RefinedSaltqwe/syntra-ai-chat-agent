import { nanoid } from "nanoid";
import Mustache from "mustache";

export function generateId(type: string): string {
  return `${type.toLowerCase()}-${nanoid(10)}`;
}

export function replaceVariables(
  template: string,
  variables: Record<string, unknown>,
) {
  return Mustache.render(template, variables);
}
