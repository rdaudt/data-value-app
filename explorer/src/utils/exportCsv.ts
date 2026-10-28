// src/utils/exportCsv.ts
export function exportCsv(rows: Record<string,any>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv  = [keys.join(","),
    ...rows.map(r=>keys.map(k=>JSON.stringify(r[k]??"")).join(","))
  ].join("\n");
  const blob = new Blob([csv],{type:"text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
