export type Point2D = { x: number; y: number }

/**
 * Minimal 2D Delaunay triangulation (the standard Bowyer-Watson
 * incremental algorithm), implemented locally rather than pulling in a
 * triangulation package. The point set this is used for (see
 * `useFaceLandmarker.ts`) is a few dozen landmarks and only needs to run
 * once per camera session — not per frame — so a small, dependency-free
 * implementation is the right size for the job rather than a new
 * dependency for such a narrow, one-shot use.
 *
 * Returns triangles as index triples into `points` (not coordinates), so
 * the caller maps them back to whatever identifiers those points came
 * from — here, real MediaPipe landmark indices.
 */
export function delaunayTriangulate(points: Point2D[]): [number, number, number][] {
  if (points.length < 3) return []

  type Tri = { a: number; b: number; c: number }

  const superTriangle = buildSuperTriangle(points)
  const allPoints = [...points, ...superTriangle]
  const superA = points.length
  const superB = points.length + 1
  const superC = points.length + 2

  let triangles: Tri[] = [{ a: superA, b: superB, c: superC }]

  for (let i = 0; i < points.length; i++) {
    const p = points[i]

    // Every triangle whose circumcircle contains this point can no longer
    // be part of a valid Delaunay triangulation once the point is added.
    const bad = triangles.filter((t) => inCircumcircle(p, allPoints[t.a], allPoints[t.b], allPoints[t.c]))

    // The union of those triangles forms a polygonal hole around the new
    // point; its boundary is exactly the edges that belong to only one
    // bad triangle (an edge shared by two bad triangles is interior to
    // the hole, not on its boundary).
    const boundary: [number, number][] = []
    for (const t of bad) {
      const edges: [number, number][] = [
        [t.a, t.b],
        [t.b, t.c],
        [t.c, t.a],
      ]
      for (const edge of edges) {
        const sharedByAnotherBadTriangle = bad.some((other) => other !== t && triangleHasEdge(other, edge))
        if (!sharedByAnotherBadTriangle) boundary.push(edge)
      }
    }

    triangles = triangles.filter((t) => !bad.includes(t))
    for (const [e0, e1] of boundary) {
      triangles.push({ a: e0, b: e1, c: i })
    }
  }

  // Drop every triangle still touching one of the three super-triangle
  // corners — those only existed to seed the algorithm.
  return triangles
    .filter((t) => t.a < points.length && t.b < points.length && t.c < points.length)
    .map((t) => [t.a, t.b, t.c])
}

function triangleHasEdge(t: { a: number; b: number; c: number }, edge: [number, number]): boolean {
  const verts = [t.a, t.b, t.c]
  return verts.includes(edge[0]) && verts.includes(edge[1])
}

function signedArea(a: Point2D, b: Point2D, c: Point2D): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

/**
 * Standard incircle determinant test, normalizing triangle winding to
 * counter-clockwise first (the classic formula's sign only holds for a
 * consistent winding) so it gives a correct answer regardless of how the
 * triangle's three vertices happen to be ordered.
 */
function inCircumcircle(p: Point2D, a: Point2D, b: Point2D, c: Point2D): boolean {
  let pb = b
  let pc = c
  if (signedArea(a, b, c) < 0) {
    pb = c
    pc = b
  }

  const ax = a.x - p.x
  const ay = a.y - p.y
  const bx = pb.x - p.x
  const by = pb.y - p.y
  const cx = pc.x - p.x
  const cy = pc.y - p.y

  const det =
    (ax * ax + ay * ay) * (bx * cy - cx * by) -
    (bx * bx + by * by) * (ax * cy - cx * ay) +
    (cx * cx + cy * cy) * (ax * by - bx * ay)

  return det > 0
}

/**
 * A triangle enclosing every input point by a wide margin, used to seed
 * Bowyer-Watson — every real point ends up "inside" this triangle so the
 * incremental insertion has a valid starting triangulation to work from.
 */
function buildSuperTriangle(points: Point2D[]): [Point2D, Point2D, Point2D] {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of points) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }

  const span = Math.max(maxX - minX, maxY - minY)
  const delta = span > 0 ? span * 10 : 10
  const midX = (minX + maxX) / 2
  const midY = (minY + maxY) / 2

  return [
    { x: midX - 2 * delta, y: midY - delta },
    { x: midX, y: midY + 2 * delta },
    { x: midX + 2 * delta, y: midY - delta },
  ]
}
