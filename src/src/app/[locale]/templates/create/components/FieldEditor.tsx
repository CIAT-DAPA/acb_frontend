'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Field, FIELD_TYPES, TextFieldConfig, ListFieldConfig, SelectFieldConfig, DateFieldConfig, PageNumberFieldConfig } from '../../../../../types/template';
import { ValidationRules } from '../../../../../types/core';

interface FieldEditorProps {
  field: Field;
  onFieldChange: (field: Field) => void;
  onClose: () => void;
}

export function FieldEditor({ field, onFieldChange, onClose }: FieldEditorProps) {
  const t = useTranslations('CreateTemplate.fieldEditor');
  const [currentField, setCurrentField] = useState<Field>(field);

  const updateField = useCallback((updates: Partial<Field>) => {
    setCurrentField(prev => ({ ...prev, ...updates } as Field));
  }, []);

  const updateFieldConfig = useCallback((configUpdates: Record<string, unknown>) => {
    setCurrentField(prev => ({
      ...prev,
      field_config: {
        ...prev.field_config,
        ...configUpdates
      }
    } as Field));
  }, []);

  const updateValidation = useCallback((validationUpdates: Partial<ValidationRules>) => {
    setCurrentField(prev => ({
      ...prev,
      validation: {
        ...prev.validation,
        ...validationUpdates
      }
    } as Field));
  }, []);

  const handleSave = useCallback(() => {
    onFieldChange(currentField);
    onClose();
  }, [currentField, onFieldChange, onClose]);

  const renderFieldSpecificConfig = () => {
    switch (currentField.type) {
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('textConfig.subtype', { default: 'Subtipo de texto' })}
              </label>
              <select
                value={(currentField.field_config as TextFieldConfig)?.subtype || 'short'}
                onChange={(e) => updateFieldConfig({ subtype: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="short">{t('textConfig.short', { default: 'Corto' })}</option>
                <option value="long">{t('textConfig.long', { default: 'Largo' })}</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('validation.minLength', { default: 'Longitud mínima' })}
                </label>
                <input
                  type="number"
                  value={currentField.validation?.min_length || ''}
                  onChange={(e) => updateValidation({ min_length: parseInt(e.target.value) || undefined })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('validation.maxLength', { default: 'Longitud máxima' })}
                </label>
                <input
                  type="number"
                  value={currentField.validation?.max_length || ''}
                  onChange={(e) => updateValidation({ max_length: parseInt(e.target.value) || undefined })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="255"
                />
              </div>
            </div>
          </div>
        );

      case 'number':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('numberConfig.minValue', { default: 'Valor mínimo' })}
              </label>
              <input
                type="number"
                value={currentField.validation?.min_value || ''}
                onChange={(e) => updateValidation({ min_value: parseFloat(e.target.value) || undefined })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('numberConfig.maxValue', { default: 'Valor máximo' })}
              </label>
              <input
                type="number"
                value={currentField.validation?.max_value || ''}
                onChange={(e) => updateValidation({ max_value: parseFloat(e.target.value) || undefined })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('numberConfig.decimalPlaces', { default: 'Decimales' })}
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={currentField.validation?.decimal_places || ''}
                onChange={(e) => updateValidation({ decimal_places: parseInt(e.target.value) || undefined })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="2"
              />
            </div>
          </div>
        );

      case 'date':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dateConfig.format', { default: 'Formato de fecha' })}
            </label>
            <select
              value={(currentField.field_config as DateFieldConfig)?.date_format || 'YYYY-MM-DD'}
              onChange={(e) => updateFieldConfig({ date_format: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD-MM-YYYY">DD-MM-YYYY</option>
            </select>
          </div>
        );

      case 'page_number':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('pageNumberConfig.format', { default: 'Formato' })}
            </label>
            <input
              type="text"
              value={(currentField.field_config as PageNumberFieldConfig)?.format || 'Página {page} de {total}'}
              onChange={(e) => updateFieldConfig({ format: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Página {page} de {total}"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('pageNumberConfig.help', { default: 'Usa {page} para número actual y {total} para total de páginas' })}
            </p>
          </div>
        );

      default:
        return (
          <div className="text-center py-4 text-gray-500">
            {t('noConfig', { default: 'No hay configuraciones específicas para este tipo de campo' })}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Información básica */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('basic.fieldId', { default: 'ID del Campo' })} *
          </label>
          <input
            type="text"
            value={currentField.field_id}
            onChange={(e) => updateField({ field_id: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="mi_campo_unico"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('basic.displayName', { default: 'Nombre a Mostrar' })} *
          </label>
          <input
            type="text"
            value={currentField.display_name}
            onChange={(e) => updateField({ display_name: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nombre del Campo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('basic.type', { default: 'Tipo de Campo' })} *
          </label>
          <select
            value={currentField.type}
            onChange={(e) => updateField({ type: e.target.value as Field['type'] })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            {FIELD_TYPES.map(type => (
              <option key={type} value={type}>
                {t(`fieldTypes.${type}`, { default: type })}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('basic.label', { default: 'Etiqueta' })}
          </label>
          <input
            type="text"
            value={currentField.label || ''}
            onChange={(e) => updateField({ label: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Etiqueta para el usuario"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('basic.description', { default: 'Descripción' })}
          </label>
          <textarea
            rows={2}
            value={currentField.description || ''}
            onChange={(e) => updateField({ description: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Descripción o ayuda para el usuario"
          />
        </div>
      </div>

      {/* Opciones de visibilidad */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('visibility.title', { default: 'Visibilidad' })}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="show_in_form"
              checked={currentField.form}
              onChange={(e) => updateField({ form: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="show_in_form" className="ml-2 text-sm text-gray-700">
              {t('visibility.form', { default: 'Mostrar en formulario de creación de boletín' })}
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="show_in_bulletin"
              checked={currentField.bulletin}
              onChange={(e) => updateField({ bulletin: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="show_in_bulletin" className="ml-2 text-sm text-gray-700">
              {t('visibility.bulletin', { default: 'Mostrar en boletín final' })}
            </label>
          </div>
        </div>
      </div>

      {/* Validación */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('validation.title', { default: 'Validación' })}
        </h3>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="required"
            checked={currentField.validation?.required || false}
            onChange={(e) => updateValidation({ required: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="required" className="ml-2 text-sm text-gray-700">
            {t('validation.required', { default: 'Campo obligatorio' })}
          </label>
        </div>
      </div>

      {/* Configuración específica del tipo */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('specificConfig.title', { default: 'Configuración Específica' })}
        </h3>
        {renderFieldSpecificConfig()}
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
        >
          {t('actions.cancel', { default: 'Cancelar' })}
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
        >
          {t('actions.save', { default: 'Guardar' })}
        </button>
      </div>
    </div>
  );
}