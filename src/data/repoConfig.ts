// Configuração opcional de URL do repositório para tornar arquivos e commits
// referenciados no Organograma clicáveis. Deixe `baseUrl` vazio para manter
// chips estáticos (default seguro). Quando o projeto estiver conectado ao
// GitHub via Connectors, preencha `baseUrl` com algo como
// "https://github.com/<owner>/<repo>".

export const REPO_CONFIG = {
  baseUrl: "" as string,
  branch: "main" as string,
};

export function fileUrl(filePath: string): string | null {
  if (!REPO_CONFIG.baseUrl) return null;
  const clean = filePath.replace(/^\/+/, "");
  return `${REPO_CONFIG.baseUrl.replace(/\/+$/, "")}/blob/${REPO_CONFIG.branch}/${clean}`;
}

export function commitUrl(hash: string): string | null {
  if (!REPO_CONFIG.baseUrl || !hash) return null;
  return `${REPO_CONFIG.baseUrl.replace(/\/+$/, "")}/commit/${hash}`;
}

export function shortHash(hash: string, len = 7): string {
  return (hash || "").slice(0, len);
}
