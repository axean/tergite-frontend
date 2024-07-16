import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PropSelector({ value, onValueChange, optionsMap }: Props) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="ml-auto w-fit focus:ring-0">
        <span className="hidden sm:inline text-muted-foreground pr-1">
          Property:{" "}
        </span>
        <SelectValue placeholder="Select property" />
      </SelectTrigger>
      <SelectContent>
        {Object.keys(optionsMap).map((prop) => (
          <SelectItem value={prop} key={prop}>
            {optionsMap[prop]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface Props {
  value: string;
  onValueChange: (value: string) => void;
  optionsMap: { [k: string]: string };
}
