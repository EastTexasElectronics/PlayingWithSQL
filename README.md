# SQL Playground

SQL Playground is an interactive web application that allows users to explore and query a database using SQL. It features a natural language query generator, predefined queries, and a chat interface for database interactions.

## Features

- Execute custom SQL queries
- Generate SQL queries from natural language questions
- Predefined example queries
- Chat interface for database interactions
- Export query results to CSV
- Responsive design for desktop and mobile use

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v14 or later)
- npm or Yarn or Bun
- PostgreSQL database

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/sql-playground.git
   cd sql-playground
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following variables:

   ```bash
   POSTGRES_URL=your_postgres_connection_string
   OPENAI_API_KEY=your_openai_api_key
   ```

   Replace `your_postgres_connection_string` with your actual PostgreSQL connection string and `your_openai_api_key` with your OpenAI API key.

4. Set up the database:
   Run the following command to set up the database schema:

   ```bash
   npm run db:setup
   # or
   yarn db:setup
   # or
   bun run db:setup
   ```

5. (Optional) Insert sample data:
   If you want to populate the database with sample data, run:

   ```bash
   npm run src/database/sampleData/insertCsvData.js
   # or
   yarn run src/database/sampleData/insertCsvData.js
   # or
   bun run src/database/sampleData/insertCsvData.js
   ```

## Usage

1. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   bun dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. Use the SQL Playground interface to:
   - Write and execute custom SQL queries
   - Generate SQL queries from natural language questions
   - Use predefined example queries
   - Chat with the database using natural language
   - View and export query results

## Project Structure

- `src/app`: Next.js app router and API routes
- `src/components`: React components including the main SQL Explorer
- `src/database`: Database setup, schema, and utility functions
- `src/styles`: Global CSS styles
- `src/lib`: Utility functions
- `public`: Static assets

## Key Components

- `src/components/sql-explorer.tsx`: Main component for SQL query execution and result display
- `src/app/api/database/route.ts`: API route for executing SQL queries
- `src/app/api/generate-query/route.ts`: API route for generating SQL queries from natural language
- `src/app/api/chat-with-db/route.ts`: API route for chat interactions with the database

## Database Schema

The project uses the following database schema:
