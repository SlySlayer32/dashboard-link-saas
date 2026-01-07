# API Source

## Structure
- `routes/`: HTTP endpoints
- `middleware/`: auth, caching, rate limiting
- `services/`: business logic + integrations
- `config/`: env parsing/validation
- `utils/`: logging and helpers

## Rules
- Validate inputs with Zod + `zValidator`.
- Keep route handlers thin.
