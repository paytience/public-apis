#!/usr/bin/env node

/**
 * Sync script to export Supabase APIs database to public-apis JSON format
 *
 * Standalone script with no external dependencies - uses native fetch API
 *
 * Required environment variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_ANON_KEY: Your Supabase anon/public key
 */

import * as fs from "fs";
import * as path from "path";

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing environment variables");
  console.error("Please set SUPABASE_URL and SUPABASE_ANON_KEY");
  process.exit(1);
}

/**
 * Make a request to Supabase REST API with pagination support
 */
async function supabaseQuery(table, select, filters = {}, fetchAll = false) {
  const pageSize = 1000;
  let allData = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams();
    params.set("select", select);
    params.set("limit", pageSize.toString());
    params.set("offset", offset.toString());

    for (const [key, value] of Object.entries(filters)) {
      params.set(key, value);
    }

    const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Supabase API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    allData = allData.concat(data);

    // If we got fewer results than the page size, we've reached the end
    if (!fetchAll || data.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return allData;
}

/**
 * Fetch all active APIs from Supabase with their categories
 */
async function fetchAPIs() {
  console.log("Fetching APIs from Supabase...");

  const data = await supabaseQuery(
    "apis",
    "api_name,description,auth,https,cors,documentation_link,categories(name)",
    { status: "eq.active", order: "api_name.asc" },
    true, // fetchAll - paginate through all results
  );

  // Transform to public-apis format
  const apis = data.map((row) => ({
    "API Name": row.api_name || "",
    Description: row.description || "",
    Auth: row.auth || "",
    HTTPS: row.https ?? true,
    Cors: row.cors || "",
    "Documentation Link": row.documentation_link || "",
    Category: row.categories?.name || "Other",
  }));

  console.log(`Fetched ${apis.length} APIs`);
  return apis;
}

/**
 * Fetch all categories from Supabase
 */
async function fetchCategories() {
  console.log("Fetching categories from Supabase...");

  const data = await supabaseQuery("categories", "name,slug", {
    order: "name.asc",
  });

  console.log(`Fetched ${data.length} categories`);
  return data;
}

/**
 * Ensure the db directory exists
 */
function ensureDbDirectory() {
  const dbDir = path.join(process.cwd(), "db");
  if (!fs.existsSync(dbDir)) {
    console.log("Creating db directory...");
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

/**
 * Write resources to db/resources.json
 */
function writeResources(apis) {
  const output = {
    count: apis.length,
    entries: apis,
  };

  const filePath = path.join(process.cwd(), "db", "resources.json");
  console.log(`Writing ${apis.length} APIs to ${filePath}...`);

  fs.writeFileSync(filePath, JSON.stringify(output, null, 2), "utf-8");
  console.log("✓ Successfully wrote resources.json");
}

/**
 * Write categories to db/categories.json
 */
function writeCategories(categories) {
  const output = {
    count: categories.length,
    entries: categories,
  };

  const filePath = path.join(process.cwd(), "db", "categories.json");
  console.log(`Writing ${categories.length} categories to ${filePath}...`);

  fs.writeFileSync(filePath, JSON.stringify(output, null, 2), "utf-8");
  console.log("✓ Successfully wrote categories.json");
}

/**
 * Main sync function
 */
async function sync() {
  try {
    console.log("Starting Supabase → public-apis sync...\n");

    // Ensure db directory exists
    ensureDbDirectory();

    // Fetch data from Supabase
    const [apis, categories] = await Promise.all([
      fetchAPIs(),
      fetchCategories(),
    ]);

    // Write to JSON files
    writeResources(apis);
    writeCategories(categories);

    console.log("\n✓ Sync completed successfully!");
    console.log(`  - ${apis.length} APIs exported`);
    console.log(`  - ${categories.length} categories exported`);
  } catch (err) {
    console.error("\n✗ Sync failed:", err);
    process.exit(1);
  }
}

// Run the sync
sync();
