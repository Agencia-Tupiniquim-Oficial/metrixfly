import type { FormEvent } from "react";

// Browsers show "Please fill out this field." in their own language; these keep it in Portuguese.
export const requiredFieldMessage = "Preencha este campo.";

export const portugueseRequired = {
  onInvalid: (event: FormEvent<HTMLInputElement>) => {
    if (event.currentTarget.validity.valueMissing) {
      event.currentTarget.setCustomValidity(requiredFieldMessage);
    }
  },
  onInput: (event: FormEvent<HTMLInputElement>) => event.currentTarget.setCustomValidity(""),
};
