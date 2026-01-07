# Admin App Source

## Structure
- `components/`: UI components
- `pages/`: route-level screens
- `hooks/`: data-fetching hooks
- `services/`: API clients + auth helpers
- `store/`: Zustand stores
- `utils/`, `lib/`, `types/`

## Rules
- Use `@` alias for `src`.
- API calls use `VITE_API_URL` (see `ENV.example`).
- Keep vendor integrations out of UI; depend on API endpoints.
