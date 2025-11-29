# Project Structure

## Architecture Pattern

Three-layer architecture: **Routes → Controllers → Services**

- **Routes** define API endpoints and HTTP methods
- **Controllers** handle requests/responses and validation
- **Services** contain business logic and database operations
- **Models** define Mongoose schemas

## Directory Organization

```
/
├── controllers/       # Request handlers (thin layer)
├── services/         # Business logic (core functionality)
├── models/           # Mongoose schemas and models
├── routes/           # Express route definitions
├── utils/            # Shared utilities (logger, helpers)
├── scripts/          # Database seeding and maintenance
├── data/             # CSV files for import
├── logs/             # Winston log files (auto-generated)
├── front-end/        # AWS Amplify frontend
│   ├── amplify/      # Amplify backend configuration
│   │   ├── auth/     # Authentication resources
│   │   ├── data/     # Data resources
│   │   └── functions/ # Lambda functions
│   └── amplify_outputs.json
└── server.js         # Application entry point
```

## Code Conventions

### Models
- Use Mongoose schemas with explicit type definitions
- Include `required` flags for mandatory fields
- Set defaults where appropriate (e.g., `createdDate: Date.now`)
- Export with fallback: `mongoose.models.X || mongoose.model('X', schema)`

### Controllers
- Keep thin - delegate logic to services
- Handle HTTP concerns only (status codes, response formatting)
- Use structured responses: `{ success, message, data }`
- Log errors before sending error responses

### Services
- Pure business logic - no HTTP concerns
- Use async/await for database operations
- Return data objects, not HTTP responses
- Include descriptive logging with context metadata

### Logging
- Use Winston logger from `utils/logger.js`
- Log levels: `info` for operations, `error` for failures
- Include context: `logger.info('message', { userId, examNumber })`
- Logs rotate daily and are stored in `/logs`

### Database
- Connection managed in `server.js` on startup
- Use Mongoose aggregation for complex queries
- Database name: `aws-quiz-db`
- Models must be required before use

## Naming Conventions

- Files: camelCase (e.g., `quizController.js`)
- Models: PascalCase (e.g., `Question`, `UserProgress`)
- Routes: kebab-case URLs (e.g., `/api/start-quiz`)
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE (e.g., `TEST_USER_ID`)
