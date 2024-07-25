import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";

import { JobStatus } from "../../../../../types";
import {
  DataTableFilterField,
  DataTableFormConfig,
} from "@/components/ui/data-table";

export const jobFilterFormProps: DataTableFormConfig = {
  job_id: {
    validation: z.string(),
    defaultValue: "",
    label: "Job Id",
    getFormElement: (field: DataTableFilterField) => (
      <Input {...field} className="" />
    ),
  },
  device: {
    validation: z.string(),
    defaultValue: "",
    label: "Device",
    getFormElement: (field: DataTableFilterField) => (
      <Input {...field} className="" />
    ),
  },
  status: {
    validation: z.nativeEnum(JobStatus).or(z.literal("")),
    defaultValue: "",
    label: "Status",
    getFormElement: ({ ref, value, ...props }: DataTableFilterField) => (
      <Select
        onValueChange={props.onChange}
        value={value as string | undefined}
        {...props}
      >
        <SelectTrigger ref={ref}>
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={JobStatus.FAILED}>Failed</SelectItem>
          <SelectItem value={JobStatus.SUCCESSFUL}>Successful</SelectItem>
          <SelectItem value={JobStatus.PENDING}>Pending</SelectItem>
        </SelectContent>
      </Select>
    ),
  },
};
