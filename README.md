# Knowledge Base Search Chatbot Application

A modern web application built with Next.js that provides multi-tenant document management and AI-powered chat capabilities. The application includes organization management, workspace management, file uploads, and a chat interface.

## Features

- 🏢 Multi-tenant Organization Support
- 🔐 User Authentication & Role Management
- 👑 Super Admin Dashboard
- 📁 Workspace Management
- 📄 Document Upload & Management
- 💬 AI-powered Chat Interface
- 🔍 Document Search 

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Environment Setup

1. Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/your_database"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Python API
PYTHON_API_URL="http://localhost:8000"
API_KEY="your-api-key"
INDEX="your-index-name"
MODEL="your-model"

# Groq API
GROQ_API_KEY="your-groq-api-key"

```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-chatbot
```

2. Install dependencies:
```bash
npm install
```

3. Database Setup:

   a. Clean the database (if needed):
   ```bash
   npm run cleanup-db
   ```
   ⚠️ Warning: This will remove all data. Type "CLEAN DATABASE" when prompted to confirm.

   b. Run database migrations:
   ```bash
   npm run migrate
   ```

   c. Manage super admin users:
   ```bash
   npm run manage-super-admin
   ```
   This interactive tool allows you to:
   - Create super admin users
   - List existing super admins
   - Remove super admin privileges

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
ai-chatbot/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin panel routes
│   ├── api/               # API routes
│   ├── chat/             # Chat interface
│   └── login/            # Authentication pages
├── components/            # React components
├── lib/                   # Utility functions and configurations
│   ├── db/               # Database configurations and migrations
│   └── auth.ts           # Authentication setup
├── public/               # Static files
└── workspaces/          # Uploaded files storage
```

## Database Management

The project uses several commands for database management:

1. **Database Cleanup** (`npm run cleanup-db`)
   - Removes all tables, indexes, and data
   - Requires explicit confirmation
   - Use with caution in production

2. **Database Migrations** (`npm run migrate`)
   - Applies all pending migrations
   - Creates necessary tables and relationships
   - Safe to run multiple times

3. **Super Admin Management** (`npm run manage-super-admin`)
   - Interactive CLI tool for super admin management
   - Create new super admins with custom credentials
   - List all super admin accounts
   - Remove super admin privileges

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code linting
- `npm run migrate` - Run database migrations
- `npm run cleanup-db` - Clean the database (requires confirmation)
- `npm run manage-super-admin` - Manage super admin users

## File Upload Support

Supported file types:
- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Text files (.txt)
- Excel (.xlsx)
- CSV (.csv)
- Rich Text Format (.rtf)

## Development Guidelines

1. **Code Style**
   - Use TypeScript for type safety
   - Follow ESLint and Prettier configurations
   - Use meaningful component and variable names

2. **Database**
   - Always use migrations for database changes
   - Test migrations before applying to production
   - Handle database operations within transactions

3. **File Handling**
   - Validate file types before upload
   - Handle file cleanup on failed uploads
   - Use proper error handling for file operations

4. **Security**
   - Validate user permissions
   - Sanitize file paths
   - Use proper authentication checks

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Error Handling

The application includes comprehensive error handling for:
- File uploads
- Database operations
- Authentication
- API requests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Your License Here]

## Support

For support, please [create an issue](repository-issues-url) or contact the development team.