const CHAT_KNOWLEDGE = {
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
- **Interiores**: Pino seleccionado y maderas nativas como roble, nogal o coihue para cubiertas y detalles finos.
- **Cocinas y clósets**: Terciado marino de alta calidad y MDF con enchapados naturales laqueados mate.

Siempre buscamos equilibrar belleza, durabilidad y mantención realista para el clima del sur.`,

  plazos: `Nuestros plazos aproximados de entrega son:
- **Casas o refugios de 60 m² a 120 m²**: entre 4 y 6 meses desde el inicio de obras.
- **Remodelación de cocinas premium**: de 3 a 5 semanas, según alcance.
- **Muebles a medida**: de 10 a 20 días hábiles de fabricación y 1 a 2 días de instalación.
- **Terrazas y decking**: de 1 a 2 semanas.

Para darte un plazo más fino necesitamos revisar medidas, acceso al terreno, nivel de terminaciones y disponibilidad de materiales.`,

  contacto: `Puedes contactarnos a través de estos canales:
- **Teléfono / WhatsApp**: +56 9 8765 4321
- **Correo electrónico**: contacto@vidalytrautmann.cl
- **Ubicación**: Región de Los Lagos, Chile. Atendemos Puerto Varas, Puerto Montt, Frutillar y alrededores.

Si deseas una visita técnica, déjame tu **nombre, teléfono, comuna y tipo de proyecto**. Así el equipo puede contactarte con una orientación más precisa.`,

  construccion: `Construimos bajo altos estándares de eficiencia térmica y estructural:
- **Aislación**: poliuretano proyectado o lana mineral de alta densidad para buen confort térmico.
- **Ventanales**: termopanel con marcos de PVC foliado madera o aluminio con ruptura térmica.
- **Fundaciones**: hormigón armado o pilotes de acero galvanizado, según pendiente y tipo de terreno.

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

const QUOTE_FACTORS = {
  casa: { name: 'Casa o Cabaña Completa', basePricePerM2: 850000, timePerM2: 1.5 },
  cocina: { name: 'Remodelación de Cocina Premium', basePricePerM2: 450000, timePerM2: 0.8 },
  terraza: { name: 'Terraza / Deck Exterior', basePricePerM2: 180000, timePerM2: 0.3 },
  muebles: { name: 'Mueble a Medida Exclusivo', basePricePerM2: 250000, timePerM2: 0.5 }
};

const FINISHES = {
  standard: { name: 'Estándar Premium', factor: 1 },
  premium: { name: 'Premium Vidal', factor: 1.25 },
  luxury: { name: 'Lujo Exclusivo', factor: 1.5 }
};

const normalizeText = (text) => text
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const includesAny = (text, terms) => terms.some(term => text.includes(term));

class ChatbotEngine {
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

  addMessage(text, isUser = false) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-msg' : 'system-msg'}`;
    messageDiv.innerHTML = `
      <div class="message-content">${this.formatMessage(text)}</div>
      <span class="message-time">${time}</span>
    `;

    this.container.appendChild(messageDiv);
    this.container.scrollTop = this.container.scrollHeight;
  }

  handleUserMessage(messageText) {
    const cleanedText = normalizeText(messageText.trim());
    this.addMessage(messageText, true);

    if (this.state.isQuoting) {
      this.processQuoteFlow(cleanedText, messageText);
      return;
    }

    setTimeout(() => {
      if (includesAny(cleanedText, ['cotiza', 'precio', 'presupuesto', 'valor', 'cuanto cuesta', 'cuanto sale', 'costos'])) {
        this.startQuoting();
      } else if (includesAny(cleanedText, ['servicio', 'hacen', 'construyen', 'remodelan', 'cocina', 'cabana', 'casa', 'terraza', 'deck', 'mueble', 'closet', 'bano'])) {
        this.addMessage(CHAT_KNOWLEDGE.servicios);
      } else if (includesAny(cleanedText, ['madera', 'arbol', 'pino', 'roble', 'cipres', 'alerce', 'coihue', 'material', 'materiales'])) {
        this.addMessage(CHAT_KNOWLEDGE.maderas);
      } else if (includesAny(cleanedText, ['plazo', 'tiempo', 'meses', 'semanas', 'demora', 'entrega', 'cuando'])) {
        this.addMessage(CHAT_KNOWLEDGE.plazos);
      } else if (includesAny(cleanedText, ['contacto', 'telefono', 'whatsapp', 'correo', 'mail', 'donde estan', 'direccion', 'ubicacion', 'visita', 'agenda', 'agendar', 'asesor'])) {
        this.addMessage(CHAT_KNOWLEDGE.contacto);
      } else if (includesAny(cleanedText, ['garantia', 'proceso', 'etapas', 'seguimiento', 'contrato', 'pago', 'pagos'])) {
        this.addMessage(CHAT_KNOWLEDGE.garantia);
      } else if (includesAny(cleanedText, ['terreno', 'pendiente', 'fundacion', 'fundaciones', 'suelo', 'humedad', 'parcela'])) {
        this.addMessage(CHAT_KNOWLEDGE.terreno);
      } else if (includesAny(cleanedText, ['aisla', 'termico', 'calidad', 'vidrio', 'ventanales', 'termopanel', 'estructura'])) {
        this.addMessage(CHAT_KNOWLEDGE.construccion);
      } else if (includesAny(cleanedText, ['familia', 'familiar', 'confianza', 'trayectoria', 'anos', 'experiencia', 'quienes son', 'sobre ustedes'])) {
        this.addMessage(CHAT_KNOWLEDGE.familia);
      } else if (includesAny(cleanedText, ['hola', 'buenos dias', 'buen dia', 'buenas tardes', 'buenas noches', 'alo', 'hello'])) {
        this.addMessage(CHAT_KNOWLEDGE.saludo);
      } else {
        this.addMessage(`Gracias por contarme. Para orientarte bien, necesito entender un poquito más tu proyecto.

Como asesor de **Vidal y Trautmann Construcciones**, puedo ayudarte con casas, cabañas, remodelaciones, cocinas, terrazas y muebles a medida. Si me indicas el tipo de obra, comuna y metros aproximados, te puedo dar una guía inicial con mucho gusto.

También puedes iniciar una **cotización estimada** con las opciones de abajo.`);
      }
    }, 350);
  }

  handleAction(actionType) {
    if (actionType === 'quote') {
      this.startQuoting();
      return;
    }

    if (CHAT_KNOWLEDGE[actionType]) {
      this.addMessage(`Consulta rápida: **${actionType.toUpperCase()}**`, true);
      setTimeout(() => this.addMessage(CHAT_KNOWLEDGE[actionType]), 250);
    }
  }

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

  processQuoteFlow(inputClean, originalInput) {
    setTimeout(() => {
      if (this.state.quoteStep === 1) {
        let type = '';
        if (inputClean.includes('1') || inputClean.includes('casa') || inputClean.includes('cabana')) type = 'casa';
        else if (inputClean.includes('2') || inputClean.includes('cocina')) type = 'cocina';
        else if (inputClean.includes('3') || inputClean.includes('terraza') || inputClean.includes('deck')) type = 'terraza';
        else if (inputClean.includes('4') || inputClean.includes('mueble')) type = 'muebles';

        if (!type) {
          this.addMessage('Para avanzar bien, selecciona una opción válida escribiendo 1, 2, 3 o 4. Estoy contigo paso a paso.');
          return;
        }

        this.state.quoteData.type = type;
        this.state.quoteStep = 2;
        this.addMessage(`Perfecto, has seleccionado **${QUOTE_FACTORS[type].name}**.

**Paso 2/4:** ${type === 'muebles' ? 'Indícame los metros lineales o dimensiones aproximadas del mueble.' : '¿Cuántos metros cuadrados aproximados tendrá la obra? Puedes escribir 80, 120 o 150.'}`);
        this.updateSuggestions(type === 'muebles'
          ? [
              { text: '2 metros lineales', value: '2' },
              { text: '3 metros lineales', value: '3' },
              { text: 'Diseño mediano', value: '2' }
            ]
          : [
              { text: '30 m²', value: '30' },
              { text: '60 m²', value: '60' },
              { text: '100 m²', value: '100' },
              { text: '150 m²', value: '150' }
            ]);
        return;
      }

      if (this.state.quoteStep === 2) {
        const size = parseFloat(inputClean.replace(/[^\d.]/g, ''));
        if (!size || size <= 0) {
          this.addMessage('Necesito un número válido para calcular. Puede ser aproximado; por ejemplo: 80, 120 o 150.');
          return;
        }

        this.state.quoteData.size = size;
        this.state.quoteStep = 3;
        this.addMessage(`Gracias, registré **${size} ${this.state.quoteData.type === 'muebles' ? 'm lineales / referencia' : 'm²'}**.

**Paso 3/4:** ¿Qué nivel de terminación prefieres?
1. **Estándar Premium**
2. **Premium Vidal**
3. **Lujo Exclusivo**`);
        this.updateSuggestions([
          { text: '1. Estándar Premium', value: '1' },
          { text: '2. Premium Vidal', value: '2' },
          { text: '3. Lujo Exclusivo', value: '3' }
        ]);
        return;
      }

      if (this.state.quoteStep === 3) {
        let finish = '';
        if (inputClean.includes('1') || inputClean.includes('estandar')) finish = 'standard';
        else if (inputClean.includes('2') || inputClean.includes('premium') || inputClean.includes('vidal')) finish = 'premium';
        else if (inputClean.includes('3') || inputClean.includes('lujo') || inputClean.includes('exclusivo')) finish = 'luxury';

        if (!finish) {
          this.addMessage('Para calcular bien, selecciona una terminación escribiendo 1, 2 o 3.');
          return;
        }

        this.state.quoteData.finish = finish;
        this.state.quoteStep = 4;
        this.addMessage(`Excelente elección. Terminación seleccionada: **${FINISHES[finish].name}**.

**Paso 4/4:** Déjame tu **nombre y teléfono o correo** para registrar esta cotización y que el equipo pueda contactarte con cercanía.`);
        this.updateSuggestions([]);
        return;
      }

      if (this.state.quoteStep === 4) {
        this.state.quoteData.contact = originalInput;
        this.state.isQuoting = false;
        const quote = this.calculateEstimate();

        this.addMessage(`¡Muchas gracias, ${quote.clientName}! Ya tenemos una primera estimación para conversar tu proyecto con más claridad:

### Resumen del Presupuesto Estimado
- **Proyecto**: ${quote.projectName}
- **Dimensiones**: ${quote.size} ${this.state.quoteData.type === 'muebles' ? 'm lineales / referencia' : 'm²'}
- **Terminación**: ${quote.finishName}
- **Aproximación de costo total**: **$${quote.totalPriceFormatted} CLP**
- **Plazo de ejecución estimado**: **${quote.timeEstimate}**

*Este valor es una orientación inicial y debe confirmarse con visita técnica. Nos encantaría acompañarte en el siguiente paso como parte de la familia Vidal y Trautmann.*`);

        this.renderDownloadButton(quote);
        this.resetDefaultSuggestions();
      }
    }, 350);
  }

  calculateEstimate() {
    const data = this.state.quoteData;
    const project = QUOTE_FACTORS[data.type];
    const finish = FINISHES[data.finish];
    const finalCost = project.basePricePerM2 * data.size * finish.factor;
    let timeWeeks = Math.ceil(data.size * project.timePerM2);

    if (data.type === 'casa') timeWeeks = Math.max(16, timeWeeks);
    if (data.type === 'cocina') timeWeeks = Math.max(3, timeWeeks);
    if (data.type === 'muebles') timeWeeks = Math.max(2, timeWeeks);

    return {
      clientName: data.contact.split(/[ ,]/)[0] || 'Cliente',
      contactInfo: data.contact,
      projectName: project.name,
      projectTypeKey: data.type,
      size: data.size,
      finishName: finish.name,
      totalPriceFormatted: Math.round(finalCost).toLocaleString('es-CL'),
      materialsCost: Math.round(finalCost * 0.55).toLocaleString('es-CL'),
      laborCost: Math.round(finalCost * 0.35).toLocaleString('es-CL'),
      generalFees: Math.round(finalCost * 0.1).toLocaleString('es-CL'),
      timeEstimate: timeWeeks >= 4 ? `${(timeWeeks / 4).toFixed(1)} meses aprox. (${timeWeeks} semanas)` : `${timeWeeks} semanas aprox.`
    };
  }

  renderDownloadButton(quote) {
    const btnContainer = document.createElement('div');
    btnContainer.className = 'message system-msg';

    const msgContent = document.createElement('div');
    msgContent.className = 'message-content';
    msgContent.style.background = 'rgba(200, 150, 62, 0.08)';
    msgContent.style.borderColor = 'rgba(200, 150, 62, 0.3)';
    msgContent.appendChild(document.createTextNode('Se generó tu presupuesto preliminar. Puedes descargarlo para guardarlo:'));

    const button = document.createElement('button');
    button.className = 'btn btn-primary';
    button.style.marginTop = '0.5rem';
    button.innerHTML = '<i class="fa-solid fa-file-arrow-down"></i> Descargar Cotización';
    button.addEventListener('click', () => this.downloadQuoteTextFile(quote));

    msgContent.appendChild(button);
    btnContainer.appendChild(msgContent);
    this.container.appendChild(btnContainer);
    this.container.scrollTop = this.container.scrollHeight;
  }

  downloadQuoteTextFile(q) {
    const quoteId = `VT-${Math.floor(1000 + Math.random() * 9000)}`;
    const textContent = `VIDAL Y TRAUTMANN CONSTRUCCIONES
Cotización preliminar: ${quoteId}
Fecha: ${new Date().toLocaleDateString('es-CL')}

Cliente / contacto: ${q.contactInfo}
Proyecto: ${q.projectName}
Dimensiones: ${q.size}
Terminación: ${q.finishName}

Materiales y logística: $${q.materialsCost} CLP
Mano de obra: $${q.laborCost} CLP
Gastos generales: $${q.generalFees} CLP
Total estimado: $${q.totalPriceFormatted} CLP
Plazo estimado: ${q.timeEstimate}

Este presupuesto es preliminar y está sujeto a visita técnica.
Contacto: +56 9 8765 4321 / contacto@vidalytrautmann.cl`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Cotizacion_${q.projectTypeKey}_${quoteId}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

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
      chip.type = 'button';
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

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // MOBILE NAVIGATION DRAWER
  // ==========================================
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const closeDrawer = document.querySelector('.close-drawer');
  const drawer = document.querySelector('.mobile-drawer');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  const openMobileMenu = () => {
    drawer.classList.add('open');
  };

  const closeMobileMenu = () => {
    drawer.classList.remove('open');
  };

  if (menuToggle && drawer) {
    menuToggle.addEventListener('click', openMobileMenu);
  }

  if (closeDrawer) {
    closeDrawer.addEventListener('click', closeMobileMenu);
  }

  drawerLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // Active navigation link on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 100; // offset for header

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href').substring(1);
      if (href === current) {
        link.classList.add('active');
      }
    });
  });

  // ==========================================
  // IMAGE CAROUSEL
  // ==========================================
  const slides = document.querySelectorAll('.carousel-slide');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');
  const dots = document.querySelectorAll('.dot');
  let currentSlide = 0;
  let carouselInterval;

  const showSlide = (index) => {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
  };

  const nextSlide = () => {
    showSlide(currentSlide + 1);
  };

  const prevSlide = () => {
    showSlide(currentSlide - 1);
  };

  const startAutoPlay = () => {
    stopAutoPlay();
    carouselInterval = setInterval(nextSlide, 5000);
  };

  const stopAutoPlay = () => {
    if (carouselInterval) clearInterval(carouselInterval);
  };

  // Bind controls
  if (nextBtn && prevBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      startAutoPlay(); // Reset timer on manual click
    });

    prevBtn.addEventListener('click', () => {
      prevSlide();
      startAutoPlay();
    });
  }

  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-index'));
      showSlide(index);
      startAutoPlay();
    });
  });

  // Start autoplay carousel
  if (slides.length > 0) {
    startAutoPlay();
  }

  // ==========================================
  // CHATBOT & COTIZADOR
  // ==========================================
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages-container');
  const chatSuggestions = document.getElementById('chat-suggestions-chips');
  const floatingToggle = document.getElementById('floating-chat-trigger');
  const closeChatButton = document.getElementById('chat-close-btn');
  const chatBox = document.querySelector('.chat-box-wrapper');
  const openChatLinks = document.querySelectorAll('[data-open-chat], a[href="#cotizador-chat"]');

  if (!chatForm || !chatInput || !chatMessages || !chatSuggestions) {
    return;
  }

  const chatbot = new ChatbotEngine('chat-messages-container', 'chat-suggestions-chips');
  let isChatOpen = false;

  const sendChatMessage = () => {
    const message = chatInput.value.trim();
    if (message === '') return;

    chatbot.handleUserMessage(message);
    chatInput.value = '';
  };

  const openChat = () => {
    if (!chatBox) return;

    isChatOpen = true;
    chatBox.classList.add('floating-active');
    chatBox.style.display = 'flex';
    document.body.classList.add('chat-panel-open');
    floatingToggle?.setAttribute('aria-expanded', 'true');

    const badge = floatingToggle?.querySelector('.chat-badge');
    if (badge) badge.style.display = 'none';

    requestAnimationFrame(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
      chatInput.focus();
    });
  };

  const closeChat = () => {
    if (!chatBox) return;

    isChatOpen = false;
    chatBox.classList.remove('floating-active');
    chatBox.style.display = '';
    document.body.classList.remove('chat-panel-open');
    floatingToggle?.setAttribute('aria-expanded', 'false');
  };

  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      sendChatMessage();
    });

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }

  chatbot.resetDefaultSuggestions();

  // Floating Chat Toggle UI
  if (floatingToggle && chatBox) {
    floatingToggle.setAttribute('aria-expanded', 'false');

    floatingToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      isChatOpen ? closeChat() : openChat();
    });

    closeChatButton?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeChat();
    });

    openChatLinks.forEach(link => {
      link.addEventListener('click', () => {
        setTimeout(openChat, 250);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isChatOpen) {
        closeChat();
      }
    });

    // Close chat if clicking outside
    document.addEventListener('click', (e) => {
      if (isChatOpen && !chatBox.contains(e.target) && !floatingToggle.contains(e.target)) {
        closeChat();
      }
    });
  }

});
