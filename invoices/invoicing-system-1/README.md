# Invoicing System

This project is an invoicing system designed to connect patients and treatments to generate invoices. It provides a user-friendly interface for managing the invoicing process, including creating, viewing, and managing invoices.

## Features

- **Patient Management**: Select patients from a dropdown list fetched from the database.
- **Treatment Management**: Add treatments to invoices with auto-calculated totals.
- **Invoice Creation**: Generate invoices that summarize treatments and total amounts.
- **Invoice List**: View and manage existing invoices.
- **Invoice Details**: View detailed information about specific invoices.

## Project Structure

```
invoicing-system
├── src
│   ├── components
│   │   ├── InvoiceForm.jsx
│   │   ├── InvoiceList.jsx
│   │   ├── InvoiceDetails.jsx
│   │   └── PatientSelect.jsx
│   ├── hooks
│   │   ├── useData.js
│   │   ├── useList.js
│   │   └── useForm.js
│   ├── services
│   │   ├── invoiceService.js
│   │   ├── patientService.js
│   │   ├── treatmentService.js
│   │   └── supabaseClient.js
│   ├── types
│   │   └── index.ts
│   ├── pages
│   │   ├── InvoicePage.jsx
│   │   └── DashboardPage.jsx
│   ├── App.jsx
│   └── main.jsx
├── database
│   └── schema.sql
├── package.json
├── vite.config.js
├── .env.example
└── README.md
```

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd invoicing-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up the database**:
   - Create a Supabase project.
   - Configure the database using the SQL schema provided in `database/schema.sql`.

4. **Configure environment variables**:
   - Copy `.env.example` to `.env` and fill in the required values for your Supabase project.

5. **Run the application**:
   ```bash
   npm run dev
   ```

## Usage

- Navigate to the application in your browser.
- Use the dashboard to manage patients and treatments.
- Create invoices using the invoice form and view them in the invoice list.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.