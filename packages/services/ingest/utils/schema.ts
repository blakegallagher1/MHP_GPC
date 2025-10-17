export const inferSchemaFromRow = (row: Record<string, unknown>): Record<string, string> => {
  const schema: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined) {
      schema[key] = "unknown";
    } else if (Array.isArray(value)) {
      schema[key] = "array";
    } else {
      schema[key] = typeof value;
    }
  }
  return schema;
};

export const resolveLatestTimestamp = (
  rows: Array<Record<string, unknown>>,
  candidateFields: string[] = ["updated_at", "last_update", "last_edited_date"],
): string | undefined => {
  let latest: string | undefined;
  for (const row of rows) {
    for (const field of candidateFields) {
      const value = row[field];
      if (typeof value === "string") {
        if (!latest || new Date(value) > new Date(latest)) {
          latest = value;
        }
      }
    }
  }
  return latest;
};
