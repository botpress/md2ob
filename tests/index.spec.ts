import assert from 'assert'
import { bookToMd } from '../ob2md'
import convert, { LengthLimits } from '../md2ob'
import { Book } from '../typings'

const assertIncludes = (str1: string, str2: string, message?: string) => {
  const wrap = message ? ` (${message})` : ''
  assert(str1.toLowerCase().includes(str2.toLowerCase()), `Expected "${str1}" to include "${str2}".${wrap}`)
}

describe('success: parsing features', () => {
  it('minimum viable book', () => {
    const content = `# Topic Name

Topic description.

## Subtopic Name

Subtopic description.

- Fact 1
- Fact 2`
    const result = convert(content)
    assert(result.success === true, new Error('Must be successful'))
    assert(result.warnings.length === 0, 'no warnings')
    assert.deepEqual(result.book, <Book>{
      topics: [
        {
          title: 'Topic Name',
          description: 'Topic description.',
          subtopics: [
            {
              title: 'Subtopic Name',
              description: 'Subtopic description.',
              facts: [
                {
                  text: 'Fact 1',
                  attachments: [],
                  questions: []
                },
                { text: 'Fact 2', attachments: [], questions: [] }
              ]
            }
          ]
        }
      ]
    })

    assert.deepEqual(bookToMd(result.book), [content])
  })

  it('complex book', () => {
    const content = `# Topic Name
  Topic description.
  ## Subtopic1 Name
  Subtopic1 description.
  - Fact 1
      - \`fact 1 attachment 1\`
  - Fact 2
      - > fact 2 question 1
  ## Subtopic2 Name
  Subtopic2 description.
  - Fact 3
      - > fact 3 question 1
      - > fact 3 question 2
  - Fact 4
      - \`fact 4 attachment 1\`
      - \`fact 4 attachment 2\`
  ## Subtopic3 Name
  Subtopic3 description.
  - Fact 5
      - \`fact 5 attachment 1\`
      - \`fact 5 attachment 2\`
      - > fact 5 question 1
      - \`fact 5 attachment 3\`
      - > fact 5 question 2
      - \`fact 5 attachment 4\`
  - Fact 6`
    const result = convert(content)
    assert(result.success === true, new Error('Must be successful'))
    assert(result.warnings.length === 0, 'no warnings')

    assert.deepEqual(result.book, <Book>{
      topics: [
        {
          title: 'Topic Name',
          description: 'Topic description.',
          subtopics: [
            {
              title: 'Subtopic1 Name',
              description: 'Subtopic1 description.',
              facts: [
                {
                  text: 'Fact 1',
                  attachments: ['fact 1 attachment 1'],
                  questions: []
                },
                {
                  text: 'Fact 2',
                  attachments: [],
                  questions: ['fact 2 question 1']
                }
              ]
            },
            {
              title: 'Subtopic2 Name',
              description: 'Subtopic2 description.',
              facts: [
                {
                  text: 'Fact 3',
                  attachments: [],
                  questions: ['fact 3 question 1', 'fact 3 question 2']
                },
                {
                  text: 'Fact 4',
                  attachments: ['fact 4 attachment 1', 'fact 4 attachment 2'],
                  questions: []
                }
              ]
            },
            {
              title: 'Subtopic3 Name',
              description: 'Subtopic3 description.',
              facts: [
                {
                  text: 'Fact 5',
                  attachments: [
                    'fact 5 attachment 1',
                    'fact 5 attachment 2',
                    'fact 5 attachment 3',
                    'fact 5 attachment 4'
                  ],
                  questions: ['fact 5 question 1', 'fact 5 question 2']
                },
                {
                  text: 'Fact 6',
                  questions: [],
                  attachments: []
                }
              ]
            }
          ]
        }
      ]
    })
  })

  it('processes multiple topics', () => {
    const content = (n: number) => `# Topic Name ${n}

Topic description.

## Subtopic Name

Subtopic description.

- Fact 1
- Fact 2`

    const result = convert(...[1, 2, 3, 4, 5, 6, 7].map(content))
    assert(result.success === true, 'test should pass')
    assert(result.book.topics!.length === 7, 'should be 7 topics')
    assert.deepEqual(bookToMd(result.book), [1, 2, 3, 4, 5, 6, 7].map(content))
  })
})

describe('success: tricky book formatting', () => {
  it('resists to different formatting', () => {
    const content = `\ 
\t\t
# Topic Name\ \ \
\t\t
Topic description.\t

## \ Subtopic Name\t

Subtopic description that
takes more than one line.

\t
\ - Fact 1\t
\ \ \ - > question 1\ \

\ \ \ \t- > question 2

\ \ - Fact 2
\t\ `
    const result = convert(content)
    assert(result.success === true, new Error('Must be successful'))
    assert(result.warnings.length === 0, 'no warnings')
    assert.deepEqual(result.book, <Book>{
      topics: [
        {
          title: 'Topic Name',
          description: 'Topic description.',
          subtopics: [
            {
              title: 'Subtopic Name',
              description: 'Subtopic description that. takes more than one line.',
              facts: [
                {
                  text: 'Fact 1',
                  attachments: [],
                  questions: ['question 1', 'question 2']
                },
                { text: 'Fact 2', attachments: [], questions: [] }
              ]
            }
          ]
        }
      ]
    })

    const formatted = `# Topic Name

Topic description.

## Subtopic Name

Subtopic description that. takes more than one line.

- Fact 1
  - > question 1
  - > question 2
- Fact 2`

    assert.deepEqual(bookToMd(result.book), [formatted])
  })

  it('removes new lines from descriptions and joins using dots', () => {
    const content = `# Topic Name
Line1

Line2.

## \ Subtopic Name\t

Line1.
Line2.
\t
Line3
\t Line4.

  - Fact 1
  - Fact 2

`
    const result = convert(content)
    assert(result.success === true, new Error('Must be successful'))
    assert(result.warnings.length === 0)
    assert.deepEqual(result.book, <Book>{
      topics: [
        {
          title: 'Topic Name',
          description: 'Line1. Line2.',
          subtopics: [
            {
              title: 'Subtopic Name',
              description: 'Line1. Line2. Line3. Line4.',
              facts: [
                {
                  text: 'Fact 1',
                  attachments: [],
                  questions: []
                },
                { text: 'Fact 2', attachments: [], questions: [] }
              ]
            }
          ]
        }
      ]
    })
  })
})

describe('warnings: conversion warnings', () => {
  it('warns on empty topic', () => {
    const content = `# Topic Name
Topic description.`
    const result = convert(content)
    assert(result.success === true, new Error('Must be successful'))
    assert(result.warnings.length > 0)
    assert.match(result.warnings[0]!.message, /empty/)
    assert(result.book.topics.length === 0)
  })

  it('warns on empty subtopic', () => {
    const content = `# Topic Name
Topic description.
## Subtopic
Subtopic description.
## Subtopic2
Subtopic description.
- Fact 1`
    const result = convert(content)
    assert(result.success === true, new Error('Must be successful'))
    assert(result.warnings.length === 1, 'expecting one warning')

    assert.match(result.warnings[0]!.message, /empty/)
    assert(result.book.topics.length > 0)
    assert(result.book.topics[0]!.subtopics.length === 1)
    assert.match(result.book.topics[0]!.subtopics[0]!.title, /Subtopic2/)
  })

  describe('warns on duplicated facts', () => {
    const content1 = `# Topic Name
Topic description.
## Subtopic Name
Subtopic description.
- Duplicated same subtopic
- Duplicated same subtopic
- Unique`

    const content2a = `# Topic Name
Topic description.
## Subtopic Name
Subtopic description.
- Duplicated different topic
- Unique`

    const content2b = `# Topic Name 2
Topic description.
## Subtopic Name
Subtopic description.
- Duplicated different topic`

    const content3 = `# Topic Name
Topic description.
## Subtopic Name
Subtopic description.
- Duplicated different subtopic
- Unique
## Subtopic 2
Subtopic description.
- Duplicated different subtopic
  `

    for (let [test, ...contents] of [
      ['same subtopic', content1],
      ['different subtopic', content2a, content2b],
      ['different topics', content3]
    ]) {
      const result = convert(...contents)

      it('duplicated: ' + test, () => {
        assert(result.success === true, new Error('Must be successful'))
        assert(result.warnings.length === 1, 'must have 1 warning')
        assert(
          result.warnings[0]!.message.toLowerCase().includes('duplicated') === true,
          'warning must contain "duplicated"'
        )
        assert(result.book!.topics.length >= 1, 'there must be at least 1 topic')
        assert(result.book!.topics[0]!.subtopics.length >= 1, 'there must be at least 1 subtopic')
        assert(result.book!.topics[0]!.subtopics[0]!.facts.length >= 2, 'there must be at least 2 facts')
      })
    }
  })
})

describe('errors: invalid book structures', () => {
  const missingTopicDesc = `# Topic Name
## Subtopic Name
Subtopic description.
- Fact 1`

  const missingSubtopicDesc = `# Topic Name
Topic description.
## Subtopic Name
- Fact 1`

  for (let [test, ...contents] of [
    ['missing topic description', missingTopicDesc],
    ['missing subtopic description', missingSubtopicDesc]
  ]) {
    const result = convert(...contents)

    it('error missing desc: ' + test, () => {
      assert(result.success === false, new Error('Must fail'))
      assert(result.errors.length === 1, 'must have 1 error')
      assertIncludes(result.errors[0]!.file_line_context, 'Topic Name')
      assertIncludes(result.errors[0]!.message, 'description')
    })
  }

  it('errors orphane subtopic', () => {
    const content = `## Orphane Subtopic
  Subtopic description.
  - Fact 1
  
  ## Subtopic Name
  Subtopic description
  - Fact 2
  
  # Topic Name
  Topic description
  `

    const result = convert(content)

    assert(result.success === false, new Error('Must fail'))
    assert(result.errors.length === 1, 'must have 1 error ' + result.errors.length)
    assertIncludes(result.errors[0]!.message, 'enclosed inside a topic')
    assertIncludes(result.errors[0]!.file_line_context, 'Orphane Subtopic')
  })

  it('multiple topics in same file', () => {
    const content = `# Topic Name
Topic description.
## Subtopic Name
Subtopic description
- Fact 1
  
# Second Topic
Topic description
## Subtopic2 Name
Subtopic description
-Fact 2
  `

    const result = convert(content)

    assert(result.success === false, new Error('Must fail'))
    assert(result.errors.length === 1, 'must have 1 error ' + result.errors.length)
    assertIncludes(result.errors[0]!.message, 'one topic')
    assertIncludes(result.errors[0]!.file_line_context, 'Second Topic')
  })

  it('error on facts inside topic', () => {
    const content = `# Topic Name
Topic description.
- Fact 1
## Subtopic Name
Subtopic description
- Fact 2`
    const result = convert(content)
    assert(result.success === false, new Error('Must fail'))
    assert(result.errors.length === 1, 'must have 1 error')
    assertIncludes(result.errors[0]!.file_line_context, 'Topic Name')
    assertIncludes(result.errors[0]!.message, 'fact')
  })
})

describe('errors: book elements format', () => {
  it('errors on empty fact', () => {
    const content = `# Topic Name
Topic description.
## Subtopic Name
Subtopic description
- Fact 1
- \t.   \t
- Fact 3`
    const result = convert(content)
    assert(result.success === false, new Error('Must fail'))
    assert(result.errors.length === 1, 'must have 1 error')
    assertIncludes(result.errors[0]!.file_line_context, 'Subtopic Name')
    assertIncludes(result.errors[0]!.message, 'empty')
  })
  it('errors on lengthy topic title', () => {
    const content = `# Topic Name${'e'.repeat(LengthLimits.titlesLength)}
Topic description.
## Subtopic Name
Subtopic description
- Fact 1`
    const result = convert(content)
    assert(result.success === false, new Error('Must fail'))
    assert(result.errors.length === 1, 'must have 1 error')
    assertIncludes(result.errors[0]!.file_line_context, 'Topic Name')
    assertIncludes(result.errors[0]!.message, 'length')
  })
  it('errors on lengthy subtopic title', () => {
    const content = `# Topic Name
Topic description.
## Subtopic Name${'e'.repeat(LengthLimits.titlesLength)}
Subtopic description
- Fact 1`
    const result = convert(content)
    assert(result.success === false, new Error('Must fail'))
    assert(result.errors.length === 1, 'must have 1 error')
    assertIncludes(result.errors[0]!.file_line_context, 'Subtopic Name')
    assertIncludes(result.errors[0]!.message, 'length')
  })
  it('errors on lengthy topic description', () => {
    const content = `# Topic Name
Topic description.${'e'.repeat(LengthLimits.descriptionsLength)}
## Subtopic Name
Subtopic description
- Fact 1`
    const result = convert(content)
    assert(result.success === false, new Error('Must fail'))
    assert(result.errors.length === 1, 'must have 1 error')
    assertIncludes(result.errors[0]!.file_line_context, 'Topic Name')
    assertIncludes(result.errors[0]!.message, 'length')
  })
  it('errors on lengthy subtopic description', () => {
    const content = `# Topic Name
Topic description.
## Subtopic Name
Subtopic description${'e'.repeat(LengthLimits.descriptionsLength)}
- Fact 1`
    const result = convert(content)
    assert(result.success === false, new Error('Must fail'))
    assert(result.errors.length === 1, 'must have 1 error')
    assertIncludes(result.errors[0]!.file_line_context, 'Subtopic Name')
    assertIncludes(result.errors[0]!.message, 'length')
  })
  it('errors on lengthy fact', () => {
    const content = `# Topic Name
Topic description.
## Subtopic Name
Subtopic description
- Fact 1${'e'.repeat(LengthLimits.factsLength)}`
    const result = convert(content)
    assert(result.success === false, new Error('Must fail'))
    assert(result.errors.length === 1, 'must have 1 error')
    assertIncludes(result.errors[0]!.file_line_context, 'Fact 1')
    assertIncludes(result.errors[0]!.message, 'length')
  })
  it('errors on lengthy fact question', () => {
    const content = `# Topic Name
Topic description.
## Subtopic Name
Subtopic description
- Fact 1
  - > e${'e'.repeat(LengthLimits.questionsLength)}`
    const result = convert(content)
    assert(result.success === false, new Error('Must fail'))
    assert(result.errors.length === 1, 'must have 1 error')
    assertIncludes(result.errors[0]!.file_line_context, 'Fact 1')
    assertIncludes(result.errors[0]!.message, 'length')
  })
  it('errors on lengthy fact attachment', () => {
    const content = `# Topic Name
Topic description.
## Subtopic Name
Subtopic description
- Fact 1
  - \`e${'e'.repeat(LengthLimits.attachmentsLength)}\``
    const result = convert(content)
    assert(result.success === false, new Error('Must fail'))
    assert(result.errors.length === 1, 'must have 1 error')
    assertIncludes(result.errors[0]!.file_line_context, 'Fact 1')
    assertIncludes(result.errors[0]!.message, 'length')
  })
})

describe('errors: book conflicts', () => {
  it('errors on duplicated topic name', () => {
    const content = `# Topic Name
Topic description.
## Subtopic Name
Subtopic description
- Fact 1`
    const result = convert(content, content.replace('Subtopic Name', 'Subtopic2 Name'))
    assert(result.success === false, new Error('Must fail'))
    assert(result.errors.length === 1, 'must have 1 error')
    assertIncludes(result.errors[0]!.message, 'duplicated')
  })
  it('errors on duplicated topic+subtopic name', () => {
    const content = `# Topic Name
Topic description.
## Subtopic Name
Subtopic description
- Fact 1
## Subtopic Name
Subtopic description
- Fact 2`
    const result = convert(content)
    assert(result.success === false, new Error('Must fail'))
    assert(result.errors.length === 1, 'must have 1 error')
    assertIncludes(result.errors[0]!.message, 'duplicated')
  })
})
