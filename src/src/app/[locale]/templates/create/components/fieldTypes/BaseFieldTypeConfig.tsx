"use client";

import React from "react";
import { Field } from "../../../../../../types/template";
import { ValidationRules } from "../../../../../../types/core";

export interface BaseFieldTypeConfigProps {
  currentField: Field;
  updateField: (fieldUpdates: Partial<Field>) => void;
  updateFieldConfig: (configUpdates: Record<string, unknown>) => void;
  updateValidation: (validationUpdates: Partial<ValidationRules>) => void;
  t: (key: string, options?: any) => string;
}

// Tipo base que deben implementar todos los componentes de tipo de campo
export type FieldTypeComponent = React.FC<BaseFieldTypeConfigProps>;
