import Markdown from 'markdown-it'

type Fact = {
  text: string
  questions: string[]
  attachments: string[]
}

type Subtopic = {
  title: string
  description: string
  facts: Fact[]
}

type Topic = {
  title: string
  description: string
  subtopics: Subtopic[]
}

type Exception = {
  type: 'warning' | 'error'
  file_index: number
  file_line_context: string
  message: string
}

type ConvertWarning = Exception & { type: 'warning' }
type ConvertError = Exception & { type: 'error' }

type SuccessfulConversion = {
  success: true
  book: Book
  warnings: ConvertWarning[]
}

type FailedConversion = {
  success: false
  errors: ConvertError[]
}

export type Book = {
  topics: Topic[]
}

export type ConversionResult = SuccessfulConversion | FailedConversion

export const LengthLimits = Object.freeze({
  titlesLength: 100,
  descriptionsLength: 500,
  factsLength: 280,
  questionsLength: 150,
  attachmentsLength: 100
})

export default function convert(...markdowns: string[]): ConversionResult {
  const warnings: ConvertWarning[] = []
  const errors: ConvertError[] = []
  const topics: Topic[] = []
  let fileIndex = 0
  let allFacts: string[] = []

  const unlink = (txt: string) => txt.replace(/\[(.+?)\]\(.+?\)/gi, '$1')
  const trim = (txt: string) => (txt || '').trim()

  for (let markdown of markdowns) {
    fileIndex++
    const md = new Markdown()
    const tokens = md.parse(markdown, {})

    let file_line_context: string[] = []
    let subtopics: Subtopic[] = []
    let topicDescription = ''
    let curEl = ''
    let h1Count = 0
    let topicTitle = ''
    let tempSubtopicTitle = ''
    let level3Facts = []
    let tempDescription = []
    let curFact: Fact | null = null

    try {
    } catch (err) {}

    const warn = (message: string) => {
      warnings.push({
        type: 'warning',
        file_index: fileIndex,
        file_line_context:
          file_line_context.filter(Boolean).slice(-10).join(' ') +
          `\n---\nCurrent Topic: ${topicTitle}\nSubtopic: ${tempSubtopicTitle}\nFact: ${curFact?.text || '-'}`,
        message
      })
    }

    const error = (message: string) => {
      errors.push({
        type: 'error',
        file_index: fileIndex,
        file_line_context:
          file_line_context.filter(Boolean).slice(-20).join(' ') +
          `\n---\nCurrent Topic: ${topicTitle}\nSubtopic: ${tempSubtopicTitle}\nFact: ${curFact?.text || '-'}`,
        message
      })
    }

    for (let i = 0; i < tokens.length; i++) {
      const cur = tokens[i]

      file_line_context.push(cur?.markup || '')
      file_line_context.push(cur?.content || '')

      if (cur?.type == 'heading_open' && cur.tag == 'h1') {
        if (!h1Count && (subtopics.length || tempSubtopicTitle)) {
          error(`Subtopic "${subtopics[0]?.title || tempSubtopicTitle}" must be enclosed inside a Topic.`)
          break
        }

        topicTitle = ''
        curEl = 'h1'
      }

      if (curEl == 'h1' && cur?.tag == 'h1' && cur.type == 'heading_close') {
        if (++h1Count >= 2) {
          error(`Only one topic can be defined in a markdown file.`)
          break
        }

        curEl = ''
        continue
      }

      if (curEl == 'h1') {
        topicTitle += unlink(cur?.content || '')
        if (topicTitle.trim().length >= LengthLimits.titlesLength) {
          error(`Topic exceeds char length limit of ${LengthLimits.titlesLength}`)
          break
        }
        continue
      }

      if ((cur?.type == 'heading_open' && cur.tag == 'h2') || i === tokens.length - 1) {
        const description = tempDescription
          .map((x) => x.trim())
          .join('. ')
          .replace(/\n/gi, '. ')
          .replace(/(\.{1,}(\s|\t){1,})/gi, '. ')

        if (tempSubtopicTitle.length) {
          if (!tempSubtopicTitle.trim().length) {
            error(`Subtopic title must be non-empty.`)
            break
          }

          if (!description.length) {
            error(`Subtopic ${tempSubtopicTitle} is missing description.`)
            break
          }

          if (description.trim().length >= LengthLimits.descriptionsLength) {
            error(`Subtopic description exceeds char length limit of ${LengthLimits.descriptionsLength}`)
            break
          }

          subtopics.push({
            title: tempSubtopicTitle,
            description,
            facts: [...level3Facts]
          })
        } else {
          if (tempDescription.length) {
            topicDescription = description

            if (description.trim().length >= LengthLimits.descriptionsLength) {
              error(`Topic description exceeds char length limit of ${LengthLimits.descriptionsLength}`)
              break
            }
          }
        }

        level3Facts = []
        tempSubtopicTitle = ''
        curEl = 'h2'
        curFact = null
        tempDescription = []
      }

      if (curEl == 'h2' && cur?.tag == 'h2' && cur.type == 'heading_close') {
        curEl = ''
        curFact = null
        continue
      }

      if (curEl == 'h2') {
        tempSubtopicTitle += unlink(cur?.content || '')
        if (tempSubtopicTitle.trim().length >= LengthLimits.titlesLength) {
          error(`Subtopic exceeds char length limit of ${LengthLimits.titlesLength}`)
          break
        }
        continue
      }

      if (cur?.type == 'inline' && cur.level == 3) {
        const factText = unlink(trim(cur.content))

        if (factText.length <= 1) {
          error(`Fact must be non-empty`)
          break
        }

        if (allFacts.includes(factText)) {
          warn(`Duplicated fact: ${factText}`)
        }

        if (factText.trim().length >= LengthLimits.factsLength) {
          error(`Fact exceeds char length limit of ${LengthLimits.factsLength}`)
          break
        }

        allFacts.push(factText)
        curFact = {
          text: factText,
          attachments: [],
          questions: []
        }
        if (!tempSubtopicTitle.trim().length) {
          error(`Facts must be contained inside subtopics, not in topics`)
          break
        }

        level3Facts.push(curFact)
      }

      if (cur?.type == 'inline' && cur.level == 6 && cur.content && curFact) {
        const question = unlink(trim(cur.content))
        curFact.questions.push(question)
        if (question.trim().length >= LengthLimits.questionsLength) {
          error(`Fact question exceeds char length limit of ${LengthLimits.questionsLength}`)
          break
        }
      } else if (
        cur?.type == 'inline' &&
        cur.level >= 5 &&
        curFact &&
        trim(cur.content).startsWith('`') &&
        trim(cur.content).endsWith('`')
      ) {
        const attachment = trim(cur.content).replace(/^`|`$/g, '')
        curFact?.attachments.push(attachment)
        if (attachment.trim().length >= LengthLimits.attachmentsLength) {
          error(`Fact attachment exceeds char length limit of ${LengthLimits.attachmentsLength}`)
          break
        }
      }

      if (cur?.type == 'inline' && cur.level == 1 && cur.content) {
        tempDescription.push(unlink(cur?.content || ''))
      }
    }

    if (!topicDescription.trim().length && !errors.length) {
      error(`Topic ${topicTitle} is missing description`)
    }

    for (let subtopic of subtopics) {
      if (!subtopic.facts.length) {
        warn(`Subtopic "${subtopic.title}" contains no fact (is empty) and will be ignored`)
      }
    }

    subtopics = subtopics.filter((x) => x.facts.length)

    if (!subtopics.length) {
      warn(`Topic is empty (no subtopics) and will be ignored`)
    } else {
      topics.push({
        title: topicTitle,
        description: topicDescription,
        subtopics
      })
    }

    for (let topic of topics) {
      const duplicatedTopics = topics.filter((x) => x !== topic && x.title === topic.title)
      if (duplicatedTopics.length) {
        error(`Topic [${topic.title}] is duplicated`)
        break
      }
    }

    for (let subtopic of subtopics) {
      const duplicatedTopics = subtopics.filter((x) => x !== subtopic && x.title === subtopic.title)
      if (duplicatedTopics.length) {
        error(`Subtopic [${topicTitle} -> ${subtopic.title}] is duplicated`)
        break
      }
    }
  }

  if (errors.length) {
    return {
      success: false,
      errors
    }
  }

  return {
    success: true,
    warnings: warnings,
    book: {
      topics: topics
    }
  }
}
