/**
 * Utilidades para manejar la herencia de estilos CSS en el sistema de plantillas
 */

import { StyleConfig } from "../types/core";
import { Field, HeaderFooterConfig } from "../types/template";

/**
 * Combina estilos con herencia, donde los estilos del hijo tienen precedencia
 * sobre los del padre, pero solo si no están vacíos/undefined
 */
export function combineStyles(
  parentStyle: StyleConfig | undefined,
  childStyle: StyleConfig | undefined
): StyleConfig {
  const combined: StyleConfig = {};

  // Primero aplicar estilos del padre (solo propiedades que deberían heredarse)
  if (parentStyle) {
    if (parentStyle.primary_color)
      combined.primary_color = parentStyle.primary_color;
    if (parentStyle.background_color)
      combined.background_color = parentStyle.background_color;
    if (parentStyle.font_size) combined.font_size = parentStyle.font_size;
    if (parentStyle.icon_size) combined.icon_size = parentStyle.icon_size;
    if (parentStyle.font_weight) combined.font_weight = parentStyle.font_weight;
    if (parentStyle.font_style) combined.font_style = parentStyle.font_style;
    if (parentStyle.text_decoration)
      combined.text_decoration = parentStyle.text_decoration;
    if (parentStyle.text_align) combined.text_align = parentStyle.text_align;
    if (parentStyle.font) combined.font = parentStyle.font;
    if (parentStyle.secondary_color)
      combined.secondary_color = parentStyle.secondary_color;
    if (parentStyle.list_style_type)
      combined.list_style_type = parentStyle.list_style_type;
    if (parentStyle.list_items_layout)
      combined.list_items_layout = parentStyle.list_items_layout;
  }

  // Luego sobrescribir con estilos del hijo si existen
  if (childStyle) {
    if (childStyle.primary_color)
      combined.primary_color = childStyle.primary_color;
    if (childStyle.background_color)
      combined.background_color = childStyle.background_color;
    if (childStyle.font_size) combined.font_size = childStyle.font_size;
    if (childStyle.icon_size) combined.icon_size = childStyle.icon_size;
    if (childStyle.font_weight) combined.font_weight = childStyle.font_weight;
    if (childStyle.font_style) combined.font_style = childStyle.font_style;
    if (childStyle.text_decoration)
      combined.text_decoration = childStyle.text_decoration;
    if (childStyle.text_align) combined.text_align = childStyle.text_align;
    // Las propiedades de layout/espaciado y visuales no se heredan, solo se toman del hijo
    if (childStyle.background_image)
      combined.background_image = childStyle.background_image;
    if (childStyle.padding) combined.padding = childStyle.padding;
    if (childStyle.margin) combined.margin = childStyle.margin;
    if (childStyle.gap) combined.gap = childStyle.gap;
    if (childStyle.border_color)
      combined.border_color = childStyle.border_color;
    if (childStyle.border_width)
      combined.border_width = childStyle.border_width;
    if (childStyle.border_radius)
      combined.border_radius = childStyle.border_radius;
    if (childStyle.font) combined.font = childStyle.font;
    if (childStyle.secondary_color)
      combined.secondary_color = childStyle.secondary_color;
    if (childStyle.list_style_type)
      combined.list_style_type = childStyle.list_style_type;
    if (childStyle.list_items_layout)
      combined.list_items_layout = childStyle.list_items_layout;
  }

  return combined;
}

/**
 * Obtiene los estilos efectivos de un campo considerando la herencia
 * Si el campo no ha sido editado manualmente, hereda del contenedor padre
 */
export function getEffectiveFieldStyles(
  field: Field,
  containerStyle: StyleConfig | undefined
): StyleConfig {
  // Si el campo no ha sido editado manualmente, usar principalmente los estilos del contenedor
  if (!field.style_manually_edited && containerStyle) {
    return combineStyles(containerStyle, field.style_config);
  }

  // Si ha sido editado manualmente, usar los estilos del campo con fallback al contenedor
  return combineStyles(containerStyle, field.style_config);
}

/**
 * Hereda estilos del contenedor padre cuando se crea un nuevo campo
 * o cuando se actualizan los estilos globales del contenedor
 */
export function inheritStylesFromContainer(
  field: Field,
  containerStyle: StyleConfig | undefined
): Field {
  // Solo heredar si el usuario no ha editado manualmente los estilos
  if (field.style_manually_edited) {
    return field;
  }

  // Si no hay estilo del contenedor, devolver el campo sin cambios
  if (!containerStyle) {
    return field;
  }

  // Para campos que heredan, aplicar directamente los estilos del contenedor
  // pero solo propiedades que deberían heredarse (texto y colores)
  const inheritedStyles: StyleConfig = {};

  // Aplicar solo estilos heredables del contenedor
  if (containerStyle.primary_color) {
    inheritedStyles.primary_color = containerStyle.primary_color;
  }
  if (containerStyle.background_color) {
    inheritedStyles.background_color = containerStyle.background_color;
  }
  if (containerStyle.font_size) {
    inheritedStyles.font_size = containerStyle.font_size;
  }
  if (containerStyle.icon_size) {
    inheritedStyles.icon_size = containerStyle.icon_size;
  }
  if (containerStyle.font_weight) {
    inheritedStyles.font_weight = containerStyle.font_weight;
  }
  if (containerStyle.font_style) {
    inheritedStyles.font_style = containerStyle.font_style;
  }
  if (containerStyle.text_decoration) {
    inheritedStyles.text_decoration = containerStyle.text_decoration;
  }
  if (containerStyle.text_align) {
    inheritedStyles.text_align = containerStyle.text_align;
  }
  if (containerStyle.font) {
    inheritedStyles.font = containerStyle.font;
  }
  if (containerStyle.secondary_color) {
    inheritedStyles.secondary_color = containerStyle.secondary_color;
  }

  // Las propiedades de layout/espaciado NO se heredan automáticamente
  // padding, margin, border_color, border_width, border_radius
  // Estas deben configurarse individualmente para cada campo

  return {
    ...field,
    style_config: {
      ...inheritedStyles,
      // Permitir que estilos específicos del campo sobrescriban los heredados
      ...(field.style_config || {}),
    },
  };
}

/**
 * Propaga cambios de estilos globales a todos los campos que no han sido editados manualmente
 */
export function propagateContainerStyleChanges(
  fields: Field[],
  containerStyle: StyleConfig | undefined
): Field[] {
  return fields.map((field) => {
    // Solo propagar cambios a campos que no han sido editados manualmente
    if (field.style_manually_edited) {
      return field; // Mantener el campo sin cambios si fue editado manualmente
    }

    // Para campos que heredan, limpiar estilos heredados anteriores y aplicar nuevos
    const resetField = {
      ...field,
      style_config: undefined, // Limpiar estilos heredados anteriores
    };

    // Aplicar nuevos estilos del contenedor
    return inheritStylesFromContainer(resetField, containerStyle);
  });
}

/**
 * Marca un campo como editado manualmente en sus estilos
 */
export function markFieldStyleAsManuallyEdited(field: Field): Field {
  return {
    ...field,
    style_manually_edited: true,
  };
}

/**
 * Resetea el flag de edición manual y limpia los estilos personalizados,
 * permitiendo que el campo vuelva a heredar completamente del contenedor
 */
export function resetFieldStyleInheritance(
  field: Field,
  containerStyle?: StyleConfig
): Field {
  // Resetear el flag y limpiar los estilos personalizados
  const resetField = {
    ...field,
    style_manually_edited: false,
    style_config: undefined, // Limpiar estilos personalizados
  };

  // Aplicar herencia del contenedor si está disponible
  if (containerStyle) {
    return inheritStylesFromContainer(resetField, containerStyle);
  }

  return resetField;
}

/**
 * Obtiene los estilos que un campo heredaría de su contenedor
 * (útil para mostrar preview en la UI)
 */
export function getInheritableStyles(
  containerStyle: StyleConfig | undefined
): StyleConfig {
  if (!containerStyle) return {};

  // Solo retornar propiedades que realmente se heredan (texto y colores)
  const inheritable: StyleConfig = {};

  if (containerStyle.primary_color) {
    inheritable.primary_color = containerStyle.primary_color;
  }
  if (containerStyle.background_color) {
    inheritable.background_color = containerStyle.background_color;
  }
  if (containerStyle.font_size) {
    inheritable.font_size = containerStyle.font_size;
  }
  if (containerStyle.icon_size) {
    inheritable.icon_size = containerStyle.icon_size;
  }
  if (containerStyle.font_weight) {
    inheritable.font_weight = containerStyle.font_weight;
  }
  if (containerStyle.font_style) {
    inheritable.font_style = containerStyle.font_style;
  }
  if (containerStyle.text_decoration) {
    inheritable.text_decoration = containerStyle.text_decoration;
  }
  if (containerStyle.text_align) {
    inheritable.text_align = containerStyle.text_align;
  }
  if (containerStyle.font) {
    inheritable.font = containerStyle.font;
  }
  if (containerStyle.secondary_color) {
    inheritable.secondary_color = containerStyle.secondary_color;
  }

  return inheritable;
}
