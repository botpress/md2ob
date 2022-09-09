import { Book, Topic } from './typings'

export interface BookFile {
  content: string
  location: string
}

type OpenBookFile = Book & {
  list_entities: any[]
  pattern_entities: []
  __playground?: {
    title: string
    description: string
    files: {
      [filename: string]: string
    }[]
  }
}

export default function convertObToMd({ topics, list_entities, pattern_entities, __playground }: OpenBookFile) {
  const files: BookFile[] = []

  for (const topic of topics) {
    let filename = `${topic.title}.md`

    if (__playground?.files) {
      filename =
        // @ts-ignore
        Object.keys(__playground.files).find((x) => __playground.files[x] === topic.title) || `${topic.title}.md`
    }

    files.push({
      location: filename || '',
      content: convertTopicToMd(topic)
    })
  }

  if (list_entities || pattern_entities) {
    files.push({
      location: 'entities.json',
      content: JSON.stringify({ lists: list_entities || [], patterns: pattern_entities || [] }, undefined, 2)
    })
  }

  return files
}

export const bookToMd = (file: Book) => {
  return file.topics.map((x) => convertTopicToMd(x))
}

const convertTopicToMd = (topic: Topic) => {
  const document: string[] = []

  if (topic.title) {
    document.push(`# ${topic.title}\n`)
  }

  if (topic.description) {
    document.push(topic.description)
  }

  for (const subtopic of topic.subtopics) {
    if (subtopic.title) {
      document.push(`\n## ${subtopic.title}\n`)
    }

    if (subtopic.description) {
      document.push(`${subtopic.description}\n`)
    }

    if (subtopic.facts) {
      for (const fact of subtopic.facts) {
        document.push(`- ${fact.text}`)

        for (const questiopn of fact.questions) {
          document.push(`  - > ${questiopn}`)
        }

        for (const attachment of fact.attachments) {
          document.push(`  - \`${attachment}\``)
        }
      }
    }
  }

  return document.join('\n')
}
