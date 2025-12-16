# Wix AI Digital Product Tool

This project is a Wix Velo (formerly Corvid) application designed to generate AI-powered digital product content (such as ebooks, guides, and plans). It integrates OpenAI's GPT-4o model to create tailored content based on detailed user inputs.

## Features

-   **AI Content Generation**: Generates comprehensive reports/products based on user-selected parameters.
-   **Customizable Inputs**: Users can select:
    -   Product Type
    -   Genre
    -   Tone
    -   Target Audience
    -   Purpose/Goal
    -   Word Count
    -   Custom Keywords and Notes
-   **Membership Gating**: Restricted access to logged-in users with an active pricing plan.
-   **Admin Control**: Uses a database collection (`AdminControl`) to manage prompt templates and instructions dynamically without changing code.
-   **Save & History**: Users can save generated reports to their profile and view them later via a dedicated dashboard.
-   **Copy to Clipboard**: One-click functionality to copy generated content.

## Project Structure

-   **`digitalProduct.js`**: Main frontend logic for the generation page. Handles user inputs, validation, API calls to the backend, and UI state management.
-   **`backend/openAi.jsw`**: Backend module that securely handles OpenAI API requests. Retreives the API key from Wix Secrets Manager.
-   **`ReportDashboard.js`**: Frontend logic for the user's dashboard, displaying their personal history of saved reports.

## Setup & Configuration

### Prerequisites
1.  **Wix Site**: A Wix website with Dev Mode enabled.
2.  **OpenAI API Key**: A valid API key from OpenAI.

### Installation

1.  **Database Collections**:
    -   **`AdminControl`**: Must contain items with `promptTemplateName`, `instruction`, and dropdown options (`productType`, `genre`, etc.).
    -   **`SavedReports`**: Stores user reports. Fields: `memberId` (Reference/String), `report` (Rich Text/Long Text).
    -   **Pricing Plans**: Set up Wix Pricing Plans app and verify the "ACTIVE" status logic in `digitalProduct.js`.

2.  **Secrets Manager**:
    -   Store your OpenAI API key in the Wix Secrets Manager with the name `OPENAI_KEY`.

3.  **Page Elements**:
    -   Ensure the page IDs in `digitalProduct.js` (e.g., `#dropdownProductType`, `#generate`, `#reportSection`) match your specific Wix Editor elements.

## Usage

1.  **Generate**: Users log in, fill out the form, and click "Generate".
2.  **Review**: The AI generates the content which is displayed on the screen.
3.  **Action**: Users can "Copy" the text or "Save" it to their dashboard for future reference.

## Tech Stack

-   **Platform**: Wix Velo (JavaScript)
-   **AI Model**: OpenAI GPT-4o
-   **Dependencies**: `wix-location-frontend`, `wix-data`, `wix-window-frontend`, `wix-members-frontend`, `wix-fetch`, `wix-secrets-backend`.
