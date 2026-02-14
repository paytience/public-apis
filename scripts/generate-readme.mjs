#!/usr/bin/env node

/**
 * Generate README.md from db/resources.json
 *
 * Reads the API data from the database and generates a markdown README
 * with tables organized by category.
 */

import * as fs from "fs";
import * as path from "path";

const DB_PATH = path.join(process.cwd(), "db", "resources.json");
const README_PATH = path.join(process.cwd(), "README.md");

/**
 * Generate a URL-friendly anchor from a category name
 */
function categoryToAnchor(category) {
  return category
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-");
}

/**
 * Format auth value for display
 */
function formatAuth(auth) {
  if (!auth || auth === "") return "No";
  if (auth === "apiKey") return "`apiKey`";
  if (auth === "OAuth") return "`OAuth`";
  return `\`${auth}\``;
}

/**
 * Format boolean/string for Yes/No/Unknown display
 */
function formatYesNo(value) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "yes" || lower === "true") return "Yes";
    if (lower === "no" || lower === "false") return "No";
    if (lower === "unknown") return "Unknown";
    return value;
  }
  return "Unknown";
}

/**
 * Escape pipe characters and newlines in markdown table cells
 */
function escapeMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ")
    .replace(/\r/g, "")
    .replace(/<[^>]*>/g, ""); // Remove HTML tags
}

/**
 * Truncate description to max length, ending at last complete sentence
 */
function truncateDescription(text, maxLength = 100) {
  if (!text) return "";

  // Clean the text first
  let cleaned = text.trim();

  // If already short enough, return as-is
  if (cleaned.length <= maxLength) return cleaned;

  // Try to find the last sentence boundary before maxLength
  const truncated = cleaned.substring(0, maxLength);

  // Look for sentence endings (. ! ?)
  const lastPeriod = truncated.lastIndexOf(".");
  const lastExclaim = truncated.lastIndexOf("!");
  const lastQuestion = truncated.lastIndexOf("?");

  const lastSentence = Math.max(lastPeriod, lastExclaim, lastQuestion);

  // If we found a sentence boundary after at least 40 chars, use it
  if (lastSentence > 40) {
    return cleaned.substring(0, lastSentence + 1);
  }

  // Otherwise, truncate at last space and add ellipsis
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 40) {
    return cleaned.substring(0, lastSpace) + "...";
  }

  // Fallback: hard truncate
  return truncated + "...";
}

/**
 * Format pricing value for display
 */
function formatPricing(pricing) {
  if (!pricing || pricing === "" || pricing === "unknown") return "Unknown";
  if (pricing === "free") return "Free";
  if (pricing === "freemium") return "Freemium";
  if (pricing === "paid") return "Paid";
  return pricing;
}

/**
 * Generate the README content
 */
function generateReadme(data) {
  const apis = data.entries;

  // Group APIs by category
  const byCategory = {};
  for (const api of apis) {
    const category = api.Category || "Other";
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(api);
  }

  // Sort categories alphabetically
  const sortedCategories = Object.keys(byCategory).sort();

  // Sort APIs within each category alphabetically
  for (const category of sortedCategories) {
    byCategory[category].sort((a, b) =>
      (a["API Name"] || "").localeCompare(b["API Name"] || ""),
    );
  }

  // Build README content
  let content = `# Public APIs

<div align="center">
    <a href="https://findapis.com">
        <img src="./assets/findapis-logo.svg" alt="findapis.com" width="64" height="64">
    </a>
    <p>The largest directory of public APIs for developers. Includes free, freemium, and paid APIs.</p>
    <p>
        <a href="https://findapis.com">findapis.com</a> •
        <a href="CONTRIBUTING.md">Contributing Guide</a> •
        <a href="https://github.com/paytience/public-apis/issues">Issues</a> •
        <a href="https://github.com/paytience/public-apis/pulls">Pull Requests</a> •
        <a href="LICENSE">License</a>
    </p>
</div>

## Want to add an API?

### Option 1: Via Website (Recommended)

Visit [findapis.com](https://findapis.com) and click **"Suggest an API"** to submit a new API. Your submission will be reviewed and if approved, the API will appear in the directory within 1 minute.

<div align="center">
    <img src="./assets/add-api-screenshot.jpg" alt="Suggest an API on findapis.com" width="600">
</div>

### Option 2: Via Pull Request

You can also submit a pull request directly to this repository. See the [Contributing Guide](CONTRIBUTING.md) for details.

## Index

`;

  // Generate index
  for (const category of sortedCategories) {
    const anchor = categoryToAnchor(category);
    content += `* [${category}](#${anchor})\n`;
  }

  content += "\n";

  // Generate tables for each category
  for (const category of sortedCategories) {
    const apis = byCategory[category];

    content += `### ${category}\n`;
    content += `| API | Description | Auth | HTTPS | CORS | Pricing |\n`;
    content += `|---|---|---|---|---|---|\n`;

    for (const api of apis) {
      const name = escapeMarkdown(api["API Name"] || "");
      const description = escapeMarkdown(
        truncateDescription(api.Description || "", 100),
      );
      const link = api["Documentation Link"] || "";
      const auth = formatAuth(api.Auth);
      const https = formatYesNo(api.HTTPS);
      const cors = formatYesNo(api.Cors);
      const pricing = formatPricing(api.Pricing);

      const nameCell = link ? `[${name}](${link})` : name;
      content += `| ${nameCell} | ${description} | ${auth} | ${https} | ${cors} | ${pricing} |\n`;
    }

    content += `\n**[⬆ Back to Index](#index)**\n\n`;
  }

  return content;
}

/**
 * Main function
 */
function main() {
  console.log("Generating README.md from db/resources.json...\n");

  // Check if db file exists
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Error: ${DB_PATH} not found`);
    console.error("Run the sync-from-supabase script first.");
    process.exit(1);
  }

  // Read and parse the database
  const rawData = fs.readFileSync(DB_PATH, "utf-8");
  const data = JSON.parse(rawData);

  console.log(
    `Found ${data.count} APIs in ${
      Object.keys(
        data.entries.reduce((acc, api) => {
          acc[api.Category] = true;
          return acc;
        }, {}),
      ).length
    } categories`,
  );

  // Generate README content
  const content = generateReadme(data);

  // Write README
  fs.writeFileSync(README_PATH, content, "utf-8");

  console.log(`\n✓ Successfully generated README.md`);
  console.log(`  - ${data.count} APIs`);
}

main();
