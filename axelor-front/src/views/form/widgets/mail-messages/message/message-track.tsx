import moment from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Formatters } from "@/utils/format";
import { toKebabCase } from "@/utils/names";
import { i18n } from "@/services/client/i18n";
import { Property } from "@/services/client/meta.types";
import { MessageTrack } from "./types";
import { Box } from "@axelor/ui";
import { FormProps } from "@/views/form/builder";
import styles from "./message-track.module.scss";

moment.extend(relativeTime);

export function formatter(_item: MessageTrack, field?: Property) {
  const item = { ..._item };

  function format(value?: MessageTrack["value"]) {
    if (!value) {
      return value;
    }
    if (
      field &&
      !["MANY_TO_ONE", "ONE_TO_MANY", "ONE_TO_ONE", "MANY_TO_MANY"].includes(
        field.type
      )
    ) {
      var formatter = (Formatters as any)[toKebabCase(field.type)];
      if (formatter) {
        return formatter(value, {
          props: field,
          context: { [field.name]: value },
        });
      }
    }
    if (value === "True") return i18n.get("True");
    if (value === "False") return i18n.get("False");
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value)) {
      return moment(value).format("DD/MM/YYYY HH:mm");
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return moment(value).format("DD/MM/YYYY");
    }
    if (value === "0E-10") value = "0.000000000000";
    return value;
  }
  item.displayValue = item.displayValue || format(item.value);
  item.oldDisplayValue = item.oldDisplayValue || format(item.oldValue);
  if (item.oldDisplayValue !== undefined) {
    item.displayValue =
      item.oldDisplayValue +
      " → " +
      (item.displayValue ||
        `<span class="${styles["empty-value"]}">${i18n.get("None")}</span>`);
  }

  return { ...item };
}

function MessageTrackComponent({
  track,
  fields,
}: {
  track: MessageTrack;
  fields?: FormProps["fields"];
}) {
  const { title, displayValue } = formatter(
    track,
    fields && fields[track?.name]
  );
  return (
    <li className={styles["track-field"]}>
      <Box d="flex" alignItems="center">
        <Box as="p" mb={0} me={1} fontWeight="bold">
          {i18n.get(title)} {" : "}
        </Box>
        {displayValue && (
          <span dangerouslySetInnerHTML={{ __html: displayValue }} />
        )}
      </Box>
    </li>
  );
}

export function MessageTracks({
  data,
  fields,
}: {
  data: MessageTrack[];
  fields?: FormProps["fields"];
}) {
  return (
    <Box as="ul" m={0} p={0} pe={1}>
      {data.map((track, index) => (
        <MessageTrackComponent key={index} track={track} fields={fields} />
      ))}
    </Box>
  );
}
