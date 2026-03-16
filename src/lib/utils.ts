import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Transaction } from "./types"; // Import Transaction type

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseCsvTransactions(csvString: string): Transaction[] {
  const lines = csvString.trim().split('\n');
  if (lines.length === 0) {
    return [];
  }

  const headers = lines[0].split(',').map(header => header.trim());
  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(value => value.trim());
    if (values.length !== headers.length) {
      console.warn(`Skipping malformed row: ${lines[i]}`);
      continue;
    }

    const transaction: Partial<Transaction> = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      const value = values[j];

      switch (header.toLowerCase()) {
        case 'id':
          transaction.id = value;
          break;
        case 'date':
          transaction.date = value; // Assuming date is already in a compatible string format
          break;
        case 'description':
          transaction.description = value;
          break;
        case 'amount':
          transaction.amount = parseFloat(value);
          break;
        case 'category':
          transaction.category = value;
          break;
        case 'currency':
          transaction.currency = value;
          break;
        case 'bank':
          transaction.bank = value;
          break;
        default:
          // Ignore unknown headers
          break;
      }
    }
    // Basic validation to ensure required fields are present
    if (transaction.id && transaction.date && transaction.description && transaction.amount !== undefined && transaction.category) {
      transactions.push(transaction as Transaction);
    } else {
      console.warn(`Skipping row due to missing required fields: ${lines[i]}`);
    }
  }

  return transactions;
}
