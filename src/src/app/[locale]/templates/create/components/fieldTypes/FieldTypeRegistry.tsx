"use client";

import React from "react";
import { FieldTypeComponent } from "./BaseFieldTypeConfig";
import { TextFieldTypeConfig } from "./TextFieldTypeConfig";
import { TextWithIconFieldTypeConfig } from "./TextWithIconFieldTypeConfig";
import { NumberFieldTypeConfig } from "./NumberFieldTypeConfig";
import { DateFieldTypeConfig } from "./DateFieldTypeConfig";
import { DateRangeFieldTypeConfig } from "./DateRangeFieldTypeConfig";
import { PageNumberFieldTypeConfig } from "./PageNumberFieldTypeConfig";
import { ListFieldTypeConfig } from "./ListFieldTypeConfig";
import { SelectWithIconsFieldTypeConfig } from "./SelectWithIconsFieldTypeConfig";
import { SelectBackgroundFieldTypeConfig } from "./SelectBackgroundFieldTypeConfig";
import { ClimateDataFieldTypeConfig } from "./ClimateDataFieldTypeConfig";
import { ImageFieldTypeConfig } from "./ImageFieldTypeConfig";
import { CardFieldTypeConfig } from "./CardFieldTypeConfig";
import { DefaultFieldTypeConfig } from "./DefaultFieldTypeConfig";

// Registro de componentes por tipo de campo
const FIELD_TYPE_COMPONENTS: Record<string, FieldTypeComponent> = {
  text: TextFieldTypeConfig,
  text_with_icon: TextWithIconFieldTypeConfig,
  number: NumberFieldTypeConfig,
  date: DateFieldTypeConfig,
  date_range: DateRangeFieldTypeConfig,
  page_number: PageNumberFieldTypeConfig,
  list: ListFieldTypeConfig,
  select_with_icons: SelectWithIconsFieldTypeConfig,
  select_background: SelectBackgroundFieldTypeConfig,
  climate_data_puntual: ClimateDataFieldTypeConfig,
  image: ImageFieldTypeConfig,
  card: CardFieldTypeConfig,
};

// Factory para obtener el componente correcto según el tipo
export const getFieldTypeComponent = (fieldType: string): React.FC<any> => {
  const Component = FIELD_TYPE_COMPONENTS[fieldType];

  if (Component) {
    return Component;
  }

  // Componente por defecto para tipos no implementados
  return (props: any) => <DefaultFieldTypeConfig {...props} />;
};

// Hook personalizado para usar el componente de tipo de campo
export const useFieldTypeComponent = (fieldType: string) => {
  return getFieldTypeComponent(fieldType);
};
