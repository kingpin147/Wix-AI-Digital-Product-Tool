# Wix AI Digital Product Tool

This project is a Wix Velo (formerly Corvid) application designed to generate AI-powered digital product content (ebooks, guides, checklists, etc.). It integrates OpenAI's high-performance models to create tailored, file-ready assets based on detailed user inputs.

## 🚀 Key Features

-   **Dynamic AI Content Generation**: Generates comprehensive, high-quality products using advanced reasoning models.
-   **Product-Specific Logic**: Tailored prompt instructions for different formats:
    -   **Lead Magnet – Downloadable**: Structured for multi-page PDF value.
    -   **Workbooks & Worksheets**: Interactive exercises and reflection points.
    -   **Checklists & Cheat Sheets**: Action-oriented, concise steps.
    -   **Lesson Plans & Course Outlines**: Formal educational structures.
    -   **Page Sections & Copy**: High-impact marketing snippets.
-   **Instant PDF Conversion**: Automatically converts generated text into a professionally formatted PDF document.
-   **Professional Formatting**: Uses Markdown parsing and PDFKit to create stylized headers, bulleted lists, and clean layouts.
-   **Branded Experience**: Integrated headers and footers in every generated PDF with custom links.
-   **Membership Gating**: Secure access for subscribers via Wix Pricing Plans integration.
-   **Save & History Dashboard**: Users can save products to their profile, including the generated text and the download link.
-   **One-Click Actions**: Integrated "Download PDF", "Save to Dashboard", and "Copy to Clipboard" functionality.

## 📂 Project Structure

-   **`digitalProduct.js`**: Core frontend logic for the generation interface. Manages the multi-step flow: Input -> OpenAI Call -> UI Display -> PDF Preparation.
-   **`backend/openAi.jsw`**: Secure backend module for OpenAI API interactions using the newest "Responses API" format.
-   **`backend/pdfGenerator.jsw`**: Backend service that uses **PDFKit** to transform text/markdown into PDF files and uploads them to the Wix Media Manager.
-   **`ReportDashboard.js`**: Frontend logic for the user's personal hub, allowing them to access and download previously generated products.

## ⚙️ Setup & Configuration

### Prerequisites
1.  **Wix Site**: Dev Mode enabled.
2.  **OpenAI API Key**: Stored in Wix Secrets Manager as `OPENAI_KEY`.
3.  **Packages**: `pdfkit` must be installed in the backend via NPM.

### Database Collections
-   **`AdminControl`**: Configures the "brain" of the tool (templates, instructions, and dropdown options).
-   **`SavedReports`**: Stores historical data.
    -   `memberId` (Reference/ID)
    -   `report` (Rich Text)
    -   `fileUrl` (URL to the generated PDF)
    -   `fileName` (Reference name)
    -   `generatedDate` (Date)

## 🛠️ Tech Stack

-   **Platform**: Wix Velo (JavaScript)
-   **AI Model**: OpenAI GPT-5-mini (via Responses API)
-   **PDF Engine**: PDFKit
-   **Media Storage**: Wix Media Manager
-   **Styling**: Custom Velo UI with Markdown-to-PDF parsing logic.

## 📖 Usage Flow

1.  **Select**: User chooses their product type and fills in details (Topic, Tone, Goal, etc.).
2.  **Generate**: System sends a structured prompt to OpenAI.
3.  **Automate**: As soon as the text appears, the backend begins generating a PDF version of the content.
4.  **Action**: User can immediately read the content, click "Download" for the PDF, or "Save" to keep it in their account history.
