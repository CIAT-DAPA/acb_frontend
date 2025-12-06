# Agroclimatic Bulletin Builder - Frontend

Web application that serves as the frontend for the Agroclimatic Bulletin Builder system. This platform enables users to create, manage, and publish customized agroclimatic bulletins with dynamic content, visual resources, and multilingual support.

## 🚀 Features

- **Dynamic Bulletin Creation**: Build bulletins using customizable templates with 17+ field types
- **Template Management**: Create and manage reusable bulletin templates
- **Content Cards**: Reusable content blocks for pests, diseases, and recommendations
- **Visual Resource Management**: Upload and manage images, icons, and backgrounds
- **Moon Calendar**: Interactive lunar calendar with automatic phase transitions
- **Climate Data Integration**: Display climate parameters from external data sources
- **PDF Export**: Generate high-quality PDF versions of bulletins
- **Thumbnail Generation**: Automatic preview thumbnails for bulletins
- **Role-Based Access Control**: Integration with Keycloak for authentication
- **Multilingual Support**: Spanish, English, and Vietnamese translations
- **Responsive Design**: Optimized for desktop and mobile devices

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.2 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Internationalization**: next-intl 4.3.9
- **Authentication**: Keycloak JS 26.2.0
- **PDF Generation**: jsPDF 3.0.3
- **Image Processing**: html-to-image 1.11.13
- **Icons**: Lucide React 0.543.0
- **UI**: React 19.1.0

## 📋 Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Access to the ACB Backend API
- Keycloak server for authentication

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/CIAT-DAPA/acb_frontend.git
cd acb_frontend/src
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env.local` file in the `src` directory with:
```env
NEXT_PUBLIC_API_URL=your_backend_api_url
NEXT_PUBLIC_KEYCLOAK_URL=your_keycloak_url
NEXT_PUBLIC_KEYCLOAK_REALM=your_realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=your_client_id
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
src/
├── app/
│   └── [locale]/              # Internationalized routes
│       ├── bulletins/         # Bulletin CRUD operations
│       ├── cards/             # Content card management
│       ├── components/        # Shared components
│       ├── dashboard/         # Dashboard page
│       ├── groups/            # User group management
│       ├── roles/             # Role management
│       └── templates/         # Template management
├── components/                # Global components
├── hooks/                     # Custom React hooks
├── i18n/                      # Internationalization config
├── messages/                  # Translation files (es, en, vi)
├── services/                  # API service layer
├── types/                     # TypeScript type definitions
└── utils/                     # Utility functions
```

## 🌍 Internationalization

The application supports three languages:
- **Spanish (es)** - Default
- **English (en)**
- **Vietnamese (vi)**

Translation files are located in `src/messages/`. To add or modify translations:

1. Edit the corresponding JSON file (`es.json`, `en.json`, `vi.json`)
2. Or use the CSV workflow:
   - Export: `node messages/json-to-csv.js`
   - Edit the CSV file
   - Import: `node messages/csv-to-json.js`

## 📦 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production bundle
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 Field Types

The system supports 17 different field types for bulletin creation:

### Text Fields
- `text` - Short or long text
- `text_with_icon` - Text with selectable icon

### Selection Fields
- `select` - Standard dropdown
- `searchable` - Searchable dropdown with custom entries
- `select_with_icons` - Options with icons
- `select_background` - Background image selector

### Date & Time
- `date` - Single date picker
- `date_range` - Date range with optional moon phases
- `moon_calendar` - Interactive lunar calendar

### Visual Content
- `image` - Predefined images
- `image_upload` - User image uploads

### Data Fields
- `climate_data_puntual` - Climate parameters
- `number` - Numeric input
- `list` - Dynamic item lists

### Special Fields
- `algorithm` - Algorithm selector
- `page_number` - Auto-generated page numbers
- `card` - Reusable content cards

## 🔐 Authentication

The application uses Keycloak for authentication and authorization. Users must be authenticated to access most features. Role-based permissions control access to:
- Bulletin creation and editing
- Template management
- Card management
- User and group management

## 📄 Documentation

- [Field Types Documentation](./FIELD_TYPES_DOCUMENTATION.md) - Complete guide for all field types

