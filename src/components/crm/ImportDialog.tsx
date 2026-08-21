import { useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { actions, rowsToContatos } from "@/lib/crm";

const HEADERS: Record<string, string> = {
  "categoria macro": "categoria",
  categoria: "categoria",
  subcategoria: "subcategoria",
  nome: "nome",
  "endereço": "endereco",
  endereco: "endereco",
  telefone: "telefone",
  "avaliação": "avaliacao",
  avaliacao: "avaliacao",
  "nº avaliações": "numAvaliacoes",
  "n avaliacoes": "numAvaliacoes",
};

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [modo, setModo] = useState<"adicionar" | "substituir">("adicionar");
  const [carregando, setCarregando] = useState(false);

  async function onFile(file: File) {
    setCarregando(true);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]!]!;
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
      const rows = raw.map((r) => {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(r)) {
          const key = HEADERS[k.trim().toLowerCase()];
          if (key) out[key] = v;
        }
        return out as never;
      });
      const contatos = rowsToContatos(rows);
      if (!contatos.length) {
        toast.error("Nenhuma linha encontrada. Verifique se existe a coluna 'Nome'.");
        return;
      }
      actions.importar(contatos, modo);
      toast.success(`${contatos.length} contatos importados.`);
      setOpen(false);
    } catch {
      toast.error("Não foi possível ler a planilha.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload /> Importar planilha
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar planilha (.xlsx / .csv)</DialogTitle>
          <DialogDescription>
            Colunas reconhecidas: Categoria Macro, Subcategoria, Nome, Endereço, Telefone,
            Avaliação, Nº Avaliações.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={modo}
          onValueChange={(v) => setModo(v as typeof modo)}
          className="gap-3"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="adicionar" id="m-add" />
            <Label htmlFor="m-add">Adicionar aos contatos existentes</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="substituir" id="m-rep" />
            <Label htmlFor="m-rep">Substituir tudo (apaga a lista atual)</Label>
          </div>
        </RadioGroup>

        <Label
          htmlFor="arquivo"
          className="mt-2 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground hover:bg-muted"
        >
          <Upload className="size-5" />
          {carregando ? "Lendo planilha..." : "Clique para escolher o arquivo"}
        </Label>
        <input
          id="arquivo"
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = "";
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
