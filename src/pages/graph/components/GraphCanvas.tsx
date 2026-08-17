import { useCallback, useEffect, useRef, useState } from "react"

import Graph from "graphology"
import { useTranslation } from "react-i18next"
import Sigma from "sigma"
import type { Coordinates } from "sigma/types"

import type { GraphData } from "@/api/doc"
import { truncateAdvanced } from "@/lib/str"
import { useTabStore } from "@/store/tabStore"

interface GraphCanvasProps {
  data: GraphData
}

function getTheme(isDark: boolean) {
  return {
    primary: isDark ? "#67e8f9" : "#0891b2",
    deleted: isDark ? "#52525b" : "#d4d4d8",
    edge: isDark ? "#e4e4e7" : "#a1a1aa",
    edgeHighlight: isDark ? "#67e8f9" : "#0891b2",
    label: isDark ? "#a1a1aa" : "#52525b",
    labelHighlight: isDark ? "#fafafa" : "#09090b",
    bg: isDark ? "#18181b" : "#ffffff",
    glowColor: isDark ? "#67e8f9" : "#0891b2",
    glowDeleted: isDark ? "#52525b" : "#d4d4d8",
    fadeOpacity: 0.05,
  }
}

function getDynamicSizes(nodeCount: number) {
  let nodeRadius: number
  let glowSize: number
  let labelFontSize: number
  let edgeThickness: number
  let minEdgeThickness: number

  if (nodeCount <= 10) {
    nodeRadius = 8
    glowSize = 30
    labelFontSize = 14
    edgeThickness = 2
    minEdgeThickness = 1
  } else if (nodeCount <= 30) {
    nodeRadius = 6
    glowSize = 24
    labelFontSize = 12
    edgeThickness = 1.5
    minEdgeThickness = 0.8
  } else if (nodeCount <= 80) {
    nodeRadius = 4
    glowSize = 18
    labelFontSize = 11
    edgeThickness = 1
    minEdgeThickness = 0.5
  } else if (nodeCount <= 200) {
    nodeRadius = 3
    glowSize = 12
    labelFontSize = 10
    edgeThickness = 0.8
    minEdgeThickness = 0.3
  } else {
    nodeRadius = 2.5
    glowSize = 10
    labelFontSize = 9
    edgeThickness = 0.6
    minEdgeThickness = 0.2
  }

  return {
    nodeRadius,
    glowSize,
    labelFontSize,
    edgeThickness,
    minEdgeThickness,
    repulsion: Math.max(300, 1200 - nodeCount * 2),
    attraction: Math.max(0.001, 0.004 - nodeCount * 0.00001),
    iterations: Math.min(500, Math.max(200, 300 + nodeCount)),
  }
}

interface LayoutNode {
  id: string
  x: number
  y: number
  vx: number
  vy: number
}

function forceDirectedLayout(
  nodeIds: string[],
  edges: Array<{ source: string; target: string }>,
  nodeCount: number
): Map<string, { x: number; y: number }> {
  const n = nodeIds.length
  if (n === 0) return new Map()
  if (n === 1) return new Map([[nodeIds[0], { x: 0, y: 0 }]])

  const sizes = getDynamicSizes(nodeCount)
  const spread = Math.max(100, Math.min(400, 200 + n * 1.5))

  const nodes: LayoutNode[] = nodeIds.map((id, i) => ({
    id,
    x: Math.cos((2 * Math.PI * i) / n) * spread + (Math.random() - 0.5) * 50,
    y: Math.sin((2 * Math.PI * i) / n) * spread + (Math.random() - 0.5) * 50,
    vx: 0,
    vy: 0,
  }))

  const idxMap = new Map<string, number>()
  nodeIds.forEach((id, i) => idxMap.set(id, i))

  const ITERATIONS = sizes.iterations
  const REPULSION = sizes.repulsion
  const ATTRACTION = sizes.attraction
  const CENTER_GRAVITY = 0.005
  const DAMPING = 0.85

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const temp = 1 - iter / ITERATIONS

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = nodes[i].x - nodes[j].x
        const dy = nodes[i].y - nodes[j].y
        const distSq = dx * dx + dy * dy + 1.0
        const dist = Math.sqrt(distSq)
        const force = (REPULSION / distSq) * temp
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        nodes[i].vx += fx
        nodes[i].vy += fy
        nodes[j].vx -= fx
        nodes[j].vy -= fy
      }
    }

    for (const edge of edges) {
      const si = idxMap.get(edge.source)
      const ti = idxMap.get(edge.target)
      if (si === undefined || ti === undefined) continue
      const dx = nodes[ti].x - nodes[si].x
      const dy = nodes[ti].y - nodes[si].y
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01
      const force = dist * ATTRACTION
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      nodes[si].vx += fx
      nodes[si].vy += fy
      nodes[ti].vx -= fx
      nodes[ti].vy -= fy
    }

    for (const node of nodes) {
      node.vx -= node.x * CENTER_GRAVITY
      node.vy -= node.y * CENTER_GRAVITY
    }

    for (const node of nodes) {
      node.vx *= DAMPING
      node.vy *= DAMPING
      node.x += node.vx
      node.y += node.vy
    }
  }

  const result = new Map<string, { x: number; y: number }>()
  for (const node of nodes) {
    result.set(node.id, { x: node.x, y: node.y })
  }
  return result
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export default function GraphCanvas({ data }: GraphCanvasProps) {
  const { t } = useTranslation("graph")
  const containerRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const graphRef = useRef<Graph | null>(null)
  const openTab = useTabStore((s) => s.openTab)

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"))
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [stats, setStats] = useState({ nodes: data.nodes.length, edges: data.edges.length })
  const [isReady, setIsReady] = useState(false)

  const adjacencyRef = useRef<Map<string, Set<string>>>(new Map())

  useEffect(() => {
    const adj = new Map<string, Set<string>>()
    for (const node of data.nodes) {
      adj.set(node.id, new Set())
    }
    for (const edge of data.edges) {
      adj.get(edge.source)?.add(edge.target)
      adj.get(edge.target)?.add(edge.source)
    }
    adjacencyRef.current = adj
  }, [data])

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    mql.addEventListener("change", handler)
    return () => {
      mql.removeEventListener("change", handler)
      observer.disconnect()
    }
  }, [])

  const updateOverlayPositions = useCallback(() => {
    const sigma = sigmaRef.current
    const overlay = overlayRef.current
    if (!sigma || !overlay) return

    const graph = sigma.getGraph()
    const nodeEls = overlay.querySelectorAll<HTMLElement>("[data-node-id]")
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    nodeEls.forEach((el) => {
      const nodeId = el.dataset.nodeId!
      if (!graph.hasNode(nodeId)) {
        el.style.display = "none"
        return
      }
      const pos: Coordinates = {
        x: graph.getNodeAttribute(nodeId, "x"),
        y: graph.getNodeAttribute(nodeId, "y"),
      }
      const vp = sigma.graphToViewport(pos)
      const margin = 40
      if (
        vp.x < -margin ||
        vp.x > rect.width + margin ||
        vp.y < -margin ||
        vp.y > rect.height + margin
      ) {
        el.style.display = "none"
      } else {
        el.style.display = ""
        el.style.transform = `translate3d(${vp.x}px, ${vp.y}px, 0)`
      }
    })
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || data.nodes.length === 0) {
      setIsReady(true)
      return
    }

    setIsReady(false)

    const theme = getTheme(isDark)
    const nodeCount = data.nodes.length
    const sizes = getDynamicSizes(nodeCount)

    const edgePairs = data.edges
      .map((e) => ({
        source: data.nodes.findIndex((n) => n.id === e.source),
        target: data.nodes.findIndex((n) => n.id === e.target),
      }))
      .filter((e) => e.source >= 0 && e.target >= 0)
      .map((e) => ({ source: `n${e.source}`, target: `n${e.target}` }))

    const layoutPositions = forceDirectedLayout(
      data.nodes.map((_, i) => `n${i}`),
      edgePairs,
      nodeCount
    )

    const graph = new Graph()
    graphRef.current = graph

    data.nodes.forEach((node, i) => {
      const nodeId = `n${i}`
      const pos = layoutPositions.get(nodeId) ?? { x: 0, y: 0 }
      graph.addNode(nodeId, {
        x: pos.x,
        y: pos.y,
        size: sizes.nodeRadius,
        color: node.isDelete ? theme.deleted : theme.primary,
        docId: node.id,
        isDelete: node.isDelete,
        label: truncateAdvanced(node.title || t("common:untitled"), {
          maxLength: 8,
          wordBoundary: true,
        }),
        emoji: node.emoji,
        finalX: pos.x,
        finalY: pos.y,
        startX: (Math.random() - 0.5) * 800,
        startY: (Math.random() - 0.5) * 800,
      })
    })

    const docIdToNodeId = new Map<string, string>()
    data.nodes.forEach((node, i) => docIdToNodeId.set(node.id, `n${i}`))

    const validEdgeCount = data.edges.filter((edge) => {
      const s = docIdToNodeId.get(edge.source)
      const t = docIdToNodeId.get(edge.target)
      return s && t && graph.hasNode(s) && graph.hasNode(t)
    }).length

    data.edges.forEach((edge, index) => {
      const s = docIdToNodeId.get(edge.source)
      const t = docIdToNodeId.get(edge.target)
      if (s && t && graph.hasNode(s) && graph.hasNode(t)) {
        graph.addEdgeWithKey(`e${index}`, s, t, {
          type: "arrow",
          size: sizes.edgeThickness,
          color: theme.edge,
          arrow: {
            size: Math.max(4, sizes.edgeThickness * 2.5),
            color: theme.edge,
          },
          length: 0.7,
        })
      }
    })

    setStats({ nodes: nodeCount, edges: validEdgeCount })

    graph.forEachNode((node) => {
      const startX = graph.getNodeAttribute(node, "startX") as number
      const startY = graph.getNodeAttribute(node, "startY") as number
      graph.setNodeAttribute(node, "x", startX)
      graph.setNodeAttribute(node, "y", startY)
    })

    const sigma = new Sigma(graph, container, {
      defaultNodeColor: theme.primary,
      defaultEdgeColor: theme.edge,
      defaultEdgeType: "arrow",
      renderLabels: false,
      renderEdgeLabels: false,
      minEdgeThickness: sizes.minEdgeThickness,
      edgeReducer(_edge, d) {
        return {
          ...d,
          color: theme.edge,
          zIndex: 1,
        }
      },
      nodeReducer(_node, d) {
        return {
          ...d,
          zIndex: 0,
        }
      },
    })
    sigmaRef.current = sigma

    const overlay = document.createElement("div")
    overlay.style.cssText =
      "position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2;opacity:0;transition:opacity 0.8s ease;"
    container.appendChild(overlay)
    overlayRef.current = overlay

    data.nodes.forEach((node, i) => {
      const nodeId = `n${i}`
      const wrapper = document.createElement("div")
      wrapper.dataset.nodeId = nodeId
      wrapper.style.cssText =
        "position:absolute;left:0;top:0;pointer-events:none;transition:opacity 0.3s ease;opacity:0;z-index:2;"

      const glow = document.createElement("div")
      glow.className = "g-node-glow"
      glow.style.cssText = `
        position:absolute;
        width:${sizes.glowSize}px;height:${sizes.glowSize}px;
        border-radius:50%;
        transform:translate(-50%,-50%);
        background:radial-gradient(circle, ${node.isDelete ? theme.glowDeleted : theme.glowColor} 0%, transparent 70%);
        filter:blur(3px);
        opacity: 0.8;
        pointer-events:none;
        z-index:1;
      `

      const circle = document.createElement("div")
      circle.className = "g-node-circle"
      circle.style.cssText = `
        position:absolute;
        width:${sizes.nodeRadius * 2}px;height:${sizes.nodeRadius * 2}px;
        border-radius:50%;
        transform:translate(-50%,-50%) scale(0.3);
        background: ${node.isDelete ? theme.deleted : theme.primary};
        box-shadow: 0 0 ${sizes.nodeRadius}px ${node.isDelete ? "transparent" : theme.primary};
        transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
        pointer-events:none;
        z-index:2;
      `

      const label = document.createElement("div")
      label.className = "g-node-label"
      const labelOffset = sizes.nodeRadius + 8
      label.style.cssText = `
        position:absolute;
        left:50%;top:${labelOffset}px;
        transform:translateX(-50%);
        font-size:${sizes.labelFontSize}px;
        line-height:1.4;
        white-space:nowrap;
        color:${theme.label};
        font-weight: 400;
        pointer-events:none;
        user-select:none;
        transition: opacity 0.4s ease, color 0.3s ease;
        text-shadow: 0 1px 2px ${theme.bg};
        opacity: 0;
        z-index:3;
      `
      const emoji = node.emoji ? `${node.emoji} ` : ""
      const title = truncateAdvanced(node.title || t("common:untitled"), {
        maxLength: 8,
        wordBoundary: true,
      })
      label.textContent = `${emoji}${title}`
      if (node.isDelete) {
        label.style.textDecoration = "line-through"
        label.style.opacity = "0.3"
      }

      wrapper.appendChild(glow)
      wrapper.appendChild(circle)
      wrapper.appendChild(label)
      overlay.appendChild(wrapper)
    })

    const ANIM_DURATION = Math.min(1400, Math.max(800, 1000 + nodeCount * 0.3))
    const startTime = performance.now()

    const finalPositions = new Map<string, { x: number; y: number }>()
    graph.forEachNode((node) => {
      const finalX = graph.getNodeAttribute(node, "finalX") as number
      const finalY = graph.getNodeAttribute(node, "finalY") as number
      finalPositions.set(node, { x: finalX, y: finalY })
    })

    overlay.style.opacity = "0"

    function animateProgressive(now: number) {
      const elapsed = now - startTime
      const t = Math.min(elapsed / ANIM_DURATION, 1)
      const eased = easeInOutCubic(t)

      graph.forEachNode((node) => {
        const final = finalPositions.get(node)!
        const startX = graph.getNodeAttribute(node, "startX") as number
        const startY = graph.getNodeAttribute(node, "startY") as number

        const currentX = startX + (final.x - startX) * eased
        const currentY = startY + (final.y - startY) * eased
        graph.setNodeAttribute(node, "x", currentX)
        graph.setNodeAttribute(node, "y", currentY)
      })

      updateOverlayPositions()

      const nodeEls = overlay.querySelectorAll<HTMLElement>("[data-node-id]")
      nodeEls.forEach((el, index) => {
        const staggerDelay = (index / nodeEls.length) * 0.3 // Stagger over 30% of animation
        const nodeT = Math.max(0, Math.min(1, (t - staggerDelay) / (1 - staggerDelay)))

        if (nodeT > 0) {
          const circle = el.querySelector<HTMLElement>(".g-node-circle")
          const label = el.querySelector<HTMLElement>(".g-node-label")

          if (circle) {
            const scale = 0.3 + 0.7 * easeOutExpo(nodeT)
            circle.style.transform = `translate(-50%,-50%) scale(${scale})`
          }

          if (label) {
            label.style.opacity = String(nodeT * (el.dataset.isDelete === "true" ? 0.5 : 0.9))
          }

          el.style.opacity = String(nodeT)
        }
      })

      if (t > 0.2) {
        const overlayFade = Math.min(1, (t - 0.2) / 0.3)
        overlay.style.opacity = String(overlayFade)
      }

      if (t < 1) {
        requestAnimationFrame(animateProgressive)
      } else {
        setIsReady(true)

        nodeEls.forEach((el) => {
          el.style.opacity = "1"
          const circle = el.querySelector<HTMLElement>(".g-node-circle")
          const label = el.querySelector<HTMLElement>(".g-node-label")
          if (circle) {
            circle.style.transform = "translate(-50%,-50%) scale(1)"
          }
          if (label) {
            label.style.opacity = el.dataset.isDelete === "true" ? "0.5" : "0.9"
          }
        })
        overlay.style.opacity = "1"
      }
    }

    requestAnimationFrame(animateProgressive)

    const camera = sigma.getCamera()
    camera.on("updated", () => requestAnimationFrame(updateOverlayPositions))

    let currentHoveredNode: string | null = null
    sigma.on("enterNode", ({ node }) => {
      currentHoveredNode = node
      setHoveredNode(node)
    })
    sigma.on("leaveNode", () => {
      currentHoveredNode = null
      setHoveredNode(null)
    })

    sigma.on("clickNode", ({ node }) => {
      const docId = graph.getNodeAttribute(node, "docId") as string
      const title = graph.getNodeAttribute(node, "label") as string
      if (docId) openTab({ type: "editor", title: title || t("common:untitled"), docId })
    })

    const handleDblClick = () => {
      if (!currentHoveredNode) {
        camera.animatedReset({ duration: 600 })
      }
    }
    container.addEventListener("dblclick", handleDblClick)

    const handleResize = () => {
      sigma.resize()
      updateOverlayPositions()
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      container.removeEventListener("dblclick", handleDblClick)
      camera.removeAllListeners()
      sigma.kill()
      if (overlay.parentNode) {
        overlay.remove()
      }
      sigmaRef.current = null
      overlayRef.current = null
      graphRef.current = null
    }
  }, [data, isDark])

  useEffect(() => {
    const sigma = sigmaRef.current
    const graph = graphRef.current
    const overlay = overlayRef.current
    if (!sigma || !graph || !overlay || !isReady) return

    const theme = getTheme(isDark)
    const adj = adjacencyRef.current
    const sizes = getDynamicSizes(data.nodes.length)

    if (hoveredNode) {
      const neighbors =
        adj.get(data.nodes.find((_, i) => `n${i}` === hoveredNode)?.id ?? "") ?? new Set()

      graph.forEachNode((node) => {
        const docId = graph.getNodeAttribute(node, "docId") as string
        const isActive = node === hoveredNode || neighbors.has(docId)

        const el = overlay.querySelector<HTMLElement>(`[data-node-id="${node}"]`)
        if (el) {
          el.style.opacity = isActive ? "1" : String(theme.fadeOpacity)
          const circle = el.querySelector<HTMLElement>(".g-node-circle")
          const label = el.querySelector<HTMLElement>(".g-node-label")

          if (circle && node === hoveredNode) {
            circle.style.transform = "translate(-50%,-50%) scale(1.5)"
            circle.style.boxShadow = `0 0 20px ${theme.primary}`
          } else if (circle) {
            circle.style.transform = "translate(-50%,-50%) scale(1)"
            if (isActive) {
              circle.style.boxShadow = `0 0 8px ${theme.primary}`
            } else {
              circle.style.boxShadow = "none"
            }
          }

          if (label) {
            label.style.opacity = isActive ? "1" : "0"
            label.style.color = isActive ? theme.labelHighlight : theme.label
            if (node === hoveredNode) {
              label.style.fontWeight = "600"
            } else {
              label.style.fontWeight = "400"
            }
          }
        }
      })

      graph.forEachEdge((edge) => {
        const src = graph.source(edge)
        const tgt = graph.target(edge)
        const isConnected = src === hoveredNode || tgt === hoveredNode

        const color = isConnected ? theme.edgeHighlight : theme.edge
        graph.setEdgeAttribute(edge, "color", color)
        graph.setEdgeAttribute(
          edge,
          "size",
          isConnected ? sizes.edgeThickness * 2.5 : sizes.edgeThickness * 0.5
        )
        if (graph.getEdgeAttribute(edge, "arrow")) {
          graph.setEdgeAttribute(edge, "arrow", {
            size: Math.max(
              4,
              (isConnected ? sizes.edgeThickness * 2.5 : sizes.edgeThickness * 0.5) * 2.5
            ),
            color: color,
          })
        }
      })
    } else {
      graph.forEachNode((node) => {
        const isDelete = graph.getNodeAttribute(node, "isDelete") as number
        graph.setNodeAttribute(node, "color", isDelete ? theme.deleted : theme.primary)

        const el = overlay.querySelector<HTMLElement>(`[data-node-id="${node}"]`)
        if (el) {
          el.style.opacity = "1"
          const circle = el.querySelector<HTMLElement>(".g-node-circle")
          const label = el.querySelector<HTMLElement>(".g-node-label")
          if (circle) {
            circle.style.transform = "translate(-50%,-50%) scale(1)"
            circle.style.boxShadow = `0 0 ${sizes.nodeRadius}px ${isDelete ? "transparent" : theme.primary}`
          }
          if (label) {
            label.style.opacity = isDelete ? "0.5" : "1"
            label.style.color = theme.label
            label.style.fontWeight = "400"
          }
        }
      })

      graph.forEachEdge((edge) => {
        graph.setEdgeAttribute(edge, "color", theme.edge)
        graph.setEdgeAttribute(edge, "size", sizes.edgeThickness)
        // 重置箭头颜色
        if (graph.getEdgeAttribute(edge, "arrow")) {
          graph.setEdgeAttribute(edge, "arrow", {
            size: Math.max(4, sizes.edgeThickness * 2.5),
            color: theme.edge,
          })
        }
      })
    }
  }, [hoveredNode, isDark, data.nodes, isReady])

  useEffect(() => {
    const sigma = sigmaRef.current
    const graph = graphRef.current
    const overlay = overlayRef.current
    if (!sigma || !graph || !overlay || !isReady) return

    const theme = getTheme(isDark)
    const sizes = getDynamicSizes(data.nodes.length)

    sigma.setSettings({
      defaultNodeColor: theme.primary,
      defaultEdgeColor: theme.edge,
      minEdgeThickness: sizes.minEdgeThickness,
    })

    graph.forEachNode((node, attrs) => {
      const isDelete = attrs.isDelete as number
      graph.setNodeAttribute(node, "color", isDelete ? theme.deleted : theme.primary)

      const el = overlay.querySelector<HTMLElement>(`[data-node-id="${node}"]`)
      if (!el) return
      const glow = el.querySelector<HTMLElement>(".g-node-glow")
      const circle = el.querySelector<HTMLElement>(".g-node-circle")
      const label = el.querySelector<HTMLElement>(".g-node-label")

      if (glow)
        glow.style.background = `radial-gradient(circle, ${isDelete ? theme.glowDeleted : theme.glowColor} 0%, transparent 70%)`
      if (circle) {
        circle.style.background = isDelete ? theme.deleted : theme.primary
        circle.style.boxShadow = `0 0 ${sizes.nodeRadius}px ${isDelete ? "transparent" : theme.primary}`
      }
      if (label) {
        label.style.color = theme.label
        label.style.textShadow = `0 1px 2px ${theme.bg}`
      }
    })

    graph.forEachEdge((edge) => {
      graph.setEdgeAttribute(edge, "color", theme.edge)
      if (graph.getEdgeAttribute(edge, "arrow")) {
        graph.setEdgeAttribute(edge, "arrow", {
          size: Math.max(4, sizes.edgeThickness * 2.5),
          color: theme.edge,
        })
      }
    })
  }, [isDark, data.nodes.length, isReady])

  if (data.nodes.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        {t("noData")}
      </div>
    )
  }

  return (
    <div className="relative flex h-full w-full flex-col">
      <div
        ref={containerRef}
        className="relative flex-1"
        style={{
          background: getTheme(isDark).bg,
          cursor: "grab",
          opacity: isReady ? 1 : 0.95,
          transition: "opacity 0.6s ease",
        }}
      />

      <div
        className="flex shrink-0 items-center justify-center gap-4 py-2 text-xs"
        style={{ color: getTheme(isDark).label, opacity: 0.6 }}
      >
        <span>{t("nodes", { count: stats.nodes })}</span>
        <span>·</span>
        <span>{t("links", { count: stats.edges })}</span>
      </div>
    </div>
  )
}
