import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PropSelector({ value, onValueChange, fieldLabels }: Props) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="ml-auto w-fit focus:ring-0">
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
  value: string;
  onValueChange: (value: string) => void;
  fieldLabels: { [k: string]: string };
}
