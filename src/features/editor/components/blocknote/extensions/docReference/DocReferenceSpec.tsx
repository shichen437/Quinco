import { createReactInlineContentSpec } from "@blocknote/react"

import DocReferenceView from "./DocReferenceView"

export const docReferenceSpec = createReactInlineContentSpec(
  {
    type: "docReference" as const,
    content: "none" as const,
    propSchema: {
      docId: {
        default: "",
      },
    },
  },
  {
    render: (props) => <DocReferenceView docId={props.inlineContent.props.docId} />,
    parse: (element) => {
      const docId = element.getAttribute("data-doc-id")
      if (!docId) return undefined
      return { docId }
    },
    toExternalHTML: (props) => <DocReferenceView docId={props.inlineContent.props.docId} />,
  }
)
