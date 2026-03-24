# Invoicing System

This project is an invoicing system designed to connect patients and treatments to generate invoices. It provides a user-friendly interface for managing the invoicing process, including creating, viewing, and detailing invoices.

## Features

- **Patient Management**: Select patients from a list for invoicing.
- **Treatment Management**: Add treatments to invoices with auto-calculated totals.
- **Invoice Creation**: Generate invoices with a simple form interface.
- **Invoice List**: View and manage all invoices in one place.
- **Invoice Details**: View detailed information about each invoice, including treatments and total amounts.

## Technologies Used

- React: For building the user interface.
- Supabase: For database management and backend services.
- Vite: For fast development and build tooling.

## Project Structure

```
invoicing-system
├── src
│   ├── components
│   ├── hooks
│   ├── services
│   ├── types
│   ├── pages
│   ├── utils
│   ├── styles
│   ├── App.jsx
│   └── main.jsx
├── public
├── .env.example
├── package.json
├── vite.config.js
└── README.md
```

## Setup Instructions

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd invoicing-system
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Set up Supabase**:
   - Create a Supabase project.
   - Configure your database schema according to the requirements of the invoicing system.
   - Update the `.env` file with your Supabase credentials.

4. **Run the application**:
   ```
   npm run dev
   ```

5. **Access the application**:
   Open your browser and navigate to `http://localhost:3000`.

## Usage

- Navigate to the **Invoices Page** to view existing invoices.
- Use the **Create Invoice Page** to generate new invoices by selecting patients and treatments.
- Click on an invoice to view its details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.