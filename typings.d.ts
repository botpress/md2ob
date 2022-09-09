export interface Fact {
  text: string
  questions: string[]
  attachments: string[]
}

export interface Subtopic {
  title: string
  description: string
  facts: Fact[]
}

export interface Topic {
  title: string
  description: string
  subtopics: Subtopic[]
}

export interface Book {
  topics: Topic[]
}
