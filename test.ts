import test from "ava";
import convert, { IBook } from "./index.js";

test("minimum viable book", (t) => {
  const content = `# Topic Name
Topic description.
## Subtopic Name
Subtopic description.
- Fact 1
- Fact 2`;
  const result = convert(content);
  t.true(typeof result === "object", "returns an object");

  t.deepEqual(result, <IBook>{
    topics: [
      {
        title: "Topic Name",
        description: "Topic description.",
        subtopics: [
          {
            title: "Subtopic Name",
            description: "Subtopic description.",
            facts: [
              {
                text: "Fact 1",
                attachments: [],
                questions: [],
              },
              { text: "Fact 2", attachments: [], questions: [] },
            ],
          },
        ],
      },
    ],
  });
});

test("complex book", (t) => {
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
- Fact 6`;
  const result = convert(content);
  t.true(typeof result === "object", "returns an object");

  t.deepEqual(result, <IBook>{
    topics: [
      {
        title: "Topic Name",
        description: "Topic description.",
        subtopics: [
          {
            title: "Subtopic1 Name",
            description: "Subtopic1 description.",
            facts: [
              {
                text: "Fact 1",
                attachments: ["fact 1 attachment 1"],
                questions: [],
              },
              {
                text: "Fact 2",
                attachments: [],
                questions: ["fact 2 question 1"],
              },
            ],
          },
          {
            title: "Subtopic2 Name",
            description: "Subtopic2 description.",
            facts: [
              {
                text: "Fact 3",
                attachments: [],
                questions: ["fact 3 question 1", "fact 3 question 2"],
              },
              {
                text: "Fact 4",
                attachments: ["fact 3 attachment 1", "fact 3 attachment 2"],
                questions: [],
              },
            ],
          },
          {
            title: "Subtopic3 Name",
            description: "Subtopic3 description.",
            facts: [
              {
                text: "Fact 5",
                attachments: [
                  "fact 5 attachment 1",
                  "fact 5 attachment 2",
                  "fact 5 attachment 3",
                  "fact 5 attachment 4",
                ],
                questions: ["fact 5 question 1", "fact 5 question 2"],
              },
              {
                text: "Fact 6",
                questions: [],
                attachments: [],
              },
            ],
          },
        ],
      },
    ],
  });
});

// resistence to extra spacings
// resistence to multi-line descriptions
// resistence to tabs vs spaces

// warns if empty subtopic
// warns if empty topic
// warns if duplicated fact in same topic
// warns if duplicated fact across different topics

// errors if conflict topic name
// errors if missing topic description
// errors if missing subtopic description
// errors if orphane subtopic found
// errors if multiple topics in same file
// errors on invalid fact subitem
// errors on empty fact inside subtopic
// errors on facts inside topic
// errors on lengthy topic/subtopic titles
// errors on lengthy topic/subtopic descriptions
// errors on lengthy topic/subtopic facts
// errors on lengthy topic/subtopic questions
// errors on lengthy topic/subtopic attachments
