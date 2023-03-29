import React, { useRef } from "react";
import clsx from "clsx";
import moment from "dayjs";
import { Box, Select as AxSelect, Button, Input } from "@axelor/ui";
import { ReactComponent as CaretDownFillIcon } from "bootstrap-icons/icons/caret-down-fill.svg";
import { toKebabCase } from "@/utils/names";
import { useDataStore } from "@/hooks/use-data-store";
import { DataStore } from "@/services/client/data-store";
import styles from "./components.module.css";

function TextField(props) {
  return (
    <Input
      {...props}
      value={props.value ?? ""}
      onChange={(e) => props.onChange(e.target.value)}
    />
  );
}

function DateTimePicker(props) {
  return (
    <TextField
      {...props}
      type="date"
      value={
        props.value ? moment(props.value).format("YYYY-MM-DD") : props.value
      }
    />
  );
}

function NumberField(props) {
  return <TextField {...props} type="number" />;
}

export function Select({ value, options, onChange, className, ...props }) {
  return (
    <Box
      as={AxSelect}
      classNamePrefix="ax-select"
      className={clsx(styles.select, className)}
      me={1}
      isClearable={false}
      options={options}
      optionLabel="title"
      optionValue="name"
      onChange={(option) => onChange(option && option.name)}
      value={options.find((o) => o.name === value) || null}
      icons={[
        {
          id: "more",
          icon: CaretDownFillIcon,
        },
      ]}
      {...props}
    />
  );
}

export function ButtonLink({ title, ...rest }) {
  return (
    title && (
      <Button
        variant="link"
        size="sm"
        me={1}
        className={styles.button}
        {...rest}
      >
        {title}
      </Button>
    )
  );
}

export function BooleanRadio({ name, onChange, value: valueProp, data }) {
  return (
    <Box d="flex" alignItems="center" ms={1} me={1}>
      {data.map(({ value, label }, index) => (
        <Box d="flex" alignItems="center" key={index} me={2}>
          <Input
            type="radio"
            value={value}
            checked={value === valueProp}
            onChange={onChange}
            name={name}
            m={0}
            me={1}
          />
          <Box as="p" mb={0}>
            {label}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export function BooleanCheckBox({
  name,
  value,
  onChange,
  title,
  inline = false,
  isDisabled,
  classes,
  ...rest
}) {
  if (inline) {
    return (
      <Input
        type="checkbox"
        checked={Boolean(value)}
        onChange={({ target: { checked } }) => onChange(checked)}
        value={name}
        name={name}
        disabled={isDisabled}
        m={0}
        me={1}
        {...rest}
      />
    );
  }
  return (
    <Box d="flex" alignItems="center">
      <Input
        type="checkbox"
        checked={Boolean(value)}
        onChange={({ target: { checked } }) => onChange({ name, checked })}
        value={name}
        name={name}
        m={0}
        me={1}
        {...rest}
      />
      <Box as="p" mb={0}>
        {title}
      </Box>
    </Box>
  );
}

export function SimpleButton({ title, hide, ...rest }) {
  return (
    <Button
      me={1}
      outline
      size="sm"
      variant="primary"
      {...rest}
      {...(hide ? { d: "none" } : {})}
    >
      {title}
    </Button>
  );
}

export function SimpleWidget({
  component: Component,
  operator,
  onChange,
  value,
  value2,
  style,
  t,
  ...rest
}) {
  if (["=", "!=", ">", ">=", "<", "<=", "like", "notLike"].includes(operator)) {
    return (
      <Component
        name="value"
        onChange={(value) => onChange({ name: "value", value: value })}
        value={value}
        {...rest}
      />
    );
  }

  if (["between", "notBetween"].includes(operator)) {
    return (
      <>
        <Component
          name="value"
          style={{ marginRight: 8, ...style }}
          onChange={(value) => onChange({ name: "value", value })}
          value={value}
          {...rest}
        />

        <Component
          name="value2"
          onChange={(value) => onChange({ name: "value2", value })}
          value={value2}
          {...rest}
        />
      </>
    );
  }

  return null;
}

export function RelationalWidget({ operator, onChange, ...rest }) {
  const { field } = rest;
  const dataStore = useRef(new DataStore(field.target, {})).current;
  const options = useDataStore(dataStore, (res) => res.records);

  const fetchData = React.useCallback(
    async () => dataStore.search({}),
    [dataStore]
  );

  if (["like", "notLike"].includes(operator)) {
    return (
      <TextField
        name="value"
        onChange={(value) => onChange({ name: "value", value: value })}
        {...rest}
      />
    );
  } else if (["=", "in", "notIn"].includes(operator)) {
    const { isMulti = operator !== "=", field, value, className } = rest;
    const { targetName } = field;

    return (
      <AxSelect
        placeholder={operator === "=" ? rest.placeholder : ""}
        className={clsx(styles.select, className)}
        optionLabel={targetName}
        optionValue="id"
        name="value"
        value={value}
        isMulti={isMulti}
        options={options}
        onFocus={fetchData}
        onChange={(value) =>
          onChange({
            name: "value",
            value: Array.isArray(value)
              ? value.map((x) => ({ id: x.id, [targetName]: x[targetName] }))
              : value && { id: value.id, [targetName]: value[targetName] },
          })
        }
      />
    );
  }
}

export function Widget({ type, operator, onChange, value, ...rest }) {
  const props = {
    operator,
    value: value.value,
    value2: value.value2,
    timeUnit: value.timeUnit,
    onChange,
    ...rest,
  };

  switch (toKebabCase(type)) {
    case "one-to-one":
    case "many-to-one":
    case "many-to-many":
    case "one-to-many":
      return <RelationalWidget {...props} />;
    case "date":
    case "time":
    case "datetime":
      const dateFormats = {
        date: ["YYYY-MM-DD", "MM/DD/YYYY"],
        datetime: ["YYYY-MM-DD", "MM/DD/YYYY"],
        time: ["HH:mm", "LT"],
      };
      const [format, displayFormat] = dateFormats[type];
      const { t, value, value2, timeUnit, onChange } = props;

      function renderSelect() {
        const props = {
          isClearOnDelete: false,
          name: "timeUnit",
          value: timeUnit,
          onChange: (value) => onChange({ name: "timeUnit", value }),
          options: ["day", "week", "month", "quarter", "year"].map((name) => ({
            name,
            title: t(["$inCurrent"].includes(operator) ? name : `${name}s`),
          })),
        };
        return <Select {...props} />;
      }

      if (["$inPast", "$inNext"].includes(operator)) {
        return (
          <>
            <TextField
              name="value"
              onChange={(value) => onChange({ name: "value", value: value })}
              value={value}
              {...rest}
            />
            {renderSelect()}
          </>
        );
      }

      if (["$inCurrent"].includes(operator)) {
        return renderSelect();
      }

      return (
        <SimpleWidget
          {...props}
          format={displayFormat}
          value={value ? moment(value, format) : null}
          value2={value2 ? moment(value2, format) : null}
          onChange={({ name, value }) => onChange({ name, value })}
          {...{ component: DateTimePicker, type: "date" }}
        />
      );
    case "integer":
    case "long":
    case "decimal":
      return <SimpleWidget {...props} {...{ component: NumberField, type }} />;
    case "enum":
      const options = rest.field.selectionList.map(
        ({ title, value, data }) => ({
          name: (data && data.value) || value,
          title: title,
        })
      );
      return <SimpleWidget {...props} {...{ component: Select, options }} />;
    default:
      return <SimpleWidget {...props} {...{ component: TextField }} />;
  }
}
