# Technology Stack

## Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose ODM)
- **Logging**: Winston with daily log rotation
- **Environment**: dotenv for configuration

## Frontend

- **Platform**: AWS Amplify
- **Infrastructure**: AWS CDK (TypeScript)
- **Functions**: Lambda with MongoDB connector
- **Auth**: Amplify Auth

## Key Dependencies

- `mongoose` - MongoDB object modeling
- `express` - Web framework
- `winston` / `winston-daily-rotate-file` - Structured logging
- `cors` - Cross-origin resource sharing
- `compression` - Response compression
- `body-parser` - Request parsing

## Development Tools

- `nodemon` - Auto-restart during development
- `csv-parser` - Data import utilities
- `dotenv` - Environment variable management

## Common Commands

```bash
# Start production server
npm start

# Start development server with auto-reload
npm run dev

# Seed database from CSV
npm run db:seed
```

## Environment Variables

Required in `.env` file:
- `MONGO_URI` - MongoDB connection string
- `PORT` - Server port (defaults to 3000)
- `NODE_ENV` - Environment mode (development/production)
