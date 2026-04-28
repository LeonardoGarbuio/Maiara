# Maiara Garbuio — Arquitetura e Interiores
## Design System MASTER

---

### Estilo
**Soft UI Evolution** — Sombras suaves multi-camada, profundidade sutil, contraste melhorado (WCAG AA+), foco em acessibilidade.

### Paleta de Cores

| Token | Valor | Uso |
|-------|-------|-----|
| `--carbon-950` | `#050505` | Background principal (body, sidebar) |
| `--carbon-900` | `#0A0A0A` | Background secundário |
| `--carbon-800` | `#111111` | Cards, painéis |
| `--carbon-700` | `#1A1A1A` | Inputs, hover subtle |
| `--carbon-600` | `#222222` | Borders |
| `--carbon-500` | `#333333` | Borders light, scrollbar |
| `--carbon-400` | `#555555` | Texto terciário |
| `--carbon-300` | `#888888` | Texto secundário |
| `--carbon-200` | `#BBBBBB` | Texto body |
| `--carbon-100` | `#E0E0E0` | Texto principal |
| `--emerald-600` | `#059669` | Accent primário (botões, progress) |
| `--emerald-500` | `#10B981` | Accent hover |
| `--emerald-400` | `#34D399` | Accent light (texto, badges) |
| `--gold-600` | `#B8962E` | **Brand only** — Logo gradient start |
| `--gold-500` | `#C9A96E` | **Brand only** — Nome, subtítulo, avatar |
| `--gold-400` | `#D4B896` | **Brand only** — Subtítulo, tags |
| `--gold-300` | `#E2CEAF` | **Brand only** — Detalhe sutil |

### Regras de Uso do Dourado

> O dourado (`--gold-*`) é utilizado **exclusivamente** para elementos de identidade de marca:
> - Nome "Maiara Garbuio" na sidebar e login
> - Subtítulo "Arquitetura e Interiores"
> - Ícone/logo SVG gradient
> - Avatar do usuário na sidebar
> - Tag da marca no login (`.imageTag`)
>
> **NÃO usar** o dourado para: botões, progress bars, badges de status, filtros ativos, focus rings, nav active state. Esses elementos usam `--emerald-*`.

### Tipografia

**Mantida sem alteração.**
- Font: `Inter` (Google Fonts)
- Weights: 300–900
- Headings: 700–800, letter-spacing: -0.02em
- Body: 400–500, line-height: 1.6

### Sombras (Soft UI Evolution)

| Token | Valor | Uso |
|-------|-------|-----|
| `--shadow-soft` | `0 1px 2px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15)` | Cards padrão |
| `--shadow-card` | `0 2px 6px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.12)` | Cards em hover |
| `--shadow-elevated` | `0 4px 12px rgba(0,0,0,0.25), 0 16px 40px rgba(0,0,0,0.15)` | Modais, toasts |
| `--shadow-inset` | `inset 0 1px 2px rgba(0,0,0,0.15)` | Inputs |
| `--shadow-glow` | `0 0 20px rgba(16,185,129,0.15)` | Botões primários hover |

### Border Radius

| Token | Valor |
|-------|-------|
| `--radius-sm` | `8px` |
| `--radius-md` | `12px` |
| `--radius-lg` | `18px` |
| `--radius-xl` | `26px` |

### Espaçamento (Generoso / "Respira")

- Page gap: `36–40px`
- Cards padding: `24–28px`
- Modal padding: `28–32px`
- Nav item padding: `13px 16px`
- Sidebar header: `28px 20px`
- Main content: `40px`
- Gaps em grids: `18–24px`

### Transições & Micro-interações

- **Duração padrão**: `250ms` (ease)
- **Hover em cards**: `transform: translateY(-2px)` + `box-shadow` upgrade
- **Botão primário hover**: `translateY(-1px)` + `shadow-glow`
- **Cursor**: `cursor-pointer` global em `a, button, [role="button"]`, etc.
- **`prefers-reduced-motion`**: Todas as animações desativadas

### Checklist de Pré-Entrega ✓

- [x] Sem emojis como ícones (SVG Heroicons-style inline)
- [x] `cursor-pointer` em todos elementos clicáveis (global CSS rule)
- [x] Hover states com transições suaves (200–300ms)
- [x] Contraste de texto ≥ 4.5:1
- [x] Focus states visíveis (border-color: emerald-500)
- [x] `prefers-reduced-motion` respeitado
- [x] Responsivo: 375px, 768px, 1024px, 1440px
- [x] Layout "respira" com paddings generosos
