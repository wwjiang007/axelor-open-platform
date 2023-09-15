import clsx from "clsx";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useMemo } from "react";

import { Select, SelectProps, SelectValue } from "@/components/select";
import { Selection as SelectionType } from "@/services/client/meta.types";

import { FieldControl, FieldProps } from "../../builder";
import { useSelectionList } from "./hooks";

import styles from "./selection.module.scss";

const optionKey = (item: SelectionType) => item.value!;
const optionLabel = (item: SelectionType) => item.title!;
const optionEqual = (a: SelectionType, b: SelectionType) => a.value === b.value;

export type SelectionProps<Multiple extends boolean> = FieldProps<
  string | number | null
> &
  Pick<
    SelectProps<SelectionType, Multiple>,
    "multiple" | "autoComplete" | "renderOption" | "renderValue"
  >;

export function Selection<Multiple extends boolean>(
  props: SelectionProps<Multiple>,
) {
  const {
    schema,
    readonly,
    invalid,
    multiple,
    autoComplete = false,
    renderOption,
    renderValue,
    widgetAtom,
    valueAtom,
  } = props;

  const [value, setValue] = useAtom(valueAtom);
  const {
    attrs: { required, focus },
  } = useAtomValue(widgetAtom);

  const selectionList = useSelectionList({ schema, widgetAtom, value });
  const selectionValue = useMemo(() => {
    if (multiple) {
      const values = String(value ?? "").split(",");
      return selectionList.filter((item) =>
        values.includes(String(item.value)),
      );
    }
    return (
      selectionList.find((item) => String(item.value) === String(value)) ?? null
    );
  }, [multiple, selectionList, value]) as SelectValue<SelectionType, Multiple>;

  const handleChange = useCallback(
    (value: SelectValue<SelectionType, Multiple>) => {
      let next: string | null = null;
      if (value) {
        next = Array.isArray(value)
          ? value.map((x) => String(x.value)).join(",")
          : value.value ?? null;
      }
      setValue(next, true);
    },
    [setValue],
  );

  return (
    <FieldControl {...props}>
      <Select
        className={clsx({
          [styles.readonly]: readonly,
        })}
        autoFocus={focus}
        autoComplete={autoComplete}
        multiple={multiple}
        readOnly={readonly}
        required={required}
        invalid={invalid}
        options={selectionList}
        optionKey={optionKey}
        optionLabel={optionLabel}
        optionEqual={optionEqual}
        value={selectionValue}
        onChange={handleChange}
        renderOption={renderOption}
        renderValue={renderValue}
      />
    </FieldControl>
  );
}
