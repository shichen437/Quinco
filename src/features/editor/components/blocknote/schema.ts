import {
  BlockNoteSchema,
  createHeadingBlockSpec,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
} from "@blocknote/core"
import { createReactInlineMathSpec, createReactMathBlockSpec } from "@blocknote/math-block"

import { docReferenceSpec } from "./extensions/docReference/DocReferenceSpec"

export const blocknoteSchema = (() => {
  const { audio: _audio, video: _video, file: _file, ...remainingBlockSpecs } = defaultBlockSpecs

  return BlockNoteSchema.create({
    blockSpecs: {
      ...remainingBlockSpecs,
      heading: createHeadingBlockSpec({
        allowToggleHeadings: false,
        levels: [1, 2, 3],
      }),
      mathBlock: createReactMathBlockSpec(),
    },
    inlineContentSpecs: {
      ...defaultInlineContentSpecs,
      docReference: docReferenceSpec,
      math: createReactInlineMathSpec(),
    },
  })
})()
