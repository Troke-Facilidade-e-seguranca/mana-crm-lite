import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actions } from "@/lib/crm";

export function NovoContato() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    categoria: "",
    subcategoria: "",
    endereco: "",
    telefone: "",
    nomeContato: "",
  });

  const campo = (k: keyof typeof form, label: string, placeholder = "") => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input
        id={k}
        maxLength={200}
        placeholder={placeholder}
        value={form[k]}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Novo contato
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo contato</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {campo("nome", "Nome do negócio")}
          {campo("nomeContato", "Pessoa de contato")}
          {campo("categoria", "Categoria")}
          {campo("subcategoria", "Subcategoria")}
          {campo("telefone", "Telefone", "+55 92 9....")}
          {campo("endereco", "Endereço")}
        </div>
        <DialogFooter>
          <Button
            disabled={!form.nome.trim()}
            onClick={() => {
              actions.create({ ...form, nome: form.nome.trim() });
              setForm({
                nome: "",
                categoria: "",
                subcategoria: "",
                endereco: "",
                telefone: "",
                nomeContato: "",
              });
              setOpen(false);
              toast.success("Contato criado.");
            }}
          >
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
