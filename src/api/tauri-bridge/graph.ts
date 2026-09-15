import type { Document } from "./document"
import { callWithWorkspace } from "./helper"

export interface GraphLink {
  source: string
  target: string
}

export interface GraphData {
  nodes: Document[]
  links: GraphLink[]
}

export async function getGraphData(): Promise<GraphData> {
  const result = await callWithWorkspace<{ nodes: Document[]; links: [string, string][] }>(
    "get_graph_data"
  )
  return {
    nodes: result.nodes,
    links: result.links.map(([source, target]) => ({ source, target })),
  }
}
