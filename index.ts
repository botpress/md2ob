export type IFact = {
  text: string;
  questions: string[];
  attachments: [];
};

export type ISubtopic = {
  title: string;
  description: string;
  facts: IFact[];
};

export type ITopic = {
  title: string;
  description: string;
  subtopics: ISubtopic[];
};

export type IBook = {
  topics: ITopic[];
};

export type Exception = {
  type: "warning" | "error";
  file_index: number;
  file_line: number;
  topic?: string;
  subtopic?: string;
  message: string;
  actual: string;
};

export type Result = { book: IBook; exceptions: Exception[] };

export default function convert(...markdown: string[]): Result {
  markdown.map(() => {});
  return { book: { topics: [] }, exceptions: [] };
}
