/*
 * Table output of the list commands, ported from @oclif/core 2.1.4 (lib/cli-ux/styled/table.js, screen.js),
 * Which oclif 4 removed. Scripts parse this output, so it must stay byte-identical.
 *
 * Copyright (c) 2018 Salesforce.com, inc. MIT License: Permission is hereby granted, free of charge, to any
 * person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the
 * Software without restriction, including without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions: The above copyright notice and this permission notice
 * shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS",
 * WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
 */
import { Flags } from "@oclif/core";
import { inspect, styleText } from "util";
// js-yaml 4+ quotes and folds strings differently: 3.x keeps the YAML output byte-identical
import { safeDump } from "js-yaml";
// string-width 5+ is ESM-only; 4.2.3 is the last CommonJS major
import stringWidth from "string-width";
import { orderBy } from "natural-orderby";

export interface TableColumn {
  header?: string;
  extended?: boolean;
  minWidth?: number;
  get?: (row: any) => unknown;
}

interface TableSettings {
  columns?: string;
  sort?: string;
  filter?: string;
  csv?: boolean;
  output?: string;
  extended?: boolean;
  "no-truncate"?: boolean;
  "no-header"?: boolean;
  title?: string;
  printLine?: (s: string) => void;
}

// commands pass all their parsed flags
export type TableOptions = TableSettings & Record<string, unknown>;

interface ResolvedColumn {
  extended: boolean;
  get: (row: any) => unknown;
  header: string;
  key: string;
  minWidth: number;
}

const capitalize = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "");
const sumBy = <T>(arr: T[], fn: (i: T) => number): number => arr.reduce((sum, i) => sum + fn(i), 0);

const stdTermWidth = (): number => {
  const columns = Number.parseInt(process.env.OCLIF_COLUMNS as string, 10);
  if (columns) return columns;
  if (!process.stdout.isTTY) return 80;
  const width = process.stdout.getWindowSize()[0];
  if (width < 1) return 80;
  if (width < 40) return 40;
  return width;
};

const getWidestColumnWith = (data: Record<string, string>[], columnKey: string): number =>
  data.reduce((previous, current) => {
    const d = current[columnKey];
    // convert multi-line cell to single longest line for width calculations
    const manyLines = d.split("\n");
    return Math.max(previous, manyLines.length > 1 ? Math.max(...manyLines.map((r) => stringWidth(r))) : stringWidth(d));
  }, 0);

// Same check as chalk 4, which oclif 2 used: styles only when stdout is a terminal
const bold = (s: string): string => styleText("bold", s, { stream: process.stdout });

class Table {
  private columns: ResolvedColumn[];
  private readonly options: Required<Pick<TableSettings, "no-header" | "no-truncate" | "printLine">> &
    Omit<TableSettings, "csv"> & { rowStart: string };

  constructor(private data: any[], columns: Record<string, TableColumn>, options: TableOptions = {}) {
    this.columns = Object.keys(columns).map((key) => {
      const col = columns[key];
      // turn null and undefined into empty strings by default
      const get = col.get ?? ((row: any) => row[key] ?? "");
      const header = typeof col.header === "string" ? col.header : capitalize(key.replace(/_/g, " "));
      const minWidth = Math.max(col.minWidth ?? 0, stringWidth(header) + 1);
      return { extended: col.extended ?? false, get, header, key, minWidth };
    });

    const { columns: cols, filter, csv, output, extended, sort, title, printLine } = options;
    this.options = {
      columns: cols,
      output: csv ? "csv" : output,
      extended,
      filter,
      "no-header": options["no-header"] ?? false,
      "no-truncate": options["no-truncate"] ?? false,
      printLine: printLine ?? ((s: string) => process.stdout.write(s + "\n")),
      rowStart: " ",
      sort,
      title,
    };
  }

  display(): void {
    // build table rows from input array data
    let rows: Record<string, string>[] = this.data.map((d) => {
      const row: Record<string, string> = {};
      for (const col of this.columns) {
        let val = col.get(d);
        if (typeof val !== "string") val = inspect(val, { breakLength: Number.POSITIVE_INFINITY });
        row[col.key] = val as string;
      }
      return row;
    });

    // filter rows
    if (this.options.filter) {
      // eslint-disable-next-line prefer-const
      let [header, regex] = this.options.filter.split("=");
      const isNot = header[0] === "-";
      if (isNot) header = header.slice(1);
      const col = this.findColumnFromHeader(header);
      if (!col || !regex) throw new Error("Filter flag has an invalid value");
      rows = rows.filter((d) => {
        const re = new RegExp(regex);
        const val = d[col.key];
        const match = val.match(re);
        return isNot ? !match : match;
      });
    }

    // sort rows
    if (this.options.sort) {
      const sorters = this.options.sort.split(",");
      const sortHeaders = sorters.map((k) => (k[0] === "-" ? k.slice(1) : k));
      const sortKeys = this.filterColumnsFromHeaders(sortHeaders).map((c) => (v: Record<string, string>) => v[c.key]);
      const sortKeysOrder = sorters.map((k) => (k[0] === "-" ? "desc" : "asc")) as ("asc" | "desc")[];
      rows = orderBy(rows, sortKeys, sortKeysOrder);
    }

    // and filter columns
    if (this.options.columns) {
      const filters = this.options.columns.split(",");
      this.columns = this.filterColumnsFromHeaders(filters);
    } else if (!this.options.extended) {
      // show extended columns/properties
      this.columns = this.columns.filter((c) => !c.extended);
    }

    this.data = rows;
    switch (this.options.output) {
      case "csv":
        this.outputCSV();
        break;
      case "json":
        this.outputJSON();
        break;
      case "yaml":
        this.outputYAML();
        break;
      default:
        this.outputTable();
    }
  }

  private findColumnFromHeader(header: string): ResolvedColumn | undefined {
    return this.columns.find((c) => c.header.toLowerCase() === header.toLowerCase());
  }

  private filterColumnsFromHeaders(filters: string[]): ResolvedColumn[] {
    // unique
    filters = [...new Set(filters)];
    const cols: ResolvedColumn[] = [];
    for (const f of filters) {
      const c = this.columns.find((col) => col.header.toLowerCase() === f.toLowerCase());
      if (c) cols.push(c);
    }
    return cols;
  }

  private getCSVRow(d: Record<string, string>): string[] {
    const values = this.columns.map((col) => d[col.key] || "");
    const lineToBeEscaped = values.find((e) => e.includes('"') || e.includes("\n") || e.includes("\r\n") || e.includes("\r") || e.includes(","));
    return values.map((e) => (lineToBeEscaped ? `"${e.replace('"', '""')}"` : e));
  }

  private resolveColumnsToObjectArray(): Record<string, string>[] {
    const { data, columns } = this;
    return data.map((d) => columns.reduce((obj, col) => ({ ...obj, [col.key]: d[col.key] ?? "" }), {}));
  }

  private outputJSON(): void {
    this.options.printLine(JSON.stringify(this.resolveColumnsToObjectArray(), undefined, 2));
  }

  private outputYAML(): void {
    this.options.printLine(safeDump(this.resolveColumnsToObjectArray()));
  }

  private outputCSV(): void {
    const { data, columns, options } = this;
    if (!options["no-header"]) {
      options.printLine(columns.map((c) => c.header).join(","));
    }
    for (const d of data) {
      options.printLine(this.getCSVRow(d).join(","));
    }
  }

  private outputTable(): void {
    const { data, options } = this;
    // find max width for each column
    const columns = this.columns.map((c) => {
      const columnMaxWidth = Math.max(stringWidth(".".padEnd(c.minWidth - 1)), stringWidth(c.header), getWidestColumnWith(data, c.key)) + 1;
      return { ...c, maxWidth: columnMaxWidth, width: columnMaxWidth };
    });
    const maxWidth = stdTermWidth() - 2;

    const shouldShorten = () => {
      // don't shorten if full mode
      if (options["no-truncate"] || (!process.stdout.isTTY && !process.env.CLI_UX_SKIP_TTY_CHECK)) return;
      // don't shorten if there is enough screen width
      const dataMaxWidth = sumBy(columns, (c) => c.width);
      const overWidth = dataMaxWidth - maxWidth;
      if (overWidth <= 0) return;
      // not enough room, short all columns to minWidth
      for (const col of columns) {
        col.width = col.minWidth;
      }
      // if sum(minWidth's) is greater than term width nothing can be done, so display all as minWidth
      const dataMinWidth = sumBy(columns, (c) => c.minWidth);
      if (dataMinWidth >= maxWidth) return;
      // some wiggle room left, add it back to "needy" columns
      let wiggleRoom = maxWidth - dataMinWidth;
      const needyCols = columns.map((c) => ({ key: c.key, needs: c.maxWidth - c.width })).sort((a, b) => a.needs - b.needs);
      for (const { key, needs } of needyCols) {
        if (!needs) continue;
        const col = columns.find((c) => key === c.key);
        if (!col) continue;
        if (wiggleRoom > needs) {
          col.width = col.width + needs;
          wiggleRoom -= needs;
        } else if (wiggleRoom) {
          col.width = col.width + wiggleRoom;
          wiggleRoom = 0;
        }
      }
    };
    shouldShorten();

    // print table title
    if (options.title) {
      options.printLine(options.title);
      options.printLine(
        "".padEnd(
          columns.reduce((sum, col) => sum + col.width, 1),
          "="
        )
      );
      options.rowStart = "| ";
    }

    // print headers
    if (!options["no-header"]) {
      let headers = options.rowStart;
      for (const col of columns) {
        headers += col.header.padEnd(col.width);
      }
      options.printLine(bold(headers));
      let dividers = options.rowStart;
      for (const col of columns) {
        const divider = "".padEnd(col.width - 1, "─") + " ";
        dividers += divider.padEnd(col.width);
      }
      options.printLine(bold(dividers));
    }

    // print rows, including multi-line cells
    for (const row of data) {
      let numOfLines = 1;
      for (const col of columns) {
        const lines = row[col.key].split("\n").length;
        if (lines > numOfLines) numOfLines = lines;
      }
      for (const i of [...new Array(numOfLines).keys()]) {
        let l = options.rowStart;
        for (const col of columns) {
          const width = col.width;
          const d = row[col.key].split("\n")[i] || "";
          const visualWidth = stringWidth(d);
          const colorWidth = d.length - visualWidth;
          let cell = d.padEnd(width + colorWidth);
          if (cell.length - colorWidth > width || visualWidth === width) {
            cell = cell.slice(0, width - 2) + "… ";
          }
          l += cell;
        }
        options.printLine(l);
      }
    }
  }
}

export const table = (data: any[], columns: Record<string, TableColumn>, options: TableOptions = {}): void => {
  new Table(data, columns, options).display();
};

// The flags oclif 2's ux.table.flags() added to every list command
export const tableFlags = (): any => ({
  columns: Flags.string({ exclusive: ["extended"], description: "only show provided columns (comma-separated)" }),
  sort: Flags.string({ description: "property to sort by (prepend '-' for descending)" }),
  filter: Flags.string({ description: "filter property by partial string matching, ex: name=foo" }),
  csv: Flags.boolean({ exclusive: ["no-truncate"], description: "output is csv format [alias: --output=csv]" }),
  output: Flags.string({
    exclusive: ["no-truncate", "csv"],
    description: "output in a more machine friendly format",
    options: ["csv", "json", "yaml"],
  }),
  extended: Flags.boolean({ exclusive: ["columns"], char: "x", description: "show extra columns" }),
  "no-truncate": Flags.boolean({ exclusive: ["csv"], description: "do not truncate output to fit screen" }),
  "no-header": Flags.boolean({ exclusive: ["csv"], description: "hide table header from output" }),
});
