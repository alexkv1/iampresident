// Interactive 3D globe — restyled port of public/js/globe.js (three.js r149 UMD + earcut).
// Same API as the source: new Globe(el, {autoRotate}); await g.load(url); g.onHover/onSelect/setOwners/setSelected/focus.
// Game-layer changes: brighter ocean + land, stronger atmosphere, gold hover rim, destroy() for SPA use.
(function () {
  const DEG2RAD = Math.PI / 180;
  const R = 1;
  const NEUTRAL_LAND = 0x4d6390;   // source 0x30415e
  const OCEAN = 0x123a7a;          // source 0x0c182e
  const SELECTED = 0x4fd1c5;       // teal-400 (same as source)
  const HOVER_EMISSIVE = 0x2a3f66; // source 0x203040
  const _geoCache = {};

  function lonLatToVec3(lon, lat, r) {
    const phi = (90 - lat) * DEG2RAD;
    const theta = (lon + 180) * DEG2RAD;
    return [-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
  }

  class Globe {
    constructor(container, opts = {}) {
      this.container = container;
      this.meshes = []; this.byCode = {}; this.props = {}; this.owners = {};
      this.selectable = false; this.selectedCode = null; this.hoverCode = null;
      this._selectCb = null; this._hoverCb = null;
      this.autoRotate = opts.autoRotate !== false;
      this._initScene(); this._initControls();
      this._animate = this._animate.bind(this);
      this._raf = requestAnimationFrame(this._animate);
      this._onResize = () => this._resize();
      window.addEventListener('resize', this._onResize);
    }

    _initScene() {
      const w = this.container.clientWidth || 800, h = this.container.clientHeight || 600;
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
      this.camera.position.set(0, 0, 3.0);
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setSize(w, h);
      this.container.appendChild(this.renderer.domElement);
      this.world = new THREE.Group();
      this.world.rotation.x = 0.35;
      this.scene.add(this.world);

      this.world.add(new THREE.Mesh(
        new THREE.SphereGeometry(R * 0.998, 64, 48),
        new THREE.MeshPhongMaterial({ color: OCEAN, shininess: 10, specular: 0x1a3a6a })
      ));
      this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      const dir = new THREE.DirectionalLight(0xfff4dd, 0.7);
      dir.position.set(3, 2, 4);
      this.scene.add(dir);
      const rim = new THREE.DirectionalLight(0x7cc4ff, 0.35);
      rim.position.set(-4, 1, -2);
      this.scene.add(rim);
      // Atmosphere: two additive back-side shells.
      [[1.06, 0.14], [1.14, 0.06]].forEach(([s, o]) => this.scene.add(new THREE.Mesh(
        new THREE.SphereGeometry(R * s, 48, 32),
        new THREE.MeshBasicMaterial({ color: 0x3fa2ff, transparent: true, opacity: o, side: THREE.BackSide })
      )));
      this.raycaster = new THREE.Raycaster();
    }

    async load(url) {
      if (!_geoCache[url]) _geoCache[url] = fetch(url).then(r => r.json());
      const fc = await _geoCache[url];
      const borderPositions = [];
      for (const feat of fc.features) {
        const code = feat.properties.code;
        this.props[code] = feat.properties;
        const polys = feat.geometry.type === 'Polygon' ? [feat.geometry.coordinates] : feat.geometry.coordinates;
        const positions = [], indices = [];
        let vBase = 0;
        for (const poly of polys) {
          const flat = earcut.flatten(poly);
          const tris = earcut(flat.vertices, flat.holes, flat.dimensions);
          const V = flat.vertices;
          // Subdivide big flat triangles so the surface hugs the sphere (no chords dipping under the ocean).
          const MAX = 2.5;
          const emit = (a, b, c, depth) => {
            const d = (p, q) => Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1]));
            if (depth < 7 && Math.max(d(a, b), d(b, c), d(c, a)) > MAX) {
              const ab = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], bc = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2], ca = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2];
              emit(a, ab, ca, depth + 1); emit(ab, b, bc, depth + 1); emit(ca, bc, c, depth + 1); emit(ab, bc, ca, depth + 1);
              return;
            }
            for (const p of [a, b, c]) {
              const v = lonLatToVec3(p[0], p[1], R * 1.002);
              positions.push(v[0], v[1], v[2]);
              indices.push(vBase++);
            }
          };
          for (let i = 0; i < tris.length; i += 3) {
            const P = (k) => [V[tris[i + k] * 2], V[tris[i + k] * 2 + 1]];
            emit(P(0), P(1), P(2), 0);
          }
          for (const ring of poly) {
            for (let i = 0; i < ring.length - 1; i++) {
              const a = lonLatToVec3(ring[i][0], ring[i][1], R * 1.004);
              const b = lonLatToVec3(ring[i + 1][0], ring[i + 1][1], R * 1.004);
              borderPositions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
            }
          }
        }
        if (!positions.length) continue;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: NEUTRAL_LAND, shininess: 10, specular: 0x222222 }));
        mesh.userData.code = code;
        this.world.add(mesh);
        this.meshes.push(mesh);
        this.byCode[code] = mesh;
      }
      const bgeo = new THREE.BufferGeometry();
      bgeo.setAttribute('position', new THREE.Float32BufferAttribute(borderPositions, 3));
      this.world.add(new THREE.LineSegments(bgeo, new THREE.LineBasicMaterial({ color: 0x0a1120, transparent: true, opacity: 0.55 })));
      this._recolorAll();
      return this;
    }

    _initControls() {
      const el = this.renderer.domElement;
      let down = false, lx = 0, ly = 0, moved = 0;
      el.style.cursor = 'grab';
      el.addEventListener('pointerdown', (e) => { down = true; lx = e.clientX; ly = e.clientY; moved = 0; this._userActive = true; });
      this._onUp = (e) => { if (down && moved < 6) this._pick(e, true); down = false; };
      window.addEventListener('pointerup', this._onUp);
      el.addEventListener('pointermove', (e) => {
        if (down) {
          const dx = e.clientX - lx, dy = e.clientY - ly;
          lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
          this.world.rotation.y += dx * 0.005;
          this.world.rotation.x = Math.max(-1.2, Math.min(1.2, this.world.rotation.x + dy * 0.005));
        } else this._pick(e, false);
      });
      el.addEventListener('pointerleave', () => { if (this.hoverCode) { this.hoverCode = null; this._recolorAll(); if (this._hoverCb) this._hoverCb(null, null); } });
      el.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.camera.position.z = Math.max(1.5, Math.min(6, this.camera.position.z + e.deltaY * 0.0016));
      }, { passive: false });
    }

    _pick(e, isClick) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      this.raycaster.setFromCamera(ndc, this.camera);
      const hit = this.raycaster.intersectObjects(this.meshes, false)[0];
      const code = hit ? hit.object.userData.code : null;
      if (isClick) {
        if (code && this.selectable && this._selectCb) this._selectCb(code, this.props[code]);
      } else if (code !== this.hoverCode) {
        this.hoverCode = code;
        this.renderer.domElement.style.cursor = (code && this.selectable) ? 'pointer' : 'grab';
        this._recolorAll();
        if (this._hoverCb) this._hoverCb(code, code ? this.props[code] : null);
      }
    }

    _recolorAll() {
      for (const m of this.meshes) {
        const code = m.userData.code;
        let color = this.owners[code] ? new THREE.Color(this.owners[code]).getHex() : NEUTRAL_LAND;
        if (code === this.selectedCode) color = SELECTED;
        m.material.color.setHex(color);
        m.material.emissive.setHex(code === this.hoverCode ? HOVER_EMISSIVE : 0x000000);
      }
    }

    onSelect(cb) { this._selectCb = cb; return this; }
    onHover(cb) { this._hoverCb = cb; return this; }
    setSelectable(v) { this.selectable = !!v; return this; }
    setOwners(map) { this.owners = map || {}; this._recolorAll(); return this; }
    setSelected(code) { this.selectedCode = code; this._recolorAll(); return this; }
    getProps(code) { return this.props[code] || null; }

    // Globe-controls zoom: camera z +/- delta, clamped to [1.6, 5] (spec §2.9).
    setZoom(delta) { this.camera.position.z = Math.max(1.6, Math.min(5, this.camera.position.z + delta)); return this; }

    // Lenses: 'political' paints owner colours (+ teal selection); a resource lens
    // ('farmland'|'minerals'|'oil') colours every country lerp(#1c2740 -> hex, (attr/100)^0.8)
    // and hides the selection highlight (spec §2.9).
    setLens(lens, owners, selected) {
      if (!lens || lens === 'political') {
        this.owners = owners || {}; this.selectedCode = selected == null ? null : selected;
      } else {
        const hex = { farmland: '#7bc86c', minerals: '#c9d4ea', oil: '#a885d8' }[lens] || '#7bc86c';
        const lo = new THREE.Color('#1c2740'), hi = new THREE.Color(hex), map = {};
        for (const code in this.props) {
          const a = Math.max(0, Math.min(1, (Number(this.props[code][lens]) || 0) / 100));
          map[code] = '#' + lo.clone().lerp(hi, Math.pow(a, 0.8)).getHexString();
        }
        this.owners = map; this.selectedCode = null;
      }
      this._recolorAll(); return this;
    }

    focus(code) {
      const mesh = this.byCode[code];
      if (!mesh) return;
      mesh.geometry.computeBoundingSphere();
      const c = mesh.geometry.boundingSphere.center.clone().normalize();
      this._targetRotY = Math.atan2(-c.x, c.z);
      this._targetRotX = Math.min(0.92, Math.asin(Math.max(-1, Math.min(1, c.y))));  // keep northern capitals in view
      this._userActive = false;
    }

    _resize() {
      const w = this.container.clientWidth, h = this.container.clientHeight;
      if (!w || !h) return;
      this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }

    _animate() {
      this._raf = requestAnimationFrame(this._animate);
      if (this._targetRotY !== undefined && !this._userActive) {
        this.world.rotation.y += (this._targetRotY - this.world.rotation.y) * 0.08;
        this.world.rotation.x += (this._targetRotX - this.world.rotation.x) * 0.08;
      } else if (this.autoRotate && !this._userActive) {
        this.world.rotation.y += 0.0007;
      }
      this.renderer.render(this.scene, this.camera);
    }

    destroy() {
      cancelAnimationFrame(this._raf);
      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('pointerup', this._onUp);
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode) this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
  window.Globe = Globe;
})();
