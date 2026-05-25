# Oposiciones Auxiliar Administrativo — SAS

Aplicación web para preparar el examen de **Grupo Auxiliar de la Función Administrativa del Servicio Andaluz de Salud (SAS)**.

300 preguntas tipo test organizadas por temas, con selección inteligente de preguntas, estadísticas detalladas y persistencia local en el navegador.

---

## Funcionalidades

- **300 preguntas** distribuidas en 16 bloques temáticos
- **Selección inteligente**: prioriza preguntas no vistas, falladas o con baja puntuación
- **Dos modos de examen**: Examen (sin feedback) y Estudio (feedback inmediato)
- **Penalización configurable**: cada 3 fallos restan 1 acierto
- **Filtro por tema**: practica solo los bloques que necesitas
- **Estadísticas**: evolución de notas, precisión por tema, historial de tests
- **Exportar / importar** progreso en JSON
- **Sin registro, sin servidor**: todo se guarda en `localStorage`

## Temas incluidos

| # | Tema |
|---|------|
| 1 | Prevención de Riesgos Laborales |
| 2 | Autonomía del Paciente |
| 3 | Estatuto Marco del Personal Estatutario |
| 4 | Procedimiento Administrativo Común |
| 5 | Tarjeta Sanitaria Canaria |
| 6 | Información y Atención al Ciudadano |
| 7 | Historia Clínica y Documentación |
| 8 | ODDUS — Derechos de los Usuarios |
| 9 | Protección de Datos Personales |
| 10 | Seguridad Social |
| 11 | Almacenes y Suministros |
| 12 | Contratos del Sector Público |
| 13 | Retribuciones y Nóminas |
| 14 | Certificados y Copias |
| 15 | Listas de Espera |
| 16 | Informática y Ofimática |

---

## Tecnologías

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Tailwind CSS v3](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) — gráficas de estadísticas

---

## Desarrollo local

### Requisitos previos

- Node.js ≥ 18
- npm ≥ 9

### Instalación

```bash
git clone https://github.com/EMH01/oposiciones-aux-admin-salud.git
cd oposiciones-aux-admin-salud
npm install
```

### Arrancar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en el navegador.

### Build de producción

```bash
npm run build
```

El resultado queda en la carpeta `dist/`.

---

## Despliegue en GitHub Pages

### Primera vez

```bash
npm install --save-dev gh-pages
```

### Publicar

```bash
npm run deploy
```

La app estará disponible en:
👉 **https://emh01.github.io/oposiciones-aux-admin-salud/**

---

## Licencia

MIT

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
