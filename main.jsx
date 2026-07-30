@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { min-height: 100%; }

body {
  background: radial-gradient(circle at top, #234a3a 0%, #122a21 70%);
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Athletic block wordmark — jersey/scoreboard lettering */
.wordmark {
  font-family: 'Anton', Impact, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 400;
  line-height: 1;
}

/* Big wordmark on the landing page gets a subtle chiselled edge */
.wordmark-hero {
  text-shadow: 0 3px 0 rgba(0,0,0,0.35), 0 0 34px rgba(212,160,23,0.22);
}

/* Section headings: same athletic family, smaller */
.display {
  font-family: 'Anton', Impact, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-weight: 400;
}

.felt-panel {
  background: linear-gradient(180deg, rgba(37,80,62,0.9), rgba(18,42,33,0.95));
  border: 1px solid rgba(212,160,23,0.25);
  box-shadow: inset 0 0 60px rgba(0,0,0,0.35);
}

.stat-card {
  background: rgba(18,42,33,0.55);
  border: 1px solid rgba(212,160,23,0.18);
  border-radius: 0.75rem;
}
