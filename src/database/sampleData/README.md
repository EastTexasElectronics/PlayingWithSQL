# Sample Data for E-commerce Database

This directory contains sample CSV files and a script for populating an e-commerce database. These files are intended to be used for testing, development, and demonstration purposes.

## Contents

The following CSV files are included:

1. `Users.csv`: Contains user information
2. `Categories.csv`: Contains product categories
3. `Products.csv`: Contains product information
4. `Inventory.csv`: Contains inventory levels for products
5. `Orders.csv`: Contains order information
6. `OrderItems.csv`: Contains details of items in each order
7. `Carts.csv`: Contains shopping cart information
8. `Payments.csv`: Contains payment information for orders
9. `Reviews.csv`: Contains product reviews

## Usage

To import the sample data into your database:

1. Ensure you have Node.js installed on your system.
2. Set up your PostgreSQL database and make sure it's running.
3. Set the `POSTGRES_URL` environment variable with your database connection string.
4. Navigate to the project root directory in your terminal.
5. Run the following command:

   ```sh
   bun run src/database/sampleData/insertCsvData.js
   ```

   Note: You can replace `bun` with `npm`, `yarn`, or your preferred package manager.

6. The script will insert data from all CSV files into their respective tables in the database.

## Script Details

The `insertCsvData.js` script does the following:

- Connects to the PostgreSQL database using the provided connection string.
- Reads each CSV file in the directory.
- Inserts the data from each CSV file into the corresponding database table.
- Handles errors and provides console output for the insertion process.

## Environment Variables

Make sure to set the following environment variable before running the script:

- `POSTGRES_URL`: Your PostgreSQL database connection string

## Troubleshooting

If you encounter any issues:

1. Ensure your database is running and accessible.
2. Check that your `POSTGRES_URL` is correct and includes any necessary authentication details.
3. Verify that the tables in your database match the names of the CSV files (without the .csv extension).

## Disclaimer

This is sample data and should not be used for production purposes. The data is fictional and any resemblance to real products, orders, or users is purely coincidental.
