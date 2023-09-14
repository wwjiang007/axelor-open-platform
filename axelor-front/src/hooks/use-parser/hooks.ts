import set from "lodash/set";
import { createElement, useCallback, useMemo } from "react";

import { DataContext } from "@/services/client/data.types";
import { Hilite, Property, Schema, Widget } from "@/services/client/meta.types";

import {
  EvalContextOptions,
  createEvalContext,
  createScriptContext,
} from "./context";
import { processLegacyTemplate } from "./template-legacy";
import { processReactTemplate } from "./template-react";
import { parseAngularExp, parseExpression } from "./utils";

const isSimple = (expression: string) => {
  return !expression.includes("{{") && !expression.includes("}}");
};

function isReact(template: string | undefined | null) {
  const tmpl = template?.trim();
  return tmpl?.startsWith("<>") && tmpl?.endsWith("</>");
}

export function useExpression(expression: string) {
  return useCallback(
    (context: DataContext, options?: EvalContextOptions) => {
      const func = isSimple(expression)
        ? parseExpression(expression)
        : parseAngularExp(expression);
      const evalContext = createEvalContext(context, options);
      return func(evalContext);
    },
    [expression]
  );
}

export function useTemplate(template: string) {
  return useMemo(() => {
    const Comp = isReact(template)
      ? processReactTemplate(template)
      : processLegacyTemplate(template);
    return (props: { context: DataContext; options?: EvalContextOptions }) => {
      const _context = Object.keys(props.context).reduce((ctx, key) => {
        const value = props.context[key];
        return set(
          ctx,
          key,
          value && typeof value === "object"
            ? Array.isArray(value)
              ? [...value]
              : { ...value }
            : value
        );
      }, {} as any);
      const contextWithRecord = { ..._context, record: _context };
      const context = isReact(template)
        ? createScriptContext(contextWithRecord, props.options)
        : createEvalContext(contextWithRecord, props.options);

      return createElement(Comp, { context });
    };
  }, [template]);
}

export function useViewTemplate(
  view: { template?: string; items?: Widget[] },
  fields: Record<string, Property> = {}
) {
  const { template = "", items = [] } = view;
  const Template = useTemplate(template);
  const $getField = useViewField(items, fields);

  return useCallback(
    (props: { context: DataContext; options?: EvalContextOptions }) => {
      const { context, options } = props;
      return Template({
        context,
        options: {
          helpers: {
            $getField,
          },
          ...options,
        },
      });
    },
    [Template, $getField]
  );
}

function useViewField(items: Widget[], fields: Record<string, Property>) {
  return useCallback(
    (fieldName: string) => {
      const field = fields[fieldName];
      const widgetAttrs = items.find((x) => x.name === fieldName)?.widgetAttrs;
      return {
        ...field,
        ...widgetAttrs,
      } as Schema;
    },
    [fields, items]
  );
}

export function useHilites(hilites: Hilite[]) {
  return useCallback(
    (context: DataContext, options?: EvalContextOptions) => {
      const evalContext = createEvalContext(context, options);
      return hilites.filter((x) =>
        parseExpression(x.condition ?? "")(evalContext)
      );
    },
    [hilites]
  );
}
