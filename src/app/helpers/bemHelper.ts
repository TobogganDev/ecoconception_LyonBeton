const bemCondition = (
  base: string,
  modifiers?: string | [string, string],
  condition?: boolean,
) => {
  if (!modifiers) return base;

  let modifierToApply = "";

  if (Array.isArray(modifiers)) {
    modifierToApply = condition ? modifiers[0] : modifiers[1];
  } else {
    if (condition || condition === undefined) modifierToApply = modifiers;
  }

  return `${base} ${base}--${modifierToApply}`;
};

type ModifierInput =
  | string
  | string[]
  | Record<string, boolean | undefined | null>;

export const bemHelper = (block: string) => {
  if (!block?.trim()) {
    throw new Error("Block name is required and cannot be empty");
  }

  return (element?: string | null, modifiers?: ModifierInput) => {
    const baseClass = element ? `${block}__${element}` : block;

    if (!modifiers) {
      return baseClass;
    }

    const modifierClasses: string[] = [];

    if (typeof modifiers === "string") {
      modifierClasses.push(`${baseClass}--${modifiers}`);
    } else if (Array.isArray(modifiers)) {
      modifiers.forEach((modifier) => {
        if (modifier) {
          modifierClasses.push(`${baseClass}--${modifier}`);
        }
      });
    } else if (typeof modifiers === "object") {
      Object.entries(modifiers).forEach(([key, value]) => {
        if (value) {
          modifierClasses.push(`${baseClass}--${key}`);
        }
      });
    }

    return [baseClass, ...modifierClasses].join(" ");
  };
};

type ClassNameInput =
  | string
  | string[]
  | Record<string, boolean>
  | boolean
  | null
  | undefined;

export const cn = (...inputs: ClassNameInput[]): string => {
  const classes: string[] = [];

  const processInput = (input: ClassNameInput) => {
    if (!input) return;

    if (typeof input === "string") {
      const trimmed = input.trim();
      if (trimmed) {
        classes.push(trimmed);
      }
    } else if (Array.isArray(input)) {
      input.forEach(processInput);
    } else if (typeof input === "object") {
      Object.entries(input).forEach(([key, value]) => {
        if (value) {
          const trimmed = key.trim();
          if (trimmed) {
            classes.push(trimmed);
          }
        }
      });
    }
  };

  inputs.forEach(processInput);

  return [...new Set(classes)].join(" ");
};

export default bemCondition;
