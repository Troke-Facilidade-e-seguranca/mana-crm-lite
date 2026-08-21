import { useSyncExternalStore } from "react";
import seed from "@/data/estabelecimentos.json";

export type Status = "novo" | "contatado" | "negociacao" | "fechado" | "perdido";

export const STATUS: { value: Status; label: string; className: string }[] = [
  { value: "novo", label: "Novo", className: "bg-muted text-muted-foreground" },
  { value: "contatado", label: "Contatado", className: "bg-info/15 text-info" },
  { value: "negociacao", label: "Em negociação", className: "bg-warning/15 text-warning" },
  { value: "fechado", label: "Fechado", className: "bg-success/15 text-success" },
  { value: "perdido", label: "Perdido", className: "bg-destructive/15 text-destructive" },
];

export const statusLabel = (s: Status) => STATUS.find((x) => x.value === s)?.label ?? s;

export type Nota = { id: string; texto: string; criadoEm: string };

export type Contato = {
  id: string;
  nome: string;
  categoria: string;
  subcategoria: string;
  endereco: string;
  telefone: string;
  avaliacao: number | null;
  numAvaliacoes: number | null;
  nomeContato: string;
  status: Status;
  notas: Nota[];
  criadoEm: string;
};

export type Config = { meuNome: string };

type State = { contatos: Contato[]; config: Config };

const KEY = "crm-manaus-v1";

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

type SeedRow = {
  categoria: string | null;
  subcategoria: string | null;
  nome: string | null;
  endereco: string | null;
  telefone: string | null;
  avaliacao: number | null;
  numAvaliacoes: number | null;
};

export function rowsToContatos(rows: SeedRow[]): Contato[] {
  return rows
    .filter((r) => r.nome)
    .map((r) => ({
      id: uid(),
      nome: String(r.nome),
      categoria: r.categoria ? String(r.categoria) : "Sem categoria",
      subcategoria: r.subcategoria ? String(r.subcategoria) : "",
      endereco: r.endereco ? String(r.endereco) : "",
      telefone: r.telefone ? String(r.telefone) : "",
      avaliacao: typeof r.avaliacao === "number" ? r.avaliacao : null,
      numAvaliacoes: typeof r.numAvaliacoes === "number" ? r.numAvaliacoes : null,
      nomeContato: "",
      status: "novo" as Status,
      notas: [],
      criadoEm: new Date().toISOString(),
    }));
}

function initialState(): State {
  return { contatos: rowsToContatos(seed as SeedRow[]), config: { meuNome: "" } };
}

let state: State = initialState();
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function set(next: State) {
  state = next;
  persist();
  emit();
}

export function hydrateStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (Array.isArray(parsed.contatos)) {
        state = { contatos: parsed.contatos, config: parsed.config ?? { meuNome: "" } };
        emit();
        return;
      }
    }
  } catch {
    /* ignore */
  }
  persist();
}

export function useCrm() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

export const actions = {
  setConfig(config: Partial<Config>) {
    set({ ...state, config: { ...state.config, ...config } });
  },
  update(id: string, patch: Partial<Contato>) {
    set({
      ...state,
      contatos: state.contatos.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  },
  remove(id: string) {
    set({ ...state, contatos: state.contatos.filter((c) => c.id !== id) });
  },
  create(data: Partial<Contato>) {
    const novo: Contato = {
      id: uid(),
      nome: data.nome ?? "Sem nome",
      categoria: data.categoria || "Sem categoria",
      subcategoria: data.subcategoria ?? "",
      endereco: data.endereco ?? "",
      telefone: data.telefone ?? "",
      avaliacao: null,
      numAvaliacoes: null,
      nomeContato: data.nomeContato ?? "",
      status: data.status ?? "novo",
      notas: [],
      criadoEm: new Date().toISOString(),
    };
    set({ ...state, contatos: [novo, ...state.contatos] });
    return novo.id;
  },
  addNota(id: string, texto: string) {
    const nota: Nota = { id: uid(), texto, criadoEm: new Date().toISOString() };
    set({
      ...state,
      contatos: state.contatos.map((c) =>
        c.id === id ? { ...c, notas: [nota, ...c.notas] } : c,
      ),
    });
  },
  removeNota(id: string, notaId: string) {
    set({
      ...state,
      contatos: state.contatos.map((c) =>
        c.id === id ? { ...c, notas: c.notas.filter((n) => n.id !== notaId) } : c,
      ),
    });
  },
  importar(contatos: Contato[], modo: "adicionar" | "substituir") {
    set({
      ...state,
      contatos: modo === "substituir" ? contatos : [...contatos, ...state.contatos],
    });
  },
};

/* ---------- utilidades ---------- */

export function whatsappLink(telefone: string, mensagem: string) {
  const digits = telefone.replace(/\D/g, "");
  const numero = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

export function mapsLink(endereco: string, nome?: string) {
  const q = [nome, endereco].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export const TEMPLATES: { id: string; titulo: string; texto: string }[] = [
  {
    id: "v1",
    titulo: "1 — Direta e simples",
    texto:
      "Oi! Tudo bem? Sou {meuNome} e tô desenvolvendo um serviço de presença digital pra pequenos negócios aqui da região. Posso te roubar 5 minutinhos pra entender melhor como vocês lidam com isso hoje? Sua opinião ia me ajudar muito 🙏",
  },
  {
    id: "v2",
    titulo: "2 — Curiosidade genuína",
    texto:
      "Oi, {nome}! Passando aqui rapidinho — sou {meuNome} e tô pesquisando como pequenos negócios locais cuidam da presença digital (site, WhatsApp, Google etc). Você teria 5 min pra eu fazer umas perguntas rápidas? Não é venda, é pesquisa mesmo 😊",
  },
  {
    id: "v3",
    titulo: "3 — Elogio + pedido",
    texto:
      "Oi! Vi seu negócio aqui e achei bem legal. Tô estruturando um serviço de presença digital pra pequenos empreendedores e queria muito ouvir sua experiência com isso. Tem 5 minutos pra bater um papo rápido?",
  },
  {
    id: "v4",
    titulo: "4 — Vulnerável/autêntica",
    texto:
      "Oi, {nome}, tudo bem? Sou {meuNome}, tô no início de um projeto de presença digital pra negócios locais e antes de sair vendendo, quero entender de verdade as dores de quem vive isso no dia a dia. Você toparia me dar 5 min de atenção?",
  },
  {
    id: "v5",
    titulo: "5 — Foco no problema",
    texto:
      "Oi! Rapidinho: hoje o {negocio} tem site, Google Meu Negócio, automação de WhatsApp organizados? Tô pesquisando isso pra um serviço que estou criando e adoraria ouvir sua real por 5 minutinhos 🙏",
  },
];

export function preencherMensagem(texto: string, contato: Contato, meuNome: string) {
  return texto
    .replaceAll("{meuNome}", meuNome.trim() || "[seu nome]")
    .replaceAll("{nome}", contato.nomeContato.trim() || contato.nome)
    .replaceAll("{negocio}", contato.nome);
}

export function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
