# MMOCUL Document Forge

Build a clean, professional web application called “MMOCCUL Document Generator”.

Purpose:

Allow staff of MMOCKMBIE CREDIT UNION COOPERATIVE LTD (MFI) to generate unique official bank documents for any member. Every document must use only the data entered for that specific person — never reuse previous member data.

Documents to generate (all in one Word .docx file):

1. Attestation of Bank Account

2. Attestation of Non-Indebtedness

3. Attestation of Domiciliation of Bank Account (with bank details table)

4. Member Account Statement (with full transaction history + totals)

Important rules:

- Output must be a downloadable .docx (Word) file

- Do NOT include any stamp or signature image. Only leave a clean signature line with the text “(Stamp & signature to be affixed)”

- All personal and financial data must come from the form the user fills — nothing hardcoded for a specific person

- Institution details (name, registration numbers, address, etc.) can be fixed defaults but should still be editable in settings if needed

Form fields the user must fill:

- Member Full Name (required)

- Account Number (required)

- Closing Balance in FCFA (required)

- Amount in words (optional – auto-generate if empty)

- Issue Date (required)

- Account Opening Date

- Statement Start Date

- Statement End Date

- Opening Balance for the statement period

- Our Reference (default: MMOCCUL /ATT/07/2026)

- List of transactions (add/remove rows dynamically):

  - Date

  - Description

  - Representative

  - Reference

  - Debit

  - Credit

Fixed institution information to use:

- Full name: MMOCKMBIE CREDIT UNION COOPERATIVE LTD (MFI)

- Affiliate: RAINBOW – CAMEROON Cooperative Credit Union Limited

- Registration: Coopgic Reg No. 17/035/CMR/SW/55/290/CCA/360/3601

- COBAC: COBAC DECISION N° D-2021/317

- Shareholder: National Financial Credit Plc. (NFC BANK)

- Slogan: Where Dreams are Realised

- Location: Buea

- Contact details, CNPS, Taxpayer number, etc. (use realistic values matching Cameroon microfinance style)

Bank/IBAN details for the domiciliation page (fixed):

- Bank Code: 10025

- Branch Code: 00021

- Account Number: 15101070514

- RIB Key: 58

- SWIFT: NAFCCMCY

- IBAN: CM21 10025 00021 15101070514 58

UI requirements:

- Clean, modern, professional interface (blue corporate theme: #003366 and #00AEEF)

- Responsive

- Clear sections for member info, statement period, and transactions table

- “Add Transaction” / “Remove” buttons for the transaction list

- Big “Generate Document” button

- After generation, show a success message and a download button for the .docx file

- Optional: ability to clear the form for the next member

Technical notes:

- Use a library that can generate real .docx files in the browser or on the backend (docx, docxtemplater, or similar)

- Make the generated Word document look formal and close to official Cameroon microfinance letters

- Use proper number formatting with spaces as thousand separators (Cameroon style)

- Auto-convert the balance number into English words if the user leaves “Amount in words” empty

- Leave space at the bottom of each letter for physical stamp and signature

Make the whole experience fast and simple so a staff member can generate a unique document for a new member in under 2 minutes. thats the sample of how the word document should look like.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/499bfb4f-bfd8-4137-a41c-80ef2eb6fb07).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
