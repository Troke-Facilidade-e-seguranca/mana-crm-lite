import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, MapPin, MessageCircle, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContatoDetalhe } from "@/components/crm/ContatoDetalhe";
import { ImportDialog } from "@/components/crm/ImportDialog";
import { NovoContato } from "@/components/crm/NovoContato";
import {
  actions,
  hydrateStore,
  mapsLink,
  preencherMensagem,
  STATUS,
  statusLabel,
  TEMPLATES,
  useCrm,
  whatsappLink,
  type Status,
} from "@/lib/crm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CRM Manaus — organize seus contatos comerciais" },
      {
        name: "description",
        content:
          "CRM pessoal para acompanhar estabelecimentos de Manaus: pipeline, anotações, WhatsApp com mensagens de saudação e importação de planilhas.",
      },
      { property: "og:title", content: "CRM Manaus — organize seus contatos comerciais" },
      {
        property: "og:description",
        content:
          "Pipeline de vendas, anotações por contato, WhatsApp direto e importação de planilhas.",
      },
    ],
  }),
  component: App,
});

function App() {
  const { contatos, config } = useCrm();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [status, setStatus] = useState<"todos" | Status>("todos");
  const [abertoId, setAbertoId] = useState<string | null>(null);

  useEffect(() => {
    hydrateStore();
  }, []);

  const categorias = useMemo(
    () => [...new Set(contatos.map((c) => c.categoria))].sort((a, b) => a.localeCompare(b)),
    [contatos],
  );

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return contatos.filter(
      (c) =>
        (categoria === "todas" || c.categoria === categoria) &&
        (status === "todos" || c.status === status) &&
        (!q ||
          `${c.nome} ${c.subcategoria} ${c.endereco} ${c.telefone} ${c.nomeContato}`
            .toLowerCase()
            .includes(q)),
    );
  }, [contatos, busca, categoria, status]);

  const contagem = (s: Status) => contatos.filter((c) => c.status === s).length;
  const aberto = contatos.find((c) => c.id === abertoId) ?? null;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-5">
          <div className="mr-auto">
            <h1 className="text-2xl font-bold">CRM Manaus</h1>
            <p className="text-sm text-muted-foreground">
              {contatos.length} estabelecimentos na sua base
            </p>
          </div>
          <Input
            className="w-full sm:w-56"
            placeholder="Seu nome (usado nas mensagens)"
            maxLength={60}
            value={config.meuNome}
            onChange={(e) => actions.setConfig({ meuNome: e.target.value })}
          />
          <ImportDialog />
          <NovoContato />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {STATUS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatus(status === s.value ? "todos" : s.value)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                status === s.value
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              <p className="text-2xl font-bold">{contagem(s.value)}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nome, bairro, telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {STATUS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {filtrados.length} contato(s) encontrado(s)
        </p>

        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {filtrados.map((c) => {
            const statusInfo = STATUS.find((s) => s.value === c.status)!;
            return (
              <li
                key={c.id}
                className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-2">
                  <button
                    className="mr-auto text-left"
                    onClick={() => setAbertoId(c.id)}
                  >
                    <p className="font-semibold">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.categoria}
                      {c.subcategoria ? ` · ${c.subcategoria}` : ""}
                    </p>
                  </button>
                  <Badge className={statusInfo.className}>{statusLabel(c.status)}</Badge>
                </div>

                {c.endereco && (
                  <a
                    href={mapsLink(c.endereco, c.nome)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex items-start gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
                  >
                    <MapPin className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      {c.endereco} <ExternalLink className="inline size-3" />
                    </span>
                  </a>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {c.avaliacao !== null && (
                    <Badge variant="secondary" className="gap-1">
                      <Star className="size-3" /> {c.avaliacao}
                    </Badge>
                  )}
                  {c.notas.length > 0 && (
                    <Badge variant="outline">{c.notas.length} anotação(ões)</Badge>
                  )}
                  <div className="ml-auto flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setAbertoId(c.id)}>
                      Abrir
                    </Button>
                    <Button
                      size="sm"
                      disabled={c.telefone.replace(/\D/g, "").length < 10}
                      onClick={() => {
                        const msg = preencherMensagem(
                          TEMPLATES[0]!.texto,
                          c,
                          config.meuNome,
                        );
                        window.open(whatsappLink(c.telefone, msg), "_blank", "noopener");
                        if (c.status === "novo")
                          actions.update(c.id, { status: "contatado" });
                        actions.addNota(c.id, `WhatsApp enviado: "${msg}"`);
                      }}
                    >
                      <MessageCircle /> WhatsApp
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {!filtrados.length && (
          <p className="py-16 text-center text-muted-foreground">
            Nenhum contato com esses filtros.
          </p>
        )}
      </section>

      <ContatoDetalhe
        contato={aberto}
        meuNome={config.meuNome}
        onOpenChange={(o) => !o && setAbertoId(null)}
        onRemover={(id) => {
          actions.remove(id);
          toast.success("Contato excluído.");
        }}
      />
    </main>
  );
}
