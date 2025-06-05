# AI Web Assistant

## 🚀 Overview

The AI Web Assistant is an advanced browser extension designed to help users interact with web pages more intelligently and efficiently. It acts as an autonomous agent capable of understanding page structures, interpreting user commands in natural language, and performing actions on behalf of the user. This initial version focuses on core functionalities for DOM analysis, command processing, and action execution.

## ✨ Core Features (v0.1.0)

*   **Dynamic DOM Analysis**:
    *   Scans the current web page to identify interactive elements (buttons, links, input fields, etc.).
    *   Assigns a unique `assistant-id` attribute to each interactive element for stable referencing.
    *   Collects metadata for each element, including its tag, visible text, and attributes.
*   **Natural Language Command Processing**:
    *   Accepts user commands via a popup interface (e.g., "click 'Login button'", "fill 'username' with 'testuser'").
    *   A basic Natural Language Processing (NLP) engine in the background script parses these commands to determine the intended action (e.g., `click`, `fill`) and the target element.
*   **Action Execution**:
    *   Performs actions on the identified web page elements.
    *   Currently supported actions:
        *   `click`: Simulates a mouse click on the target element.
        *   `fill`: Enters specified text into input fields, dispatching necessary events for compatibility with web frameworks.
*   **Simplified DOM & Communication**:
    *   The content script sends a structured summary of interactive elements to the background script.
    *   The background script communicates action plans back to the content script for execution.
*   **User Interface**:
    *   A browser action popup allows users to input commands.
    *   Feedback on command processing and execution is displayed in the popup.

## 🔧 How to Install/Load

This extension is currently in development. To load it into your Chrome browser:

1.  **Download the extension files** (or clone the repository).
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **"Developer mode"** using the toggle switch in the top-right corner.
4.  Click on the **"Load unpacked"** button that appears.
5.  Select the directory where you saved/cloned the extension files.
6.  The "AI Web Assistant" should now appear in your list of extensions and be active.

## 基本的な使い方

1.  Navigate to a web page you want to interact with.
2.  Click on the AI Web Assistant extension icon in your browser toolbar to open the popup.
3.  In the input field, type your command in natural language (e.g., "click the submit button", "fill in the email field with test@example.com").
4.  Click the "Submit" button or press Enter.
5.  The assistant will attempt to process your command and perform the action on the page. Status messages will appear in the popup.

## 📂 Project Structure

*   `manifest.json`: Defines the extension's properties, permissions, and scripts.
*   `background.js`: Service worker handling background tasks like NLP, message routing, and managing stored DOM information.
*   `content.js`: Injected into web pages to perform DOM analysis and execute actions.
*   `popup.html` / `popup.js`: Defines the structure and behavior of the browser action popup.
*   `images/`: Contains placeholder icons for the extension.

## 🚧 Known Limitations & Future Work

*   The current NLP engine is very basic and relies on simple keyword matching.
*   Element identification might not be robust on all websites, especially complex single-page applications (SPAs).
*   Error handling and user feedback can be further improved.
*   Does not yet include advanced features like proactive crawling, ad blocking, or visual highlighting.

This README provides a guide to the current state of the AI Web Assistant.
