import { useEffect } from "react"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"

/**
 * A tiny on-brand "studio" baked once into a PMREM environment map and set as
 * `scene.environment` (never `scene.background` — the canvas stays
 * transparent so the DOM `AppBackground` shows through).
 *
 * Instead of an external HDRI: a dim vertex-coloured gradient dome (the base
 * the whole silhouette reflects) plus a few small emissive panels — compact
 * neutral glints, a cool rim right and a violet rim low-left echoing the
 * MoodPlayer gradient (`--color-cta-button-from/to`). The dome dominates the
 * glass's overall body brightness (via IBL), so keep it dark. Note: brightness
 * is set here, not via the material's `envMapIntensity`, which three ignores
 * for `scene.environment` (it only scales a per-material `envMap`). Built with
 * `PMREMGenerator.fromScene` at mount, then every temporary object is
 * disposed — the only lasting cost is one small cube-UV texture.
 */
export default function OrbEnvironment() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)

  useEffect(() => {
    const envScene = new THREE.Scene()

    // Dim gradient dome — the base the whole silhouette reflects. It is
    // deliberately *not* uniform around the sphere: two soft brighter lobes
    // (upper-left, right) and darker gaps elsewhere, so the rim emerges in
    // some sections and fades in others instead of drawing a full outline.
    // The camera-facing (+Z) side stays darkest so the face reads clear.
    const dome = new THREE.SphereGeometry(20, 48, 24)
    const domeColors: number[] = []
    const top = new THREE.Color("#121831")
    const horizon = new THREE.Color("#080b1a")
    const floor = new THREE.Color("#0a0a17")
    const lobeUpperLeft = new THREE.Vector3(-0.7, 0.62, -0.35).normalize()
    const lobeRight = new THREE.Vector3(0.92, 0.12, -0.38).normalize()
    const dir = new THREE.Vector3()
    const mixed = new THREE.Color()
    const positions = dome.attributes.position
    for (let i = 0; i < positions.count; i++) {
      dir.fromBufferAttribute(positions, i).normalize()
      if (dir.y >= 0) mixed.copy(horizon).lerp(top, Math.pow(dir.y, 0.8))
      else mixed.copy(horizon).lerp(floor, Math.pow(-dir.y, 0.7))
      const lobes =
        0.38 +
        1.9 * Math.pow(Math.max(0, dir.dot(lobeUpperLeft)), 3) +
        1.2 * Math.pow(Math.max(0, dir.dot(lobeRight)), 4)
      const frontDim = 0.12 + 0.88 * (1 - Math.pow(Math.max(0, dir.z), 0.9))
      mixed.multiplyScalar(lobes * frontDim)
      domeColors.push(mixed.r, mixed.g, mixed.b)
    }
    dome.setAttribute("color", new THREE.Float32BufferAttribute(domeColors, 3))
    const domeMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })
    envScene.add(new THREE.Mesh(dome, domeMaterial))

    const panel = new THREE.PlaneGeometry(1, 1)
    const materials: THREE.Material[] = [domeMaterial]
    const addPanel = (
      hex: string,
      intensity: number,
      position: [number, number, number],
      scale: [number, number],
    ) => {
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(hex).multiplyScalar(intensity),
        side: THREE.DoubleSide,
      })
      materials.push(material)
      const mesh = new THREE.Mesh(panel, material)
      mesh.position.set(...position)
      mesh.scale.set(scale[0], scale[1], 1)
      mesh.lookAt(0, 0, 0)
      envScene.add(mesh)
    }

    // Three primary reflection zones, deliberately unequal in size,
    // brightness and placement (no matching strokes, no lower arc):
    // 1. Neutral key — small, soft, upper-left. The brightest, smallest.
    addPanel("#f6f6fa", 3.4, [-3.6, 3.7, -0.4], [1.4, 1.0])
    // 2. Cool blue — a short narrow strip, right side, upper half only.
    addPanel("#7f97de", 1.0, [4.5, 1.3, -1.5], [0.3, 1.5])
    // 3. Violet — very faint, short, low-left.
    addPanel("#9a78c2", 0.45, [-4.3, -2.1, -1.6], [0.3, 1.1])
    // Accents: a tiny neutral fleck high-right and a small dim glint
    // low-right, so the lower edge keeps a hint of definition locally.
    addPanel("#e8ecff", 0.7, [2.4, 4.2, 0.4], [0.18, 0.35])
    addPanel("#b9b4dc", 0.35, [2.0, -4.1, -1.4], [0.6, 0.2])

    const pmrem = new THREE.PMREMGenerator(gl)
    const envTarget = pmrem.fromScene(envScene, 0.025)
    scene.environment = envTarget.texture

    pmrem.dispose()
    panel.dispose()
    dome.dispose()
    materials.forEach((material) => material.dispose())

    return () => {
      if (scene.environment === envTarget.texture) scene.environment = null
      envTarget.dispose()
    }
  }, [gl, scene])

  return null
}
