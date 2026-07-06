/**
 * Vidal y Trautmann Chatbot & Quote Generator Engine
 * 
 * Provides pre-trained construction responses and handles a step-by-step
 * custom quoting process, yielding downloadable text/PDF reports.
 */

// Simple database of knowledge
const KNOWLEDGE_BASE = {
  saludo: `¡Hola! Qué gusto saludarte. En **Vidal y Trautmann** recibimos cada proyecto con la misma dedicación con la que una familia cuida su casa.

Cuéntame con confianza qué estás imaginando: una casa, cabaña, cocina, terraza, remodelación o mueble a medida. Puedo orientarte, darte rangos iniciales y ayudarte a coordinar una visita técnica.`,

  familia: `Somos una **constructora familiar** con años de oficio en construcción, madera y terminaciones. Nuestro sello es acompañar de cerca: escuchar bien, explicar claro y cuidar los detalles para que cada cliente se sienta parte de la familia Vidal y Trautmann.

Sabemos que una obra no es solo una construcción; muchas veces es el lugar donde una familia descansa, se reúne y proyecta su vida. Por eso buscamos que el proceso sea cercano, ordenado y transparente desde el primer contacto.`,

  servicios: `Podemos ayudarte en distintos tipos de proyectos:
- **Casas y cabañas**: construcción completa, ampliaciones y refugios de alto estándar.
- **Remodelaciones**: cocinas, baños, espacios interiores y mejoras funcionales.
- **Terrazas y exteriores**: decks, quinchos, revestimientos y soluciones para el sur de Chile.
- **Muebles a medida**: cocinas, clósets, vanitorios, escritorios y mobiliario integrado.

Si me cuentas qué quieres construir, te puedo orientar con el primer paso y una cotización estimada.`,

  maderas: `En **Vidal y Trautmann** seleccionamos maderas nativas y tratadas de primera calidad según el proyecto:
- **Estructuras**: Pino impregnado de alta resistencia, pino Oregón y ciprés.
- **Revestimientos**: Tejas de alerce, tejuelas de ciprés y tablas de pino seleccionado con tratamientos hidrorrepelentes.
- **Interiores**: Pino seleccionado (sin nudos) y maderas nativas (como Roble, Nogal o Coihue) para cubiertas y detalles finos.
- **Cocinas y Clósets**: Terciado marino de alta calidad y MDF con enchapados naturales laqueados mate.

Siempre buscamos equilibrar belleza, durabilidad y mantención realista para el clima del sur.`,
  
  plazos: `Nuestros plazos aproximados de entrega son:
- **Casas / Refugios de 60m² - 120m²**: Entre 4 y 6 meses desde el inicio de las obras en terreno.
- **Remodelación de Cocinas Premium**: De 3 a 5 semanas, dependiendo de la envergadura y si incluye obras civiles.
- **Muebles a Medida**: De 10 a 20 días hábiles de fabricación en taller y 1 a 2 días de instalación.
- **Terrazas y Decking**: De 1 a 2 semanas.

Para darte un plazo más fino necesitamos revisar medidas, acceso al terreno, nivel de terminaciones y disponibilidad de materiales.`,
  
  contacto: `Puedes contactarnos a través de los siguientes canales:
- **Teléfono**: +56 9 8765 4321
- **Correo Electrónico**: contacto@vidalytrautmann.cl
- **Ubicación**: Región de Los Lagos, Chile (atendemos Puerto Varas, Puerto Montt, Frutillar y alrededores).

Si deseas agendar una visita técnica presencial, déjame tu **nombre, teléfono, comuna y tipo de proyecto**. Así el equipo puede contactarte con una orientación más precisa.`,

  construccion: `Construimos bajo altos estándares de eficiencia térmica y estructural:
- **Aislación**: Aislación de poliuretano proyectado o lana mineral de alta densidad, garantizando confort térmico tanto en invierno como en verano.
- **Ventanales**: Instalamos ventanales termopanel (DVH) con marcos de PVC foliado madera o aluminio de ruptura térmica.
- **Fundaciones**: Fundaciones de hormigón armado o pilotes de acero galvanizado con tratamiento anticorrosión según la pendiente y tipo de terreno.

La recomendación final siempre se confirma con visita técnica, porque cada terreno tiene su propia historia.`,

  garantia: `Trabajamos con procesos ordenados y revisión por etapas:
- Levantamiento de necesidades y medidas.
- Propuesta técnica y presupuesto.
- Compra de materiales y planificación.
- Ejecución con seguimiento y terminaciones.
- Entrega conforme y recomendaciones de mantención.

Nuestro compromiso es que te sientas acompañado, informado y tranquilo durante todo el proceso.`,

  terreno: `Para evaluar un terreno conviene mirar acceso, pendiente, humedad, orientación, factibilidad de servicios y tipo de fundación. En el sur de Chile esto es clave para evitar problemas futuros.

Si quieres, puedo ayudarte a preparar una visita técnica. Déjame comuna, tipo de proyecto y una referencia de metros cuadrados.`
};

const normalizeText = (text) => text
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const includesAny = (text, terms) => terms.some(term => text.includes(term));

// Quote calculator constants
const QUOTE_FACTORS = {
  casa: { name: 'Casa o Cabaña Completa', basePricePerM2: 850000, timePerM2: 1.5 }, // CLP per m2
  cocina: { name: 'Remodelación de Cocina Premium', basePricePerM2: 450000, timePerM2: 0.8 },
  terraza: { name: 'Terraza / Deck Exterior', basePricePerM2: 180000, timePerM2: 0.3 },
  muebles: { name: 'Mueble a Medida Exclusivo', basePricePerM2: 250000, timePerM2: 0.5 }
};

const FINISHES_MULTIPLIERS = {
  standard: { name: 'Estándar Premium (Madera impregnada y melaminas finas)', factor: 1.0 },
  premium: { name: 'Premium Vidal (Cubiertas de cuarzo y detalles de madera nativa)', factor: 1.25 },
  luxury: { name: 'Lujo / Exclusivo (Cubiertas de mármol, herrajes alemanes y maderas nativas seleccionadas)', factor: 1.5 }
};

export class ChatbotEngine {
  constructor(messagesContainerId, suggestionsId) {
    this.container = document.getElementById(messagesContainerId);
    this.suggestions = document.getElementById(suggestionsId);
    this.state = {
      isQuoting: false,
      quoteStep: 0,
      quoteData: {}
    };
  }

  escapeHTML(text) {
    const wrapper = document.createElement('div');
    wrapper.textContent = text;
    return wrapper.innerHTML;
  }

  formatMessage(text) {
    return this.escapeHTML(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.*?)$/gm, '• $1<br>')
      .replace(/\n/g, '<br>');
  }

  // Add a message bubble to the container
  addMessage(text, isUser = false) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-msg' : 'system-msg'}`;
    const formattedText = this.formatMessage(text);

    messageDiv.innerHTML = `
      <div class="message-content">${formattedText}</div>
      <span class="message-time">${time}</span>
    `;
    
    this.container.appendChild(messageDiv);
    this.container.scrollTop = this.container.scrollHeight;
  }

  // Handle direct text messages from user
  handleUserMessage(messageText) {
    const cleanedText = normalizeText(messageText.trim());
    this.addMessage(messageText, true);

    // If user is currently in a step-by-step quoting flow
    if (this.state.isQuoting) {
      this.processQuoteFlow(cleanedText, messageText);
      return;
    }

    // Direct answer evaluation
    setTimeout(() => {
      if (includesAny(cleanedText, ['cotiza', 'precio', 'presupuesto', 'valor', 'cuanto cuesta', 'cuanto sale', 'costos'])) {
        this.startQuoting();
      } else if (includesAny(cleanedText, ['servicio', 'hacen', 'construyen', 'remodelan', 'cocina', 'cabana', 'casa', 'terraza', 'deck', 'mueble', 'closet', 'bano'])) {
        this.addMessage(KNOWLEDGE_BASE.servicios);
      } else if (includesAny(cleanedText, ['madera', 'arbol', 'pino', 'roble', 'cipres', 'alerce', 'coihue', 'material', 'materiales'])) {
        this.addMessage(KNOWLEDGE_BASE.maderas);
      } else if (includesAny(cleanedText, ['plazo', 'tiempo', 'meses', 'semanas', 'demora', 'entrega', 'cuando'])) {
        this.addMessage(KNOWLEDGE_BASE.plazos);
      } else if (includesAny(cleanedText, ['contacto', 'telefono', 'whatsapp', 'correo', 'mail', 'donde estan', 'direccion', 'ubicacion', 'visita', 'agenda', 'agendar'])) {
        this.addMessage(KNOWLEDGE_BASE.contacto);
      } else if (includesAny(cleanedText, ['garantia', 'proceso', 'etapas', 'seguimiento', 'contrato', 'pago', 'pagos'])) {
        this.addMessage(KNOWLEDGE_BASE.garantia);
      } else if (includesAny(cleanedText, ['terreno', 'pendiente', 'fundacion', 'fundaciones', 'suelo', 'humedad', 'parcela'])) {
        this.addMessage(KNOWLEDGE_BASE.terreno);
      } else if (includesAny(cleanedText, ['aisla', 'termico', 'calidad', 'vidrio', 'ventanales', 'termopanel', 'estructura'])) {
        this.addMessage(KNOWLEDGE_BASE.construccion);
      } else if (includesAny(cleanedText, ['familia', 'familiar', 'confianza', 'trayectoria', 'anos', 'experiencia', 'quienes son', 'sobre ustedes'])) {
        this.addMessage(KNOWLEDGE_BASE.familia);
      } else if (includesAny(cleanedText, ['hola', 'buenos dias', 'buen dia', 'buenas tardes', 'buenas noches', 'alo', 'hello'])) {
        this.addMessage(KNOWLEDGE_BASE.saludo);
      } else {
        this.addMessage(`Gracias por contarme. Para orientarte bien, necesito entender un poquito más tu proyecto.
        
Como asesor de **Vidal y Trautmann Construcciones**, puedo ayudarte con casas, cabañas, remodelaciones, cocinas, terrazas y muebles a medida. Si me indicas el tipo de obra, comuna y metros aproximados, te puedo dar una guía inicial con mucho gusto.

También puedes iniciar una **cotización estimada** con las opciones de abajo.`);
      }
    }, 600);
  }

  // Handle suggestion chips action
  handleAction(actionType) {
    if (actionType === 'quote') {
      this.startQuoting();
    } else if (KNOWLEDGE_BASE[actionType]) {
      this.addMessage(`Consulta rápida: **${actionType.toUpperCase()}**`, true);
      setTimeout(() => {
        this.addMessage(KNOWLEDGE_BASE[actionType]);
      }, 400);
    }
  }

  // Initializing Quoting Flow
  startQuoting() {
    this.state.isQuoting = true;
    this.state.quoteStep = 1;
    this.state.quoteData = {};
    
    this.addMessage(`Con mucho gusto. Iniciemos una cotización estimada para ordenar la idea y darte una primera referencia.
    
**Paso 1/4:** ¿Qué tipo de proyecto quieres realizar? Escribe el número correspondiente:
1. **Casa o Cabaña Completa**
2. **Remodelación de Cocina Premium**
3. **Terraza / Deck Exterior**
4. **Mobiliario a Medida Exclusivo**`);

    this.updateSuggestions([
      { text: '1. Casa o Cabaña', value: '1' },
      { text: '2. Cocina Premium', value: '2' },
      { text: '3. Terraza / Deck', value: '3' },
      { text: '4. Mueble Especial', value: '4' }
    ]);
  }

  // Multi-step Quoting flow logic
  processQuoteFlow(inputClean, originalInput) {
    setTimeout(() => {
      switch (this.state.quoteStep) {
        // Step 1: Project Type Selection
        case 1:
          let type = '';
          if (inputClean.includes('1') || inputClean.includes('casa') || inputClean.includes('cabana')) type = 'casa';
          else if (inputClean.includes('2') || inputClean.includes('cocina')) type = 'cocina';
          else if (inputClean.includes('3') || inputClean.includes('terraza') || inputClean.includes('deck')) type = 'terraza';
          else if (inputClean.includes('4') || inputClean.includes('mueble')) type = 'muebles';

          if (!type) {
            this.addMessage(`Para avanzar bien, selecciona una opción válida escribiendo el número (1 a 4) o el tipo de proyecto. Estoy contigo paso a paso.`);
            return;
          }

          this.state.quoteData.type = type;
          this.state.quoteStep = 2;
          
          if (type === 'muebles') {
            this.addMessage(`Perfecto, has seleccionado **${QUOTE_FACTORS[type].name}**.
            
**Paso 2/4:** Escribe las dimensiones aproximadas del mueble (por ejemplo: Ancho x Alto en metros, o los metros lineales que requieres).`);
            this.updateSuggestions([
              { text: '2 metros lineales', value: '2 metros' },
              { text: '3 metros lineales', value: '3 metros' },
              { text: 'Diseño mediano standard', value: 'mediano' }
            ]);
          } else {
            this.addMessage(`Perfecto, has seleccionado **${QUOTE_FACTORS[type].name}**.
            
**Paso 2/4:** ¿Cuántos **metros cuadrados (m²)** aproximados tendrá la obra? (Ejemplo: Escribe 80 o 120).`);
            this.updateSuggestions([
              { text: '30 m²', value: '30' },
              { text: '60 m²', value: '60' },
              { text: '100 m²', value: '100' },
              { text: '150 m²', value: '150' }
            ]);
          }
          break;

        // Step 2: Dimensions / Area
        case 2:
          let size = 0;
          if (this.state.quoteData.type === 'muebles') {
            // For furniture we extract quantity of meters, default 2
            size = parseFloat(inputClean.replace(/[^\d.]/g, '')) || 2;
            this.state.quoteData.sizeDesc = originalInput;
          } else {
            size = parseFloat(inputClean.replace(/[^\d.]/g, ''));
            if (!size || size <= 0) {
              this.addMessage(`Necesito un número válido para los metros cuadrados. Puede ser aproximado; por ejemplo: 80, 120 o 150.`);
              return;
            }
          }
          
          this.state.quoteData.size = size;
          this.state.quoteStep = 3;
          
          this.addMessage(`Gracias, registré **${size} ${this.state.quoteData.type === 'muebles' ? 'unidad/m' : 'm²'}** como referencia inicial.
          
**Paso 3/4:** ¿Qué nivel de terminación y acabados prefieres? Escribe el número correspondiente:
1. **Estándar Premium** (Estructura sólida, pino seleccionado seco e impregnado, terminación limpia).
2. **Premium Vidal** (Uso de maderas nativas en cubiertas/escaleras, griferías y cuarzo negro en cocina).
3. **Lujo Exclusivo** (Maderas nativas premium seleccionadas en su totalidad, mármoles importados, cristalería y revestimientos premium).`);
          
          this.updateSuggestions([
            { text: '1. Estándar Premium', value: '1' },
            { text: '2. Premium Vidal', value: '2' },
            { text: '3. Lujo Exclusivo', value: '3' }
          ]);
          break;

        // Step 3: Finishes Quality
        case 3:
          let finish = '';
          if (inputClean.includes('1') || inputClean.includes('estandar')) finish = 'standard';
          else if (inputClean.includes('2') || inputClean.includes('premium') || inputClean.includes('vidal')) finish = 'premium';
          else if (inputClean.includes('3') || inputClean.includes('lujo') || inputClean.includes('exclusivo')) finish = 'luxury';

          if (!finish) {
            this.addMessage(`Para calcular bien, selecciona una de las 3 opciones de terminación escribiendo 1, 2 o 3.`);
            return;
          }

          this.state.quoteData.finish = finish;
          this.state.quoteStep = 4;
          
          this.addMessage(`Excelente elección. Terminación seleccionada: **${FINISHES_MULTIPLIERS[finish].name}**.
          
**Paso 4/4:** Finalmente, indícanos tu **nombre y correo electrónico o teléfono** para registrar tu cotización y que el equipo pueda contactarte de forma cercana.`);
          
          this.updateSuggestions([]);
          break;

        // Step 4: Contact & Final Calculation
        case 4:
          this.state.quoteData.contact = originalInput;
          this.state.isQuoting = false;
          
          // Perform cost calculation
          const calculatedQuote = this.calculateEstimate();
          
          this.addMessage(`¡Muchas gracias, ${calculatedQuote.clientName}! Ya tenemos una primera estimación para conversar tu proyecto con más claridad:
          
### Resumen del Presupuesto Estimado
- **Proyecto**: ${calculatedQuote.projectName}
- **Dimensiones**: ${calculatedQuote.size} ${this.state.quoteData.type === 'muebles' ? 'm/uds' : 'm²'}
- **Terminación**: ${calculatedQuote.finishName}
- **Aproximación de Costo Total**: **$${calculatedQuote.totalPriceFormatted} CLP**
- **Plazo de Ejecución Estimado**: **${calculatedQuote.timeEstimate}**

*Este valor es una orientación inicial. Incluye materiales de alta calidad y mano de obra experta de Vidal y Trautmann, pero debe confirmarse con una visita técnica y revisión del terreno o espacio.*

Puedes descargar el informe y, si te acomoda, dejarnos el dato para coordinar el siguiente paso con calma.`);

          // Render a custom download action button directly in the chat container!
          this.renderDownloadButton(calculatedQuote);
          
          // Reset suggestions to default
          this.resetDefaultSuggestions();
          break;
      }
    }, 600);
  }

  // Calculate the numbers for quote
  calculateEstimate() {
    const data = this.state.quoteData;
    const project = QUOTE_FACTORS[data.type];
    const finishObj = FINISHES_MULTIPLIERS[data.finish];
    
    // Base cost calculation
    const baseCost = project.basePricePerM2 * data.size;
    const finalCost = baseCost * finishObj.factor;
    
    // Subdivisions of cost
    const materialsCost = Math.round(finalCost * 0.55);
    const laborCost = Math.round(finalCost * 0.35);
    const generalFees = Math.round(finalCost * 0.10);
    
    // Format currency
    const totalPriceFormatted = Math.round(finalCost).toLocaleString('es-CL');
    
    // Timeline calculation
    let timeWeeks = Math.ceil(data.size * project.timePerM2);
    if (data.type === 'casa') {
      timeWeeks = Math.max(16, timeWeeks); // Min 4 months for a house
    } else if (data.type === 'cocina') {
      timeWeeks = Math.max(3, timeWeeks);
    } else if (data.type === 'muebles') {
      timeWeeks = Math.max(2, timeWeeks);
    }
    
    let timeEstimate = '';
    if (timeWeeks >= 4) {
      const months = (timeWeeks / 4).toFixed(1);
      timeEstimate = `${months} meses aprox. (${timeWeeks} semanas)`;
    } else {
      timeEstimate = `${timeWeeks} semanas aprox.`;
    }

    // Extract first word as client name
    const clientName = data.contact.split(/[ ,]/)[0] || 'Cliente';

    return {
      clientName,
      contactInfo: data.contact,
      projectName: project.name,
      projectTypeKey: data.type,
      size: data.size,
      sizeDesc: data.sizeDesc || '',
      finishName: finishObj.name,
      materialsCost: materialsCost.toLocaleString('es-CL'),
      laborCost: laborCost.toLocaleString('es-CL'),
      generalFees: generalFees.toLocaleString('es-CL'),
      totalPrice: Math.round(finalCost),
      totalPriceFormatted,
      timeWeeks,
      timeEstimate
    };
  }

  // Inject a clickable download button in the chat log
  renderDownloadButton(calculatedQuote) {
    const btnContainer = document.createElement('div');
    btnContainer.className = 'message system-msg';
    
    const button = document.createElement('button');
    button.className = 'btn btn-primary';
    button.style.marginTop = '0.5rem';
    button.innerHTML = '<i class="fa-solid fa-file-arrow-down"></i> Descargar Cotización Oficial (TXT)';
    
    button.addEventListener('click', () => {
      this.downloadQuoteTextFile(calculatedQuote);
    });

    const msgContent = document.createElement('div');
    msgContent.className = 'message-content';
    msgContent.style.background = 'rgba(200, 150, 62, 0.08)';
    msgContent.style.borderColor = 'rgba(200, 150, 62, 0.3)';
    msgContent.appendChild(document.createTextNode('Se ha generado tu presupuesto formal. Descárgalo para guardar tus registros:'));
    msgContent.appendChild(button);
    
    btnContainer.appendChild(msgContent);
    this.container.appendChild(btnContainer);
    this.container.scrollTop = this.container.scrollHeight;
  }

  // Generates and downloads the text file
  downloadQuoteTextFile(q) {
    const dateStr = new Date().toLocaleDateString('es-CL');
    const quoteId = 'VT-' + Math.floor(1000 + Math.random() * 9000);
    
    const textContent = `======================================================================
                     VIDAL Y TRAUTMANN CONSTRUCCIONES
              Casas de Alta Gama, Remodelaciones & Mobiliario
                       Región de Los Lagos, Chile
======================================================================

DOCUMENTO DE COTIZACIÓN PRELIMINAR DE OBRA
Código de Registro: ${quoteId}
Fecha de Emisión: ${dateStr}

----------------------------------------------------------------------
1. DATOS DEL CLIENTE & CONTACTO
----------------------------------------------------------------------
Nombre Registrado: ${q.clientName}
Contacto provisto: ${q.contactInfo}

----------------------------------------------------------------------
2. ESPECIFICACIÓN DEL PROYECTO
----------------------------------------------------------------------
Tipo de Trabajo:   ${q.projectName}
Dimensiones:        ${q.size} ${q.projectTypeKey === 'muebles' ? 'unidades / metros lineales' : 'metros cuadrados (m²)'}
Línea de Acabados:  ${q.finishName}

----------------------------------------------------------------------
3. DESGLOSE ESTIMATIVO DE COSTOS (CLP)
----------------------------------------------------------------------
A. Materiales Seleccionados y Logística:    $${q.materialsCost} CLP
B. Mano de Obra Calificada (Carpintería):   $${q.laborCost} CLP
C. Gastos Generales, Permisos y Planos:     $${q.generalFees} CLP
----------------------------------------------------------------------
VALOR TOTAL NETO ESTIMADO:                 $${q.totalPriceFormatted} CLP
----------------------------------------------------------------------

* Nota: Los valores son estimados con el precio de los materiales a la fecha.
El desglose de materiales contempla maderas impregnadas estructuradas, herrajes de alto 
tránsito y cubiertas de cuarzo o madera nativa según la línea elegida.

----------------------------------------------------------------------
4. CRONOGRAMA & ENTREGA
----------------------------------------------------------------------
Tiempo Estimado de Ejecución: ${q.timeEstimate}
Fase 1: Preparación del terreno / Acopio de materiales en taller (15%)
Fase 2: Estructura base / Obra gruesa (45%)
Fase 3: Instalaciones / Revestimientos interiores y exteriores (25%)
Fase 4: Terminaciones finas e Inspección de calidad (15%)

----------------------------------------------------------------------
5. CONDICIONES DE PAGO & PROTOCOLO
----------------------------------------------------------------------
- 50% de anticipo para compra de materiales e inicio de faenas.
- 30% a la finalización de la obra gruesa o estructura principal.
- 20% contra entrega conforme y recepción a satisfacción del cliente.

Este presupuesto preliminar está sujeto a la validación técnica en
terreno por parte de los constructores principales de Vidal y Trautmann.

Para agendar la visita técnica y formalizar este presupuesto, por favor
comuníquese al +56 9 8765 4321 o responda a contacto@vidalytrautmann.cl 
mencionando el código de registro ${quoteId}.

======================================================================
         Gracias por confiar su proyecto a Vidal y Trautmann.
                   https://www.vidalytrautmann.cl
======================================================================`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Cotizacion_${q.projectTypeKey}_${quoteId}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // Update suggest chips
  updateSuggestions(suggestionsList) {
    this.suggestions.innerHTML = '';
    
    if (suggestionsList.length === 0) {
      this.suggestions.style.display = 'none';
      return;
    }

    this.suggestions.style.display = 'flex';
    suggestionsList.forEach(item => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.innerText = item.text;
      chip.addEventListener('click', () => {
        if (this.state.isQuoting) {
          this.addMessage(item.text, true);
          this.processQuoteFlow(item.value, item.text);
        } else {
          this.handleAction(item.value);
        }
      });
      this.suggestions.appendChild(chip);
    });
  }

  resetDefaultSuggestions() {
    this.updateSuggestions([
      { text: '📊 Iniciar Cotización', value: 'quote' },
      { text: '🏡 ¿Qué construyen?', value: 'servicios' },
      { text: '🤝 Trato familiar', value: 'familia' },
      { text: '📞 Solicitar visita técnica', value: 'contacto' },
      { text: '⏱️ Plazos de construcción', value: 'plazos' }
    ]);
  }
}
