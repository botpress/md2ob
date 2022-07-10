# md2ob

> Converts a list of markdown files to an OpenBook JSON object

**md2ob** is a lightweight npm library used by the [OpenBook Playground](https://openbook-playground.botpress.tools) to convert users' Markdown files to an OpenBook JSON object for book compilation via [API](https://openbook.botpress.cloud/redoc).

This library can be used by anyone to create custom front-end or back-end OpenBook clients and preserve the same markdown format as our Playground.

## Install

```
npm install md2ob
```

## Usage

```js
import convert from "@botpress/md2ob";

const file1 = `
# Topic 1
This is the description of topic 1

## Subtopic 1
This is the description of subtopic 1

- A very impressive fact about subtopic 1
    - `attachment to the fact`
    - > a question
- A second fact
`

const result = convert(file1);

if (result.success) {
    // Success
    console.log(result.book, result.warnings)
else {
    // Failure
    console.log(result.errors)
}
```
