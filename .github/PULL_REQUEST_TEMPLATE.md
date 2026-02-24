<!-- Thank you for contributing to public-apis! -->

## Tip: Use the website instead

The easiest way to add an API is via [findapis.com](https://findapis.com) - click "Suggest an API" and it will appear in the directory within 1 minute if approved.

---

## Adding an API via Pull Request

### API Details

**Required:**
| Field | Value |
|-------|-------|
| API Name* | |
| Documentation Link* | |

**Optional:**
| Field | Value |
|-------|-------|
| Description | |
| Category | |
| Auth | apiKey / OAuth / Bearer / Basic / No |
| HTTPS | Yes / No / Unknown |
| CORS | yes / no / unknown |
| Pricing | free / freemium / paid |

### JSON Entry

Add this to `db/resources.json`:

```json
{
  "API Name": "",
  "Documentation Link": "",
  "Description": "",
  "Category": "",
  "Auth": "",
  "HTTPS": true,
  "Cors": "",
  "Pricing": ""
}
```

### Checklist

- [ ] I have read the [contributing guide](https://github.com/paytience/public-apis/blob/main/CONTRIBUTING.md)
- [ ] I edited `db/resources.json`
- [ ] The API has proper documentation
- [ ] The API name does not end with "API"
- [ ] I updated the `count` field at the top of resources.json
- [ ] I have searched for duplicate PRs/issues
