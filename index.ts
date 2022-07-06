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

export default function convert(...markdown: string[]): IBook {
  markdown.map(() => {});
  return { topics: [] };
}
