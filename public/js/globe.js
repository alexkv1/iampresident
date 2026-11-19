// Interactive 3D globe (three.js r149 UMD + earcut). Countries are real meshes,
// so picking is just a raycast against them — no lat/lng inverse maths needed.
//
//   const g = new Globe(document.getElementById('globe'));
//   await g.load('/assets/countries.geo.json');
//   g.onSelect(code => ...); g.setOwners({ SWE:'#e6194b' });

const DEG2RAD = Math.PI / 180;
const R = 1;                       // globe radius
const NEUTRAL_LAND = 0x5a8f4e;    // unowned country colour (land green)
const OCEAN = 0x14456b;           // ocean blue

function lonLatToVec3(lon, lat, r) {
  const phi = (90 - lat) * DEG2RAD;
  const theta = (lon + 180) * DEG2RAD;
  return [
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  ];
}

const LAND_R = R * 1.003;     // land fill radius (above the ocean sphere)
const BORDER_R = R * 1.005;   // coastline / border radius
const MAX_EDGE_DEG = 7;       // subdivide triangles larger than this

function _mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
function _edge(a, b) { const dx = a[0] - b[0], dy = a[1] - b[1]; return Math.sqrt(dx * dx + dy * dy); }

// Recursively 4-split a lon/lat triangle until every edge is small. Without this,
// a big interior triangle of a large country chords straight through the globe and
// sinks below the ocean sphere — which shows as a hole. Small facets hug the surface.
function subdivideTri(a, b, c, out) {
  if (_edge(a, b) <= MAX_EDGE_DEG && _edge(b, c) <= MAX_EDGE_DEG && _edge(c, a) <= MAX_EDGE_DEG) {
    out.push(a, b, c);
    return;
  }
  const ab = _mid(a, b), bc = _mid(b, c), ca = _mid(c, a);
  subdivideTri(a, ab, ca, out);
  subdivideTri(ab, b, bc, out);
  subdivideTri(ca, bc, c, out);
  subdivideTri(ab, bc, ca, out);
}

class Globe {
  constructor(container, opts = {}) {
    this.container = container;
    this.opts = opts;
    this.meshes = [];            // country fill meshes
    this.byCode = {};            // code -> mesh
    this.props = {};             // code -> properties
    this.owners = {};            // code -> colour
    this.selectable = false;
    this.selectedCode = null;
    this.hoverCode = null;
    this._selectCb = null;
    this._hoverCb = null;
    this.autoRotate = opts.autoRotate !== false;

    this._initScene();
    this._initControls();
    this._animate = this._animate.bind(this);
    requestAnimationFrame(this._animate);
    window.addEventListener('resize', () => this._resize());
  }

  _initScene() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    this.camera.position.set(0, 0, 3.0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.container.appendChild(this.renderer.domElement);

    this.world = new THREE.Group();
    this.scene.add(this.world);

    // Ocean sphere, drawn just under the land fills.
    const ocean = new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.996, 64, 48),
      new THREE.MeshPhongMaterial({ color: OCEAN, shininess: 8, specular: 0x14324f })
    );
    this.world.add(ocean);

    // Lights.
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(3, 2, 4);
    this.scene.add(dir);
    // Atmosphere glow (simple additive shell).
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.06, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0x5ea0e0, transparent: true, opacity: 0.12, side: THREE.BackSide })
    );
    this.scene.add(glow);

    this.raycaster = new THREE.Raycaster();
  }

  async load(url) {
    const fc = await fetch(url).then(r => r.json());
    const borderPositions = [];

    for (const feat of fc.features) {
      const code = feat.properties.code;
      this.props[code] = feat.properties;
      const polys = feat.geometry.type === 'Polygon' ? [feat.geometry.coordinates] : feat.geometry.coordinates;

      const positions = [];
      const normals = [];

      for (const poly of polys) {
        // poly = [outerRing, hole1, hole2, ...]
        const flat = earcut.flatten(poly);
        const tris = earcut(flat.vertices, flat.holes, flat.dimensions);
        const V = flat.vertices;

        for (let i = 0; i < tris.length; i += 3) {
          const a = [V[tris[i] * 2], V[tris[i] * 2 + 1]];
          const b = [V[tris[i + 1] * 2], V[tris[i + 1] * 2 + 1]];
          const c = [V[tris[i + 2] * 2], V[tris[i + 2] * 2 + 1]];
          const sub = [];
          subdivideTri(a, b, c, sub);
          for (const p of sub) {
            const [x, y, z] = lonLatToVec3(p[0], p[1], LAND_R);
            positions.push(x, y, z);
            normals.push(x / LAND_R, y / LAND_R, z / LAND_R); // smooth sphere normal
          }
        }

        // Borders: outline every ring along the coast.
        for (const ring of poly) {
          for (let i = 0; i < ring.length - 1; i++) {
            const a = lonLatToVec3(ring[i][0], ring[i][1], BORDER_R);
            const b = lonLatToVec3(ring[i + 1][0], ring[i + 1][1], BORDER_R);
            borderPositions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
          }
        }
      }

      if (!positions.length) continue;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

      const mat = new THREE.MeshPhongMaterial({ color: NEUTRAL_LAND, shininess: 6, specular: 0x0a0a0a });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.code = code;
      mesh.userData.base = NEUTRAL_LAND;
      this.world.add(mesh);
      this.meshes.push(mesh);
      this.byCode[code] = mesh;
    }

    // All borders in one line object.
    const bgeo = new THREE.BufferGeometry();
    bgeo.setAttribute('position', new THREE.Float32BufferAttribute(borderPositions, 3));
    this.borders = new THREE.LineSegments(bgeo, new THREE.LineBasicMaterial({ color: 0x123524, transparent: true, opacity: 0.45 }));
    this.world.add(this.borders);

    return this;
  }

  // ---- interaction ---------------------------------------------------------
  _initControls() {
    const el = this.renderer.domElement;
    let down = false, lx = 0, ly = 0, moved = 0;

    el.addEventListener('pointerdown', (e) => { down = true; lx = e.clientX; ly = e.clientY; moved = 0; this._userActive = true; });
    window.addEventListener('pointerup', (e) => {
      if (down && moved < 6) this._pick(e, true);
      down = false;
    });
    el.addEventListener('pointermove', (e) => {
      if (down) {
        const dx = e.clientX - lx, dy = e.clientY - ly;
        lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
        this.world.rotation.y += dx * 0.005;
        this.world.rotation.x = Math.max(-1.2, Math.min(1.2, this.world.rotation.x + dy * 0.005));
      } else {
        this._pick(e, false);
      }
    });
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.camera.position.z = Math.max(1.5, Math.min(6, this.camera.position.z + e.deltaY * 0.0016));
    }, { passive: false });
  }

  _pick(e, isClick) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.intersectObjects(this.meshes, false)[0];
    const code = hit ? hit.object.userData.code : null;

    if (isClick) {
      if (code && this.selectable && this._selectCb) this._selectCb(code, this.props[code]);
    } else {
      if (code !== this.hoverCode) {
        this.hoverCode = code;
        this.container.style.cursor = (code && this.selectable) ? 'pointer' : 'grab';
        this._recolorAll();
        if (this._hoverCb) this._hoverCb(code, code ? this.props[code] : null);
      }
    }
  }

  _recolorAll() {
    for (const m of this.meshes) {
      const code = m.userData.code;
      let color = this.owners[code] ? new THREE.Color(this.owners[code]).getHex() : NEUTRAL_LAND;
      if (code === this.selectedCode) color = 0x4fd1c5;
      m.material.color.setHex(color);
      m.material.emissive.setHex(code === this.hoverCode ? 0x203040 : 0x000000);
    }
  }

  // ---- public API ----------------------------------------------------------
  onSelect(cb) { this._selectCb = cb; return this; }
  onHover(cb)  { this._hoverCb = cb; return this; }
  setSelectable(v) { this.selectable = !!v; return this; }

  setOwners(map) { this.owners = map || {}; this._recolorAll(); return this; }
  setSelected(code) { this.selectedCode = code; this._recolorAll(); return this; }

  getProps(code) { return this.props[code] || null; }

  // Rotate the globe so a country faces the camera.
  focus(code) {
    const p = this.props[code];
    if (!p) return;
    // Use the country's first coordinate as an approximate facing point.
    const mesh = this.byCode[code];
    if (!mesh) return;
    mesh.geometry.computeBoundingSphere();
    const c = mesh.geometry.boundingSphere.center.clone().normalize();
    // Target rotations that bring c to face +Z.
    this._targetRotY = Math.atan2(-c.x, c.z);
    this._targetRotX = Math.asin(Math.max(-1, Math.min(1, c.y)));
    this._userActive = false;
  }

  _resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  _animate() {
    requestAnimationFrame(this._animate);
    if (this._targetRotY !== undefined && !this._userActive) {
      this.world.rotation.y += (this._targetRotY - this.world.rotation.y) * 0.08;
      this.world.rotation.x += (this._targetRotX - this.world.rotation.x) * 0.08;
    } else if (this.autoRotate && !this._userActive) {
      this.world.rotation.y += 0.0007;
    }
    this.renderer.render(this.scene, this.camera);
  }
}
