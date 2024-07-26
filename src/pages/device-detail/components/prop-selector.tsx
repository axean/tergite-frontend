import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QubitProp } from "../../../../types";

export function PropSelector({ value, onValueChange, fieldLabels }: Props) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-fit focus:ring-0">
        <span className="hidden sm:inline text-muted-foreground pr-1">
          Property:{" "}
        </span>
        <SelectValue placeholder="Select property" />
      </SelectTrigger>
      <SelectContent>
        {Object.keys(fieldLabels).map((prop) => (
          <SelectItem value={prop} key={prop}>
            {fieldLabels[prop]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface Props {
  value: QubitProp;
  onValueChange: (value: QubitProp) => void;
  fieldLabels: { [k: string]: string };
}
