<!-- Thank you for contributing to public-apis! -->

## Tip: Use the website instead

The easiest way to add an API is via [findapis.com](https://findapis.com) - click "Suggest an API" and it will appear in the directory within 1 minute if approved.

---

## Adding an API via Pull Request

> ⚠️ **Important:** Edit `db/resources.json` directly. Do NOT edit README.md or files in `categories/` - they are auto-generated.

### API Details

| Field | Value |
|-------|-------|
| API Name | |
| Description | |
| Documentation URL | |
| Auth | No / `apiKey` / `OAuth` / `Bearer` |
| HTTPS | Yes / No |
| CORS | Yes / No / Unknown |
| Pricing | Free / Freemium / Paid / Unknown |
| Category | |

### JSON Entry

```json
{
  "API Name": "",
  "Description": "",
  "Auth": "",
  "HTTPS": true,
  "Cors": "",
  "Documentation Link": "",
  "Category": "",
  "Pricing": ""
}
```

### Checklist

- [ ] I have read the [contributing guide](https://github.com/paytience/public-apis/blob/main/CONTRIBUTING.md)
- [ ] I edited `db/resources.json` (not README.md)
- [ ] The API has proper documentation
- [ ] My addition is ordered alphabetically within the `entries` array
- [ ] The description is under 100 characters
- [ ] The API name does not end with "API"
- [ ] I updated the `count` field at the top of resources.json
- [ ] I have searched for duplicate PRs/issues
