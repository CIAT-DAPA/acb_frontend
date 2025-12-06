# Field Types Documentation

This documentation details all available field types in the template system, their specific configurations, and validation rules.

## Table of Contents

1. [Text Fields](#text-fields)
2. [Selection Fields](#selection-fields)
3. [Climate Data Fields](#climate-data-fields)
4. [Date Fields](#date-fields)
5. [Visual Content Fields](#visual-content-fields)
6. [Special Fields](#special-fields)

---

## Common Attributes for All Fields

All fields, regardless of their type, share these basic attributes:

| Attribute | Type | Description |
|----------|------|-------------|
| `field_id` | `string` | Unique field identifier, used to reference it in code |
| `display_name` | `string` | Field name to be displayed in the interface |
| `type` | `string` | Field type (see specific types below) |
| `description` | `string` | Field description to guide the user |
| `label` | `string` | Label to be displayed to the user in the interface |
| `form` | `boolean` | If `true`, the field appears in the edit form |
| `bulletin` | `boolean` | If `true`, the field appears in the final bulletin |
| `style_config` | `StyleConfig` | Specific style configurations for this field |
| `validation` | `ValidationRules` | Validation rules for the field |
| `field_config` | `object` | Additional configurations specific to the field type |
| `value` | `any` | Current value of the field |

### `StyleConfig` Object

The `style_config` object controls the visual appearance of the field:

```typescript
{
  font?: string;              // Font family (e.g., "Arial", "Roboto")
  color?: string;             // Text color (e.g., "#333333")
  background_color?: string;  // Background color
  font_size?: number;         // Font size in pixels
  font_weight?: string;       // Font weight (e.g., "bold", "normal")
  text_align?: string;        // Alignment (e.g., "left", "center", "right")
  padding?: string;           // Internal spacing (e.g., "10px 20px")
  margin?: string;            // External spacing (e.g., "5px")
}
```

---

## Text Fields

### 1. `text`

Basic text field that can be short or long depending on the subtype.

#### Configuration (`TextFieldConfig`)

```typescript
{
  subtype?: "short" | "long"  // Defines the expected text length
}
```

#### Specific Attributes

| Attribute | Type | Description |
|----------|------|-------------|
| `subtype` | `"short" \| "long"` | **Optional.** Defines if it's short text (input) or long text (textarea) |

#### JSON Example

```json
{
  "field_id": "bulletin_title",
  "display_name": "Bulletin Title",
  "type": "text",
  "label": "Title",
  "form": true,
  "bulletin": true,
  "field_config": {
    "subtype": "short"
  },
  "validation": {
    "required": true,
    "max_length": 100
  }
}
```

---

### 2. `text_with_icon`

Text field accompanied by a selectable icon.

#### Configuration (`TextWithIconFieldConfig`)

```typescript
{
  subtype?: "short" | "long";   // Defines the expected text length
  icon_options: string[];        // Available icon URLs
  selected_icon?: string;        // Selected icon URL (when form is false)
  showLabel?: boolean;           // If true, shows the label next to the value in preview
}
```

#### Specific Attributes

| Attribute | Type | Required | Description |
|----------|------|-----------|-------------|
| `subtype` | `"short" \| "long"` | No | Defines if it's short or long text |
| `icon_options` | `string[]` | Yes | Array of icon URLs that the user can select |
| `selected_icon` | `string` | No | Selected icon URL when `form` is `false` |
| `showLabel` | `boolean` | No | If `true`, displays the label next to the value in preview |

#### JSON Example

```json
{
  "field_id": "max_temperature",
  "display_name": "Maximum Temperature",
  "type": "text_with_icon",
  "label": "Max Temp.",
  "form": true,
  "bulletin": true,
  "field_config": {
    "subtype": "short",
    "icon_options": [
      "/assets/icons/temp_high.png",
      "/assets/icons/thermometer.png"
    ],
    "selected_icon": "/assets/icons/temp_high.png",
    "showLabel": true
  }
}
```

---

## Selection Fields

### 3. `select`

Simple selection field with predefined options.

#### Configuration (`SelectFieldConfig`)

```typescript
{
  options: string[];          // Available options
  allow_multiple?: boolean;   // If it allows multiple selection
}
```

#### Specific Attributes

| Attribute | Type | Required | Description |
|----------|------|-----------|-------------|
| `options` | `string[]` | Yes | List of available options to select |
| `allow_multiple` | `boolean` | No | If `true`, allows selecting multiple options |

#### JSON Example

```json
{
  "field_id": "crop",
  "display_name": "Crop",
  "type": "select",
  "label": "Select the crop",
  "form": true,
  "bulletin": true,
  "field_config": {
    "options": ["Coffee", "Rice", "Corn", "Beans"],
    "allow_multiple": false
  },
  "validation": {
    "required": true
  }
}
```

---

### 4. `searchable`

Selection field with search capability and option to create new entries.

#### Configuration (`SearchableFieldConfig`)

```typescript
{
  options: string[];  // Available predefined options
}
```

#### Specific Attributes

| Attribute | Type | Required | Description |
|----------|------|-----------|-------------|
| `options` | `string[]` | Yes | List of predefined options. User can search or create new ones |

#### JSON Example

```json
{
  "field_id": "municipality",
  "display_name": "Municipality",
  "type": "searchable",
  "label": "Municipality",
  "form": true,
  "bulletin": true,
  "field_config": {
    "options": ["Pasto", "Ipiales", "Túquerres", "Samaniego"]
  }
}
```

---

### 5. `select_with_icons`

Selection field where each option has an associated icon.

#### Configuration (`SelectWithIconsFieldConfig`)

```typescript
{
  options: string[];          // Available options
  icons_url: string[];        // Icon URLs (same order as options)
  allow_multiple?: boolean;   // If it allows multiple selection
  show_label?: boolean;       // If it shows the label next to the icon
}
```

#### Specific Attributes

| Attribute | Type | Required | Description |
|----------|------|-----------|-------------|
| `options` | `string[]` | Yes | List of available options |
| `icons_url` | `string[]` | Yes | Icon URLs in the same order as options |
| `allow_multiple` | `boolean` | No | If it allows selecting multiple options |
| `show_label` | `boolean` | No | If `true`, displays the option text next to the icon |

#### JSON Example

```json
{
  "field_id": "current_weather",
  "display_name": "Current Weather",
  "type": "select_with_icons",
  "label": "Conditions",
  "form": true,
  "bulletin": true,
  "field_config": {
    "options": ["Sunny", "Cloudy", "Rainy"],
    "icons_url": [
      "/assets/icons/sun.png",
      "/assets/icons/cloud.png",
      "/assets/icons/rain.png"
    ],
    "show_label": true
  }
}
```

---

### 6. `select_background`

Background image selection field for sections or blocks.

#### Configuration (`SelectBackgroundFieldConfig`)

```typescript
{
  options: string[];          // Option names
  backgrounds_url: string[];  // Background image URLs
}
```

#### Specific Attributes

| Attribute | Type | Required | Description |
|----------|------|-----------|-------------|
| `options` | `string[]` | Yes | Descriptive names for each background |
| `backgrounds_url` | `string[]` | Yes | Background image URLs in the same order |

#### JSON Example

```json
{
  "field_id": "section_background",
  "display_name": "Section Background",
  "type": "select_background",
  "label": "Select the background",
  "form": true,
  "bulletin": false,
  "field_config": {
    "options": ["Coffee", "Rice", "Neutral"],
    "backgrounds_url": [
      "/assets/backgrounds/coffee.jpg",
      "/assets/backgrounds/rice.jpg",
      "/assets/backgrounds/neutral.jpg"
    ]
  }
}
```

---

## Climate Data Fields

### 7. `climate_data_puntual`

Specialized field to display climate data with configurable parameters.

#### Configuration (`ClimateDataFieldConfig`)

```typescript
{
  available_parameters: Record<string, {
    label: string;           // Parameter label
    unit: string;            // Unit of measurement
    type: "number" | "text"; // Data type
    col_name: string;        // Column name in data source
    showName?: boolean;      // If it shows the parameter name
    style_config?: StyleConfig; // Individual styles for this parameter
  }>
}
```

#### Specific Attributes

| Attribute | Type | Required | Description |
|----------|------|-----------|-------------|
| `available_parameters` | `Record<string, object>` | Yes | Dictionary of available climate parameters |

**Structure of each parameter:**

| Attribute | Type | Required | Description |
|----------|------|-----------|-------------|
| `label` | `string` | Yes | Parameter label (e.g., "Temperature") |
| `unit` | `string` | Yes | Unit of measurement (e.g., "°C", "mm") |
| `type` | `"number" \| "text"` | Yes | Parameter data type |
| `col_name` | `string` | Yes | Column name in the data API |
| `showName` | `boolean` | No | If `true`, displays the parameter name with the value |
| `style_config` | `StyleConfig` | No | Specific styles for this parameter |

#### JSON Example

```json
{
  "field_id": "climate_data",
  "display_name": "Climate Data",
  "type": "climate_data_puntual",
  "label": "Weather Data",
  "form": true,
  "bulletin": true,
  "field_config": {
    "available_parameters": {
      "temp_max": {
        "label": "Maximum Temperature",
        "unit": "°C",
        "type": "number",
        "col_name": "tmax",
        "showName": true,
        "style_config": {
          "color": "#ff0000"
        }
      },
      "precipitation": {
        "label": "Precipitation",
        "unit": "mm",
        "type": "number",
        "col_name": "prec",
        "showName": true
      }
    }
  }
}
```

---

## Date Fields

### 8. `date`

Field to select a single date.

#### Configuration (`DateFieldConfig`)

```typescript
{
  date_format?: string;      // Date format (e.g., "DD/MM/YYYY")
  text_decoration?: {
    prefix?: string;         // Text before the date
    suffix?: string;         // Text after the date
  }
}
```

#### Specific Attributes

| Attribute | Type | Required | Description |
|----------|------|-----------|-------------|
| `date_format` | `string` | No | Date display format |
| `text_decoration` | `object` | No | Prefix and suffix to decorate the date |

#### JSON Example

```json
{
  "field_id": "publication_date",
  "display_name": "Publication Date",
  "type": "date",
  "label": "Date",
  "form": true,
  "bulletin": true,
  "field_config": {
    "date_format": "DD/MM/YYYY",
    "text_decoration": {
      "prefix": "Published on ",
      "suffix": ""
    }
  },
  "validation": {
    "required": true
  }
}
```

---

### 9. `date_range`

Field to select a date range with option to include moon phases.

#### Configuration (`DateRangeFieldConfig`)

```typescript
{
  date_format?: string;                  // Date format
  start_date_label: string;              // Label for start date
  start_date_description: string;        // Description of start date
  end_date_label: string;                // Label for end date
  end_date_description: string;          // Description of end date
  show_moon_phases?: boolean;            // If it shows moon phase selectors
  start_moon_phase?: "llena" | "nueva" | "cuartoCreciente" | "cuartoMenguante";
  end_moon_phase?: "llena" | "nueva" | "cuartoCreciente" | "cuartoMenguante";
}
```

#### Specific Attributes

| Attribute | Type | Required | Description |
|----------|------|-----------|-------------|
| `date_format` | `string` | No | Date display format |
| `start_date_label` | `string` | Yes | Label for the start date field |
| `start_date_description` | `string` | Yes | Description/help for the start date |
| `end_date_label` | `string` | Yes | Label for the end date field |
| `end_date_description` | `string` | Yes | Description/help for the end date |
| `show_moon_phases` | `boolean` | No | If `true`, displays moon phase selectors |
| `start_moon_phase` | `string` | No | Moon phase for the start date |
| `end_moon_phase` | `string` | No | Moon phase for the end date |

**Possible values for moon phases:**
- `"llena"` - Full moon
- `"nueva"` - New moon
- `"cuartoCreciente"` - Waxing crescent
- `"cuartoMenguante"` - Waning crescent

#### JSON Example

```json
{
  "field_id": "forecast_period",
  "display_name": "Forecast Period",
  "type": "date_range",
  "label": "Period",
  "form": true,
  "bulletin": true,
  "field_config": {
    "date_format": "DD/MM/YYYY",
    "start_date_label": "Start Date",
    "start_date_description": "Forecast start date",
    "end_date_label": "End Date",
    "end_date_description": "Forecast end date",
    "show_moon_phases": true
  }
}
```

---

### 10. `moon_calendar`

Specialized field for moon calendar with phase configuration by date.

#### Configuration (`MoonCalendarFieldConfig`)

```typescript
{
  title_icon?: string;    // Icon URL for the title
  title_label?: string;   // Title text with {month} as placeholder
}
```

#### Specific Attributes

| Attribute | Type | Required | Description |
|----------|------|-----------|-------------|
| `title_icon` | `string` | No | Icon URL that accompanies the calendar title |
| `title_label` | `string` | No | Title label. Use `{month}` as placeholder for the month |

#### Value Structure

The field stores an object with the following structure:

```typescript
{
  month: string;                    // Month name (e.g., "january", "february")
  year: number;                     // Year (e.g., 2025)
  full_moon_date?: string;          // Full moon date (YYYY-MM-DD)
  new_moon_date?: string;           // New moon date (YYYY-MM-DD)
  waxing_crescent_date?: string;    // Waxing crescent date (YYYY-MM-DD)
  waning_crescent_date?: string;    // Waning crescent date (YYYY-MM-DD)
}
```

#### JSON Example

```json
{
  "field_id": "moon_calendar",
  "display_name": "Moon Calendar",
  "type": "moon_calendar",
  "label": "Moon Phases Calendar",
  "form": true,
  "bulletin": true,
  "field_config": {
    "title_icon": "/assets/icons/moon.png",
    "title_label": "Moon calendar - {month}"
  },
  "value": {
    "month": "december",
    "year": 2025,
    "full_moon_date": "2025-12-04",
    "new_moon_date": "2025-12-19",
    "waxing_crescent_date": "2025-12-11",
    "waning_crescent_date": "2025-12-27"
  }
}
```

**Notes:**
- The preview automatically displays transitions between moon phases
- Transitions use images from folders: `crecToLlena`, `llenaToMeng`, `mengToNueva`, `nuevaToCrec`
- Days before the first phase and after the last phase are automatically filled with transitions

---

## Visual Content Fields

### 11. `image`

Field to display predefined images with optional label.

#### Configuration (`ImageFieldConfig`)

```typescript
{
  images: string[];         // Available image URLs
  show_label?: boolean;     // If it shows the label below the image
  label_text?: string;      // Label text
}
```

#### Specific Attributes

| Attribute | Type | Required | Description |
|----------|------|-----------|-------------|
| `images` | `string[]` | Yes | Array of available image URLs |
| `show_label` | `boolean` | No | If `true`, displays a label below the image |
| `label_text` | `string` | No | Label text to display |

#### JSON Example

```json
{
  "field_id": "institution_logo",
  "display_name": "Logo",
  "type": "image",
  "label": "Institutional Logo",
  "form": false,
  "bulletin": true,
  "field_config": {
    "images": ["/assets/logos/main_logo.png"],
    "show_label": false
  }
}
```

---

### 12. `image_upload`

Field for users to upload their own images.

#### Configuration (`ImageUploadFieldConfig`)

```typescript
{
  max_file_size: string;      // Maximum size (e.g., "5MB")
  allowed_formats: string[];  // Allowed formats (e.g., ["jpg", "png"])
  max_width?: number;         // Maximum width in pixels
  max_height?: number;        // Maximum height in pixels
}
```

#### Specific Attributes

| Attribute | Type | Required | Description |
|----------|------|-----------|-------------|
| `max_file_size` | `string` | Yes | Maximum file size (e.g., "5MB", "10MB") |
| `allowed_formats` | `string[]` | Yes | Allowed image formats |
| `max_width` | `number` | No | Maximum width in pixels |
| `max_height` | `number` | No | Maximum height in pixels |

#### JSON Example

```json
{
  "field_id": "featured_image",
  "display_name": "Featured Image",
  "type": "image_upload",
  "label": "Upload an image",
  "form": true,
  "bulletin": true,
  "field_config": {
    "max_file_size": "5MB",
    "allowed_formats": ["jpg", "jpeg", "png", "webp"],
    "max_width": 1920,
    "max_height": 1080
  },
  "validation": {
    "required": true
  }
}
```

**Notes about the image system:**
- Images are initially uploaded to a `temp/` folder
- They are only moved to `permanent/` when the bulletin is published
- Temporary images are deleted if the bulletin is not saved
- When changing an image, the previous one is automatically deleted

---

## Special Fields

### 13. `number`

Simple numeric field.

#### Configuration

Does not require specific `field_config`.

#### JSON Example

```json
{
  "field_id": "edition_number",
  "display_name": "Edition Number",
  "type": "number",
  "label": "Edition #",
  "form": true,
  "bulletin": true,
  "validation": {
    "required": true,
    "min": 1
  }
}
```

---

### 14. `list`

Field that allows creating dynamic lists of items with defined structure.

#### Configuration (`ListFieldConfig`)

```typescript
{
  max_items_per_page?: number;        // Items per page
  max_items: number;                  // Maximum allowed items
  min_items: number;                  // Minimum required items
  item_schema: Record<string, FieldBase>; // Structure of each item
}
```

#### Specific Attributes

| Attribute | Type | Required | Description |
|----------|------|-----------|-------------|
| `max_items_per_page` | `number` | No | Number of items displayed per page |
| `max_items` | `number` | Yes | Maximum number of items in the list |
| `min_items` | `number` | Yes | Minimum number of items required |
| `item_schema` | `Record<string, FieldBase>` | Yes | Defines the structure of each list item |

#### JSON Example

```json
{
  "field_id": "recommendations",
  "display_name": "Recommendations",
  "type": "list",
  "label": "Recommendations List",
  "form": true,
  "bulletin": true,
  "field_config": {
    "max_items": 10,
    "min_items": 1,
    "max_items_per_page": 3,
    "item_schema": {
      "title": {
        "field_id": "title",
        "display_name": "Title",
        "type": "text",
        "form": true,
        "bulletin": true,
        "field_config": {
          "subtype": "short"
        }
      },
      "description": {
        "field_id": "description",
        "display_name": "Description",
        "type": "text",
        "form": true,
        "bulletin": true,
        "field_config": {
          "subtype": "long"
        }
      }
    }
  }
}
```

---

### 15. `algorithm`

Selection field for predefined algorithms for calculations or data processing.

#### Configuration (`AlgorithmFieldConfig`)

```typescript
{
  options: string[];  // Array of available algorithms
}
```

#### Specific Attributes

| Attribute | Type | Required | Description |
|----------|------|-----------|-------------|
| `options` | `string[]` | Yes | List of available algorithms to select |

#### JSON Example

```json
{
  "field_id": "forecast_algorithm",
  "display_name": "Forecast Algorithm",
  "type": "algorithm",
  "label": "Algorithm",
  "form": true,
  "bulletin": false,
  "field_config": {
    "options": [
      "seasonal_forecast_v1",
      "rainfall_prediction_v2",
      "temperature_model_v1"
    ]
  }
}
```

---

### 16. `page_number`

Auto-generated field for bulletin page numbering.

#### Configuration (`PageNumberFieldConfig`)

```typescript
{
  format: string;              // Format (e.g., "Page {page} of {total}")
  is_autogenerated?: boolean;  // If it's automatically generated
}
```

#### Specific Attributes

| Attribute | Type | Required | Description |
|----------|------|-----------|-------------|
| `format` | `string` | Yes | Display format. Use `{page}` and `{total}` as placeholders |
| `is_autogenerated` | `boolean` | No | If `true`, the value is automatically generated |

#### JSON Example

```json
{
  "field_id": "page_number",
  "display_name": "Page Number",
  "type": "page_number",
  "label": "",
  "form": false,
  "bulletin": true,
  "field_config": {
    "format": "Page {page} of {total}",
    "is_autogenerated": true
  }
}
```

---

### 17. `card`

Field to insert predefined reusable content (cards) in the bulletin.

#### Configuration (`CardFieldConfig`)

```typescript
{
  card_type?: string;         // Card type to filter
  available_cards: string[];  // Available card IDs
}
```

#### Specific Attributes

| Attribute | Type | Required | Description |
|----------|------|-----------|-------------|
| `card_type` | `string` | No | Card type to filter options (e.g., "pest_or_disease") |
| `available_cards` | `string[]` | Yes | Array of card IDs that the user can select |

#### JSON Example

```json
{
  "field_id": "pest_card",
  "display_name": "Pest Card",
  "type": "card",
  "label": "Select Pest/Disease",
  "form": true,
  "bulletin": true,
  "field_config": {
    "card_type": "pest_or_disease",
    "available_cards": [
      "66c3a123a456b789c123d456",
      "66c3a123a456b789c123d457"
    ]
  }
}
```

---

## Validation Object

The `validation` object defines the rules that the field value must comply with:

```typescript
{
  required?: boolean;      // If the field is required
  min?: number;           // Minimum value (for numbers)
  max?: number;           // Maximum value (for numbers)
  min_length?: number;    // Minimum length (for text)
  max_length?: number;    // Maximum length (for text)
  pattern?: string;       // Regular expression to match
  custom_message?: string; // Custom error message
}
```

### Validation Example

```json
{
  "validation": {
    "required": true,
    "min_length": 5,
    "max_length": 100,
    "pattern": "^[A-Za-z0-9\\s]+$",
    "custom_message": "The title must be between 5 and 100 alphanumeric characters"
  }
}
```

---

## Style Inheritance

The system implements cascading style inheritance:

1. **General Level** (`content.style_config`): Base styles for the entire template
2. **Section Level** (`section.style_config`): Overrides general styles for the section
3. **Block Level** (`block.style_config`): Overrides section styles for the block
4. **Field Level** (`field.style_config`): Overrides all previous styles for the specific field

**Example:**

```
content.style_config.color = "#000000"      (Black by default)
  └─> section.style_config.color = "#333333" (Dark gray for this section)
      └─> field.style_config.color = "#ff0000" (Red for this specific field)
```

The field will be rendered with red color (#ff0000).

---

## System Constants

### Available Field Types

```typescript
const FIELD_TYPES = [
  "text",
  "text_with_icon",
  "climate_data_puntual",
  "list",
  "select",
  "searchable",
  "select_with_icons",
  "select_background",
  "number",
  "date",
  "date_range",
  "image_upload",
  "algorithm",
  "page_number",
  "card",
  "image",
  "moon_calendar"
] as const;
```

### Text Subtypes

```typescript
const TEXT_SUBTYPES = ["short", "long"] as const;
```

### Moon Phases

```typescript
const MOON_PHASES = [
  "llena",           // Full moon
  "nueva",           // New moon
  "cuartoCreciente", // Waxing crescent
  "cuartoMenguante"  // Waning crescent
] as const;
```

---

## Important Notes

### Image System

1. **Temporary upload**: Images are uploaded to `temp/` with a unique timestamp-based name
2. **Validation**: Format, size, and dimensions are validated on both client and server
3. **Automatic cleanup**: Temporary images are deleted if:
   - The user changes the image
   - The user removes the image
   - The bulletin is not published
4. **Permanence**: Only when the bulletin is published are images moved to `permanent/`

### Card System

Cards are reusable content that is defined separately and can be inserted into multiple bulletins. A card can contain:
- Background images and icons
- Multiple content blocks
- Fields of different types

### Moon Calendar

The moon calendar system includes:
- Automatic calculation of days in the month (including leap years)
- Automatic transitions between moon phases
- 4 transition folders with different numbers of images:
  - `crecToLlena`: 7 images
  - `llenaToMeng`: 7 images
  - `mengToNueva`: 5 images
  - `nuevaToCrec`: 6 images
- Automatic filling of days before and after configured phases

---

## Complete Usage Examples

### Example 1: Header Section

```json
{
  "header_config": {
    "style_config": {
      "background_color": "#ffffff",
      "padding": "20px"
    },
    "fields": [
      {
        "field_id": "logo",
        "display_name": "Logo",
        "type": "image",
        "form": false,
        "bulletin": true,
        "field_config": {
          "images": ["/assets/logos/logo.png"],
          "show_label": false
        }
      },
      {
        "field_id": "bulletin_title",
        "display_name": "Title",
        "type": "text",
        "form": true,
        "bulletin": true,
        "field_config": {
          "subtype": "short"
        },
        "validation": {
          "required": true,
          "max_length": 100
        }
      },
      {
        "field_id": "publication_date",
        "display_name": "Date",
        "type": "date",
        "form": true,
        "bulletin": true,
        "field_config": {
          "date_format": "DD/MM/YYYY"
        }
      }
    ]
  }
}
```

### Example 2: Climate Forecast Section

```json
{
  "section_id": "forecast",
  "display_name": "Climate Forecast",
  "order": 1,
  "blocks": [
    {
      "block_id": "climate_data",
      "display_name": "Climate Data",
      "fields": [
        {
          "field_id": "period",
          "display_name": "Period",
          "type": "date_range",
          "form": true,
          "bulletin": true,
          "field_config": {
            "start_date_label": "From",
            "end_date_label": "To",
            "show_moon_phases": true
          }
        },
        {
          "field_id": "station_data",
          "display_name": "Station Data",
          "type": "climate_data_puntual",
          "form": true,
          "bulletin": true,
          "field_config": {
            "available_parameters": {
              "temp_max": {
                "label": "Maximum Temperature",
                "unit": "°C",
                "type": "number",
                "col_name": "tmax",
                "showName": true
              },
              "temp_min": {
                "label": "Minimum Temperature",
                "unit": "°C",
                "type": "number",
                "col_name": "tmin",
                "showName": true
              },
              "precipitation": {
                "label": "Precipitation",
                "unit": "mm",
                "type": "number",
                "col_name": "prec",
                "showName": true
              }
            }
          }
        }
      ]
    }
  ]
}
```

### Example 3: Section with Moon Calendar

```json
{
  "section_id": "agricultural_calendar",
  "display_name": "Agricultural Calendar",
  "order": 2,
  "blocks": [
    {
      "block_id": "calendar",
      "display_name": "Moon Calendar",
      "fields": [
        {
          "field_id": "moon_calendar",
          "display_name": "Moon Phases",
          "type": "moon_calendar",
          "form": true,
          "bulletin": true,
          "field_config": {
            "title_icon": "/assets/icons/moon.png",
            "title_label": "Moon calendar - {month}"
          }
        }
      ]
    }
  ]
}
```

---

## Summary of Types by Category

| Category | Types |
|-----------|-------|
| **Text** | `text`, `text_with_icon` |
| **Selection** | `select`, `searchable`, `select_with_icons`, `select_background` |
| **Numeric** | `number` |
| **Dates** | `date`, `date_range`, `moon_calendar` |
| **Images** | `image`, `image_upload` |
| **Climate Data** | `climate_data_puntual` |
| **Structures** | `list` |
| **Special** | `algorithm`, `page_number`, `card` |

---

This documentation covers all available field types in the template system. For more information about the complete structure of templates and bulletins, please refer to the main MongoDB documentation.
