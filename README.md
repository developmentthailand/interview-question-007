# Interview Question 07 — Unique QR Product Catalog

A product-code catalog with six groups of five uppercase letters or digits. The written specification requires 30 characters; the supplied screenshot appears to show a different length, so this implementation follows the written requirement. Product codes are unique in SQLite and each entry can open a generated QR code modal.

## Run locally

Requires .NET 10, Node.js 22.22.3+, and npm 10.9.8+.

```powershell
dotnet run --project backend/Question007.Api/Question007.Api.csproj --launch-profile http
```

Run `npm ci` and `npm start` from `frontend`, then open `http://localhost:4206`. Angular proxies `/api` to `http://localhost:5222`. SQLite creates `backend/Question007.Api/products.db` at first start.

## API

- `GET /api/products` lists saved codes.
- `POST /api/products` validates and saves a code in `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX` format. Duplicate codes return `409 Conflict`.
- `GET /api/products/{id}` returns a saved product.
- `DELETE /api/products/{id}` removes a product.

The frontend generates QR SVG output locally from the validated product code using the `qrcode` package.

## Verify

```powershell
dotnet test tests/backend/Question007.Api.Tests/Question007.Api.Tests.csproj --configuration Release
dotnet build backend/Question007.Api/Question007.Api.csproj --configuration Release
cd frontend
npm ci
npm test
npm run build
```

Results: backend **6 passed**, Angular **4 passed**, Release API build clean, and production Angular bundle **243.67 kB** initial (estimated transfer **69.18 kB**).

Package identity: `@example-com/interview-question-007`; namespace: `Example.Com.InterviewQuestion007`.
