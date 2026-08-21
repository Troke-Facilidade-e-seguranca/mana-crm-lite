import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  actions,
  formatarData,
  mapsLink,
  preencherMensagem,
  STATUS,
  TEMPLATES,
  whatsappLink,
  type Contato,
  type Status,
} from "@/lib/crm";

export function ContatoDetalhe({
  contato,
  meuNome,
  onOpenChange,
  onRemover,
}: {
  contato: Contato | null;
  meuNome: string;
  onOpenChange: (open: boolean) => void;
  onRemover: (id: string) => void;
}) {
  const [templateId, setTemplateId] = useState(TEMPLATES[0]!.id);
  const [mensagem, setMensagem] = useState("");
  const [nota, setNota] = useState("");

  const template = useMemo(
    () => TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0]!,
    [templateId],
  );

  useEffect(() => {
    if (contato) setMensagem(preencherMensagem(template.texto, contato, meuNome));
  }, [template, contato, meuNome]);

  if (!contato) return null;

  const temTelefone = contato.telefone.replace(/\D/g, "").length >= 10;

  return (
    <Sheet open={!!contato} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="pr-6 text-2xl">{contato.nome}</SheetTitle>
          <SheetDescription>
            {contato.categoria}
            {contato.subcategoria ? ` · ${contato.subcategoria}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-10">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={contato.status}
              onValueChange={(v) => actions.update(contato.id, { status: v as Status })}
            >
              <SelectTrigger className="w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {contato.avaliacao !== null && (
              <Badge variant="secondary" className="gap-1">
                <Star className="size-3" /> {contato.avaliacao}
                {contato.numAvaliacoes ? ` (${contato.numAvaliacoes})` : ""}
              </Badge>
            )}
          </div>

          <div className="space-y-3 text-sm">
            {contato.endereco && (
              <a
                href={mapsLink(contato.endereco, contato.nome)}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-2 text-primary underline-offset-4 hover:underline"
              >
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>
                  {contato.endereco} <ExternalLink className="inline size-3" />
                </span>
              </a>
            )}
            {contato.telefone && (
              <a
                href={`tel:${contato.telefone.replace(/\s/g, "")}`}
                className="flex items-center gap-2 text-foreground"
              >
                <Phone className="size-4 shrink-0" /> {contato.telefone}
              </a>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome-contato">Nome da pessoa de contato</Label>
            <Input
              id="nome-contato"
              placeholder="Ex.: João"
              value={contato.nomeContato}
              onChange={(e) => actions.update(contato.id, { nomeContato: e.target.value })}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-base font-semibold">Mensagem de saudação</h3>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              rows={6}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={!temTelefone}
              onClick={() => {
                window.open(whatsappLink(contato.telefone, mensagem), "_blank", "noopener");
                if (contato.status === "novo")
                  actions.update(contato.id, { status: "contatado" });
                actions.addNota(contato.id, `WhatsApp enviado: "${mensagem}"`);
                toast.success("WhatsApp aberto e registrado no histórico.");
              }}
            >
              <MessageCircle /> {temTelefone ? "Enviar no WhatsApp" : "Sem telefone válido"}
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-base font-semibold">Anotações</h3>
            <Textarea
              rows={3}
              placeholder="O que aconteceu nesse contato?"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
            <Button
              variant="secondary"
              disabled={!nota.trim()}
              onClick={() => {
                actions.addNota(contato.id, nota.trim());
                setNota("");
              }}
            >
              Salvar anotação
            </Button>

            <ul className="space-y-2">
              {contato.notas.map((n) => (
                <li key={n.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="whitespace-pre-wrap">{n.texto}</p>
                    <button
                      aria-label="Excluir anotação"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => actions.removeNota(contato.id, n.id)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatarData(n.criadoEm)}
                  </p>
                </li>
              ))}
              {!contato.notas.length && (
                <li className="text-sm text-muted-foreground">Nenhuma anotação ainda.</li>
              )}
            </ul>
          </div>

          <Separator />

          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => {
              onRemover(contato.id);
              onOpenChange(false);
            }}
          >
            <Trash2 /> Excluir contato
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
