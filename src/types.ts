export interface Template {
  id: string;
  title: string;
  content: string;
  category: string;
  usageCount: number;
  createdAt: string;
  variablePresets?: Record<string, string[]>;
  order?: number;
}

export interface VariableValue {
  [key: string]: string;
}
