import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Predefined wood colors and specifications
const WOOD_MATERIALS = {
  pino: { color: 0xdfba8c, roughness: 0.6, metalness: 0.05, label: 'Pino Claro seleccionado' },
  roble: { color: 0xa47a4c, roughness: 0.5, metalness: 0.05, label: 'Roble Rosado Natural' },
  nogal: { color: 0x583c24, roughness: 0.45, metalness: 0.1, label: 'Nogal Oscuro Encerado' },
  wengue: { color: 0x2b1d14, roughness: 0.7, metalness: 0.05, label: 'Wengué Ébano' }
};

export class FurnitureDesigner3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    // Dimensions state (in cm)
    this.state = {
      type: 'repisa', // 'repisa', 'mesa', 'gabinete'
      width: 120,
      height: 180,
      depth: 40,
      shelves: 4,
      material: 'pino'
    };

    // Keep track of meshes
    this.furnitureGroup = new THREE.Group();
    
    // Board thickness (1.8 cm, typical melamina/wood board)
    this.boardThickness = 1.8;

    this.initThree();
    this.createLights();
    this.createEnvironment();
    this.scene.add(this.furnitureGroup);
    this.updateFurnitureMesh();
    this.animate();

    // Hide loader
    const loader = this.container.querySelector('.canvas-loader');
    if (loader) loader.style.display = 'none';

    // Handle resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  // Set up scene, camera, renderer, controls
  initThree() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x171f1b); // dark greenish charcoal
    this.scene.fog = new THREE.FogExp2(0x171f1b, 0.15);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    // Position camera slightly offset to view 3D object
    this.camera.position.set(2.5, 2, 3.5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    this.container.appendChild(this.renderer.domElement);

    // Orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't go below floor
    this.controls.minDistance = 1;
    this.controls.maxDistance = 10;
    this.controls.target.set(0, 0.8, 0); // Focus controls slightly above floor
  }

  // Create soft studio lights
  createLights() {
    // Ambient fill light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Main spotlight casting soft shadows
    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    this.dirLight.position.set(3, 5, 2.5);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 15;
    
    const d = 2;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;

    this.scene.add(this.dirLight);

    // Soft point light from opposite side for depth
    const pointLight = new THREE.PointLight(0xffecc4, 0.4, 10);
    pointLight.position.set(-2, 3, -1);
    this.scene.add(pointLight);
  }

  // Create ground grid and floor plane
  createEnvironment() {
    // Floor mesh
    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111613,
      roughness: 0.8,
      metalness: 0.1
    });
    
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Grid helper
    const grid = new THREE.GridHelper(10, 20, 0xc8963e, 0x222d27);
    grid.position.y = 0.001; // slightly above plane to prevent clipping
    grid.material.opacity = 0.18;
    grid.material.transparent = true;
    this.scene.add(grid);
  }

  // Re-generate furniture parts when state updates
  updateFurnitureMesh() {
    // Clear previous mesh pieces
    while (this.furnitureGroup.children.length > 0) {
      const obj = this.furnitureGroup.children[0];
      this.furnitureGroup.remove(obj);
    }

    // Material definitions
    const matProps = WOOD_MATERIALS[this.state.material];
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: matProps.color,
      roughness: matProps.roughness,
      metalness: matProps.metalness
    });

    // Dark grey material for hinges/handles/metal parts
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.3,
      metalness: 0.8
    });

    // Dimensions in meters for Three.js scaling
    const W = this.state.width / 100;
    const H = this.state.height / 100;
    const D = this.state.depth / 100;
    const T = this.boardThickness / 100;

    if (this.state.type === 'repisa') {
      this.buildRepisa(W, H, D, T, woodMaterial);
    } else if (this.state.type === 'mesa') {
      this.buildMesa(W, H, D, T, woodMaterial);
    } else if (this.state.type === 'gabinete') {
      this.buildGabinete(W, H, D, T, woodMaterial, metalMaterial);
    }

    // Recenter group on the floor (Y starts at 0)
    this.furnitureGroup.position.set(0, 0, 0);

    // Adjust camera target slowly to adapt to size
    const targetY = H / 2;
    this.controls.target.set(0, targetY, 0);
  }

  // 1. BUILD BOOKSHELF (REPISA)
  buildRepisa(W, H, D, T, woodMat) {
    // Left side panel
    const sideGeo = new THREE.BoxGeometry(T, H, D);
    const leftPanel = new THREE.Mesh(sideGeo, woodMat);
    leftPanel.position.set(-W/2 + T/2, H/2, 0);
    leftPanel.castShadow = true;
    leftPanel.receiveShadow = true;
    this.furnitureGroup.add(leftPanel);

    // Right side panel
    const rightPanel = leftPanel.clone();
    rightPanel.position.set(W/2 - T/2, H/2, 0);
    this.furnitureGroup.add(rightPanel);

    // Top panel
    const topBottomGeo = new THREE.BoxGeometry(W - 2*T, T, D);
    const topPanel = new THREE.Mesh(topBottomGeo, woodMat);
    topPanel.position.set(0, H - T/2, 0);
    topPanel.castShadow = true;
    topPanel.receiveShadow = true;
    this.furnitureGroup.add(topPanel);

    // Bottom panel
    const bottomPanel = topPanel.clone();
    bottomPanel.position.set(0, T/2, 0);
    this.furnitureGroup.add(bottomPanel);

    // Back board (thin MDF panel)
    const backGeo = new THREE.BoxGeometry(W, H, 0.003);
    const backPanel = new THREE.Mesh(backGeo, woodMat);
    backPanel.position.set(0, H/2, -D/2 + 0.0015);
    backPanel.castShadow = false;
    backPanel.receiveShadow = true;
    this.furnitureGroup.add(backPanel);

    // Shelves (repartition inside)
    const numShelves = this.state.shelves;
    const shelfSpacing = (H - 2*T) / (numShelves - 1);
    
    const shelfGeo = new THREE.BoxGeometry(W - 2*T, T, D - 0.02); // shelves slightly shallower

    for (let i = 1; i < numShelves - 1; i++) {
      const shelf = new THREE.Mesh(shelfGeo, woodMat);
      shelf.position.set(0, T + i * shelfSpacing, 0.01);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      this.furnitureGroup.add(shelf);
    }
  }

  // 2. BUILD TABLE (MESA)
  buildMesa(W, H, D, T, woodMat) {
    const tableTopThickness = T * 1.5; // thicker top
    
    // Table Top slab
    const topGeo = new THREE.BoxGeometry(W, tableTopThickness, D);
    const tableTop = new THREE.Mesh(topGeo, woodMat);
    tableTop.position.set(0, H - tableTopThickness/2, 0);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    this.furnitureGroup.add(tableTop);

    // Legs dimensions
    const legW = 0.07; // 7 cm thick legs
    const legH = H - tableTopThickness;
    const legGeo = new THREE.BoxGeometry(legW, legH, legW);

    // Position offset for legs (slightly inset from table edge)
    const offsetX = W/2 - legW/2 - 0.03;
    const offsetZ = D/2 - legW/2 - 0.03;
    const legY = legH / 2;

    const legPositions = [
      [-offsetX, legY, -offsetZ],
      [offsetX, legY, -offsetZ],
      [-offsetX, legY, offsetZ],
      [offsetX, legY, offsetZ]
    ];

    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      leg.receiveShadow = true;
      this.furnitureGroup.add(leg);
    });

    // Support frames underneath table top
    const frameGeoX = new THREE.BoxGeometry(W - 2*legW - 0.06, 0.06, 0.02);
    const frameX1 = new THREE.Mesh(frameGeoX, woodMat);
    frameX1.position.set(0, H - tableTopThickness - 0.03, -offsetZ + legW/2);
    this.furnitureGroup.add(frameX1);

    const frameX2 = frameX1.clone();
    frameX2.position.set(0, H - tableTopThickness - 0.03, offsetZ - legW/2);
    this.furnitureGroup.add(frameX2);
  }

  // 3. BUILD CABINET (GABINETE)
  buildGabinete(W, H, D, T, woodMat, metalMat) {
    // Outer structure: top, bottom, left, right (similar to bookshelf but with doors)
    // Left side panel
    const sideGeo = new THREE.BoxGeometry(T, H, D);
    const leftPanel = new THREE.Mesh(sideGeo, woodMat);
    leftPanel.position.set(-W/2 + T/2, H/2, 0);
    leftPanel.castShadow = true;
    leftPanel.receiveShadow = true;
    this.furnitureGroup.add(leftPanel);

    // Right side panel
    const rightPanel = leftPanel.clone();
    rightPanel.position.set(W/2 - T/2, H/2, 0);
    this.furnitureGroup.add(rightPanel);

    // Top panel
    const topBottomGeo = new THREE.BoxGeometry(W - 2*T, T, D);
    const topPanel = new THREE.Mesh(topBottomGeo, woodMat);
    topPanel.position.set(0, H - T/2, 0);
    topPanel.castShadow = true;
    topPanel.receiveShadow = true;
    this.furnitureGroup.add(topPanel);

    // Bottom panel
    const bottomPanel = topPanel.clone();
    bottomPanel.position.set(0, T/2, 0);
    this.furnitureGroup.add(bottomPanel);

    // Back panel
    const backGeo = new THREE.BoxGeometry(W, H, 0.003);
    const backPanel = new THREE.Mesh(backGeo, woodMat);
    backPanel.position.set(0, H/2, -D/2 + 0.0015);
    this.furnitureGroup.add(backPanel);

    // Middle shelves divider (horizontal)
    const shelfGeo = new THREE.BoxGeometry(W - 2*T, T, D - 0.03);
    const numShelves = Math.max(2, this.state.shelves - 1);
    const spacing = (H - 2*T) / numShelves;
    
    for (let i = 1; i < numShelves; i++) {
      const midShelf = new THREE.Mesh(shelfGeo, woodMat);
      midShelf.position.set(0, T + i * spacing, 0.015);
      midShelf.castShadow = true;
      midShelf.receiveShadow = true;
      this.furnitureGroup.add(midShelf);
    }

    // Front Doors (split in half)
    const doorW = (W - 0.004) / 2; // thin gap in center
    const doorH = H - 0.008; // small gap top/bottom
    const doorD = 0.018; // door thickness
    const doorGeo = new THREE.BoxGeometry(doorW, doorH, doorD);

    // Left Door
    const leftDoor = new THREE.Mesh(doorGeo, woodMat);
    leftDoor.position.set(-doorW/2 - 0.001, H/2, D/2 + doorD/2);
    leftDoor.castShadow = true;
    leftDoor.receiveShadow = true;
    this.furnitureGroup.add(leftDoor);

    // Right Door
    const rightDoor = new THREE.Mesh(doorGeo, woodMat);
    rightDoor.position.set(doorW/2 + 0.001, H/2, D/2 + doorD/2);
    rightDoor.castShadow = true;
    rightDoor.receiveShadow = true;
    this.furnitureGroup.add(rightDoor);

    // Metal Handles (rendered on doors)
    const handleGeo = new THREE.BoxGeometry(0.015, 0.12, 0.015);
    const handleL = new THREE.Mesh(handleGeo, metalMat);
    handleL.position.set(-0.04, 0, doorD/2 + 0.008); // center vertically
    leftDoor.add(handleL);

    const handleR = handleL.clone();
    handleR.position.set(0.04, 0, doorD/2 + 0.008);
    rightDoor.add(handleR);
  }

  // Three.js animation loop
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    // Slow default rotation if user isn't interacting
    if (!this.controls.state == -1) {
      this.furnitureGroup.rotation.y += 0.002;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // Update states
  updateDimension(dimension, value) {
    this.state[dimension] = parseFloat(value);
    
    // Limits dependencies
    if (dimension === 'type') {
      const wEl = document.getElementById('slider-width');
      const hEl = document.getElementById('slider-height');
      const dEl = document.getElementById('slider-depth');
      const sEl = document.getElementById('slider-shelves');
      const sGroup = document.getElementById('group-shelves');

      if (value === 'mesa') {
        // Mesa limits
        wEl.min = 100; wEl.max = 240; wEl.value = 160;
        hEl.min = 70; hEl.max = 85; hEl.value = 75;
        dEl.min = 60; dEl.max = 120; dEl.value = 80;
        if (sGroup) sGroup.style.display = 'none'; // mesa doesn't need shelves slider
      } else if (value === 'gabinete') {
        // Cabinet limits
        wEl.min = 60; wEl.max = 180; wEl.value = 100;
        hEl.min = 60; hEl.max = 220; hEl.value = 90;
        dEl.min = 35; dEl.max = 70; dEl.value = 50;
        if (sGroup) {
          sGroup.style.display = 'block';
          sEl.min = 2; sEl.max = 5; sEl.value = 3;
          document.getElementById('val-shelves').innerText = '3 divisiones';
        }
      } else {
        // Bookshelf limits
        wEl.min = 60; wEl.max = 200; wEl.value = 120;
        hEl.min = 100; hEl.max = 240; hEl.value = 180;
        dEl.min = 25; dEl.max = 60; dEl.value = 40;
        if (sGroup) {
          sGroup.style.display = 'block';
          sEl.min = 2; sEl.max = 7; sEl.value = 4;
          document.getElementById('val-shelves').innerText = '4 niveles';
        }
      }

      // Read adjusted slider values
      this.state.width = parseFloat(wEl.value);
      this.state.height = parseFloat(hEl.value);
      this.state.depth = parseFloat(dEl.value);
      this.state.shelves = sEl ? parseFloat(sEl.value) : 0;
      
      // Update displays
      document.getElementById('val-width').innerText = `${wEl.value} cm`;
      document.getElementById('val-height').innerText = `${hEl.value} cm`;
      document.getElementById('val-depth').innerText = `${dEl.value} cm`;
    }

    this.updateFurnitureMesh();
    this.updateMaterialSummary();
  }

  updateMaterial(materialKey) {
    this.state.material = materialKey;
    this.updateFurnitureMesh();
    this.updateMaterialSummary();
  }

  // Update text summary in the UI config box
  updateMaterialSummary() {
    const piecesCount = this.calculatePiecesCount();
    const sumEl = document.getElementById('summary-pieces-count');
    if (sumEl) sumEl.innerText = `${piecesCount} piezas de madera`;

    const box = document.querySelector('.material-summary-box p');
    if (box) {
      const woodLabel = WOOD_MATERIALS[this.state.material].label;
      box.innerHTML = `Maderas sugeridas: <strong>${woodLabel} de 18mm</strong>.`;
    }
  }

  calculatePiecesCount() {
    if (this.state.type === 'repisa') {
      return 2 + 2 + (this.state.shelves - 2) + 1; // 2 sides + top/bottom + inner shelves + back
    } else if (this.state.type === 'mesa') {
      return 1 + 4 + 2 + 2; // top + 4 legs + support beams X & Y
    } else if (this.state.type === 'gabinete') {
      return 2 + 2 + 1 + (this.state.shelves - 1) + 2; // shell + back + shelves + 2 front doors
    }
    return 10;
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  // Generate technical plan and trigger text download
  downloadPlans() {
    const dateStr = new Date().toLocaleDateString('es-CL');
    const projectCode = 'PLAN-' + this.state.type.toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
    
    // Fetch state dimensions in mm
    const w = this.state.width * 10;
    const h = this.state.height * 10;
    const d = this.state.depth * 10;
    const t = this.boardThickness * 10;
    
    const matName = WOOD_MATERIALS[this.state.material].label;

    let plansText = `======================================================================
               PLANOS TÉCNICOS DE DESPIECE & ARMADO
              Constructora Vidal y Trautmann S.A.
======================================================================
Código de Planos:  ${projectCode}
Proyecto Mueble:  ${this.state.type.toUpperCase()} personalizado
Material Sugerido: ${matName} de ${this.boardThickness} cm (18mm)
Fecha de Diseño:   ${dateStr}

DIMENSIONES EXTERIORES GENERALES:
- Ancho:        ${this.state.width} cm (${w} mm)
- Alto:         ${this.state.height} cm (${h} mm)
- Profundidad:  ${this.state.depth} cm (${d} mm)

----------------------------------------------------------------------
1. LISTA DE CORTES (DIMENSIONES EN MILÍMETROS)
----------------------------------------------------------------------
Espesor del tablero: ${t} mm. Se asume tapacantos de PVC de 1mm en bordes visibles.
`;

    if (this.state.type === 'repisa') {
      plansText += `
- [2 uds] Costados Laterales:    ${h} x ${d} x 18 mm
- [1 ud]  Tablero Techo:         ${w - 2*t} x ${d} x 18 mm (Fijación interior)
- [1 ud]  Tablero Zócalo/Base:   ${w - 2*t} x ${d} x 18 mm (Fijación interior)
- [${this.state.shelves - 2} uds] Repisas Interiores:    ${w - 2*t} x ${d - 20} x 18 mm (Inserción con soportes)
- [1 ud]  Fondo Tracero (MDF):   ${h} x ${w} x 3 mm (Instalado en rebaje lateral)

TOTAL MATERIAL ESTIMADO: 1 Tablero completo de 1.83 x 2.44 mts.`;
    } else if (this.state.type === 'mesa') {
      const topT = Math.round(t * 1.5);
      plansText += `
- [1 ud]  Cubierta de Mesa:     ${w} x ${d} x ${topT} mm (Esquinas pulidas y canteadas)
- [4 uds] Patas Cuadradas:       ${h - topT} x 70 x 70 mm (Madera maciza cepillada)
- [2 uds] Largueros Soporte X:   ${w - 200} x 70 x 18 mm (Fijación inferior interna)
- [2 uds] Travesaños Soporte Z:  ${d - 200} x 70 x 18 mm (Fijación inferior interna)

TOTAL MATERIAL ESTIMADO: Cubierta laminada y listones de madera estructural de 2x3 pulgadas.`;
    } else if (this.state.type === 'gabinete') {
      const doorW = Math.round((w - 4) / 2);
      const doorH = h - 8;
      plansText += `
- [2 uds] Costados Laterales:    ${h} x ${d} x 18 mm
- [1 ud]  Tablero Techo:         ${w - 2*t} x ${d} x 18 mm
- [1 ud]  Tablero Base:          ${w - 2*t} x ${d} x 18 mm
- [${this.state.shelves - 1} uds] Repisas Regulables:   ${w - 2*t} x ${d - 30} x 18 mm
- [2 uds] Puertas Frontales:     ${doorH} x ${doorW} x 18 mm
- [1 ud]  Fondo Tracero (MDF):   ${h} x ${w} x 3 mm

TOTAL MATERIAL ESTIMADO: 1.5 Tableros de melamina de alta densidad / Terciado enchapado.`;
    }

    plansText += `

----------------------------------------------------------------------
2. ACCESORIOS & HERRAJES REQUERIDOS
----------------------------------------------------------------------
`;

    if (this.state.type === 'repisa') {
      plansText += `- Tornillos soberbios de 2" (50mm): 16 unidades.
- Tarugos de madera 8mm: 20 unidades.
- Soportes porta repisa cilíndricos: ${(this.state.shelves - 2) * 4} unidades.
- Deslizadores para base: 4 unidades.`;
    } else if (this.state.type === 'mesa') {
      plansText += `- Escuadras metálicas de ángulo reforzado (L): 8 unidades.
- Tornillos tirafondo 1 1/2" para cubierta: 16 unidades.
- Adhesivo de poliuretano para madera (Cola fría profesional D3).
- Pernos coche de 3" con tuerca y golilla: 8 unidades.`;
    } else if (this.state.type === 'gabinete') {
      plansText += `- Bisagras reten cazoleta 35mm (cierre suave): ${Math.ceil(h/600) * 2} unidades.
- Tiradores metálicos de perfil / manilla plateada: 2 unidades.
- Tornillos soberbios de 2" (50mm): 16 unidades.
- Soportes de repisa regulables: ${(this.state.shelves - 1) * 4} unidades.`;
    }

    plansText += `

----------------------------------------------------------------------
3. INSTRUCCIONES PASO A PASO PARA EL ENSAMBLE
----------------------------------------------------------------------
1. PREPARACIÓN: Rectifique todas las piezas cortadas. Lije los bordes y aplique el tapacanto de PVC (fino o grueso) en las caras frontales expuestas de los tableros con calor o adhesivo de contacto.
2. PERFORACIONES: Realice las perforaciones guía con broca de 3mm en las fijaciones. En gabinetes, avellane los agujeros soberbios e instale las cazoletas de 35mm en las puertas a 100mm de los extremos.
3. ARMADO DE ESTRUCTURA: Ensamble el marco perimetral (Laterales unidos a base y techo). Utilice cola fría profesional en las uniones de madera y fije firmemente con los tornillos soberbios.
4. FONDO: Cuadre el mueble midiendo las diagonales de esquina a esquina. Clave o atornille el MDF de 3mm en el contorno posterior cada 150mm.
5. COMPONENTES INTERNOS:`;

    if (this.state.type === 'repisa' || this.state.type === 'gabinete') {
      plansText += ` Marque las alturas de las repisas deseadas y perfore a 5mm de profundidad con broca de 5mm. Instale los soportes porta-repisas y posicione las baldas en su lugar.`;
    } else if (this.state.type === 'mesa') {
      plansText += ` Ensamble las vigas de soporte (largueros) a las patas utilizando pernos coche y adhesivo. Una vez seca la estructura, fíjela a la cara inferior de la cubierta mediante escuadras en L y tornillos cortos.`;
    }

    if (this.state.type === 'gabinete') {
      plansText += `
6. PUERTAS Y REGULACIÓN: Atornille las bases de bisagras en las caras interiores de los costados laterales. Monte las puertas y ajuste los tornillos de calibración tridimensional de las bisagras hasta nivelar la separación central de 2mm. Instale los tiradores metálicos.`;
    }

    plansText += `
${this.state.type === 'mesa' ? '6' : '7'}. TERMINACIÓN: Cubra las cabezas de tornillos expuestas con tapatornillos autoadhesivos de color coincidente o masilla de madera. Aplique sellador y laca (o cera de abejas en maderas nativas) para realzar el veteado natural.

======================================================================
Este plano interactivo fue generado por la plataforma web 3D de 
Vidal y Trautmann Construcciones. Si prefiere que fabriquemos e instalemos
este mueble a medida en su hogar, contáctenos citando el plano ${projectCode}.
======================================================================`;

    const blob = new Blob([plansText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Planos_Mueble_${this.state.type}_${projectCode}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
