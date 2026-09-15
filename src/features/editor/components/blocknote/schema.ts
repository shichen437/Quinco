import {
  BlockNoteSchema,
  createHeadingBlockSpec,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
} from "@blocknote/core"

import { docReferenceSpec } from "./extensions/docReference/DocReferenceSpec"

/**
 * The editor-wide BlockNote schema, shared between the editor and any custom
 * controllers that need a type-safe editor instance (e.g. to insert the
 * `docReference` inline content).
 */
export const blocknoteSchema = (() => {
  const { audio: _audio, video: _video, file: _file, ...remainingBlockSpecs } = defaultBlockSpecs

  return BlockNoteSchema.create({
    blockSpecs: {
      ...remainingBlockSpecs,
      heading: createHeadingBlockSpec({
        allowToggleHeadings: false,
        levels: [1, 2, 3],
      }),
    },
    inlineContentSpecs: {
      ...defaultInlineContentSpecs,
      docReference: docReferenceSpec,
    },
  })
})()
