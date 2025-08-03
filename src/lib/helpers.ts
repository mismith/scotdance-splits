export function getAgeGroupName(minAge: number, maxAge: number, printYears = true) {
  const YEARS = printYears ? " Years": "";
  if (minAge === maxAge) {
    return `${minAge}${YEARS}`;
  }
  if (minAge === 0 && maxAge === Infinity) {
    return 'All Ages';
  }
  if (minAge === 0) {
    return `${maxAge}${YEARS} & Under`;
  }
  if (maxAge === Infinity) {
    return `${minAge}${YEARS} & Over`;
  }
  if (minAge === maxAge - 1) {
    return `${minAge} & ${maxAge}${YEARS}`;
  }
  return `${minAge} & Under ${maxAge + 1}${YEARS}`;
}

// Highland dance category code names
export const CATEGORY_CODE_NAMES: Record<string, string> = {
  P: "Primary",
  B: "Beginner",
  N: "Novice",
  I: "Intermediate",
  R: "Restricted Premier",
  X: "Premier",
};

// Input column configuration for CSV mapping
export type InputColumn = {
  id: string;
  name: string;
  regex: RegExp,
  required?: boolean;
  optional?: boolean;
};

export const INPUT_COLUMNS: InputColumn[] = [
  {
    id: "firstName",
    name: "First name",
    regex: /f(irst)[-_\. ]?name/i,
  },
  {
    id: "lastName",
    name: "Last name",
    regex: /l(ast)[-_\. ]?name$/i,
  },
  {
    id: "code",
    name: "Highland Scrutineer code",
    regex: /(highland)?[-_\. ]?(scrutineer(ing)?)[-_\. ]?code$/i,
    required: true,
  },
  {
    id: "timestamp",
    name: "Registration date",
    regex: /(^|(entry|registration)[-_\. ]?)date$/i,
  },
  {
    id: "location",
    name: "City / Location",
    regex: /city|suburb/i,
    optional: true,
  },
  {
    id: "region",
    name: "Province / Region",
    regex: /province|state/i,
    optional: true,
  },
  {
    id: "country",
    name: "Country",
    regex: /country/i,
    optional: true,
  },
];

// CSV download utility
export function downloadCSV(data: string, filename: string = 'output') {
  const a = document.createElement('a');
  const blob = new Blob([data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}