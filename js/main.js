// ===== CONFIGURAÇÕES E CONSTANTES =====


api_key = "AIzaSyBHmOjcg1qsC0QeqNr7tVx-mjf2VEOUzps"

const CONFIG = {
  maxQuantity: 10,
  minQuantity: 1,
  cartKey: 'lojax_cart',
  usersKey: 'storeUsers',
  defaultUser: {
    name: 'Usuário Demo',
    email: 'demo@exemplo.com',
    password: '123456',
    type: 'client'
  }
};

// ===== DADOS DE EXEMPLO =====
const products = [
  {
    id: 'p1',
    name: 'Camiseta Básica Algodão Premium',
    price: 79.90,
    images: ['https://images.tcdn.com.br/img/img_prod/947450/camiseta_basic_color_azul_petroleo_915_1_b0aa7489d035f455e5f06825c141f82d.jpg'],
    colors: ['Branco','Preto','Cinza'],
    sizes: ['P','M','G','GG'],
    description: 'Camiseta confortável, tecido 100% algodão. Ideal para uso diário.',
    category: 'roupas',
    inStock: true
  },
  {
    id: 'p2',
    name: 'Tênis Urban Runner',
    price: 239.00,
    images: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSvgejs6GZ89BRN6smt2Ag6nvAos0bAQdrRQ&s'],
    colors: ['Branco','Preto'],
    sizes: ['38','39','40','41','42'],
    description: 'Tênis para uso urbano com sola confortável e design moderno.',
    category: 'calcados',
    inStock: true
  },
  {
    id: 'p3',
    name: 'Terno Elegante',
    price: 599.90,
    images: ['img/terno.jpg'],
    colors: ['Preto','Azul Marinho','Cinza'],
    sizes: ['48','50','52','54'],
    description: 'Terno elegante para ocasiões formais, confeccionado com tecido de alta qualidade.',
    category: 'roupas',
    inStock: true
  },
  {
    id: 'p4',
    name: 'Calça Jeans Moderna',
    price: 149.90,
    images: ['https://59121.cdn.simplo7.net/static/59121/sku/feminino-calcas-calca-jeans-feminina-escura-skinny-6517624e601f3-p-1696031521843.jpg'],
    colors: ['Azul Claro','Azul Escuro','Preto'],
    sizes: ['38','40','42','44','46'],
    description: 'Calça jeans de alta qualidade, corte moderno e confortável para uso diário.',
    category: 'roupas',
    inStock: true
  },
  {
    id: 'p5',
    name: 'Relógio Elegance',
    price: 329.90,
    images: ['https://m.media-amazon.com/images/I/61hGDiWBU8L._AC_UY1000_.jpg'],
    colors: ['Prata','Dourado','Preto'],
    sizes: ['Único'],
    description: 'Relógio elegante com pulseira de couro, ideal para ocasiões formais e uso diário.',
    category: 'acessorios',
    inStock: true
  }
];

// ===== ESTADO GLOBAL =====
let cart = [];
let currentUser = null;
let users = [CONFIG.defaultUser];

// ===== ELEMENTOS DOM =====
const productsRow = document.getElementById('productsRow');
const cartCount = document.getElementById('cartCount');
const cartItems = document.getElementById('cartItems');
const cartSubtotal = document.getElementById('cartSubtotal');

// ===== FUNÇÕES UTILITÁRIAS =====
/**
 * Formata valor em Real brasileiro
 * @param {number} value - Valor numérico
 * @returns {string} Valor formatado em R$
 */
function formatBRL(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    console.error('Valor inválido para formatação:', value);
    return 'R$ 0,00';
  }
  return 'R$ ' + value.toFixed(2).replace('.', ',');
}

/**
 * Valida se um produto existe
 * @param {string} productId - ID do produto
 * @returns {Object|null} Produto encontrado ou null
 */
function validateProduct(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) {
    console.error('Produto não encontrado:', productId);
    return null;
  }
  return product;
}

/**
 * Valida quantidade do produto
 * @param {number} quantity - Quantidade a validar
 * @returns {number} Quantidade válida
 */
function validateQuantity(quantity) {
  const qty = parseInt(quantity) || CONFIG.minQuantity;
  return Math.max(CONFIG.minQuantity, Math.min(CONFIG.maxQuantity, qty));
}

/**
 * Mostra notificação para o usuário
 * @param {string} message - Mensagem a exibir
 * @param {string} type - Tipo da notificação (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
  // Criar elemento de notificação
  const notification = document.createElement('div');
  notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
  notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
  notification.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
  `;
  
  document.body.appendChild(notification);
  
  // Remover automaticamente após 5 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

/**
 * Salva dados no localStorage com tratamento de erro
 * @param {string} key - Chave para salvar
 * @param {any} data - Dados a salvar
 * @returns {boolean} Sucesso da operação
 */
function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
    showNotification('Erro ao salvar dados. Verifique o armazenamento local.', 'warning');
    return false;
  }
}

/**
 * Carrega dados do localStorage com tratamento de erro
 * @param {string} key - Chave para carregar
 * @param {any} defaultValue - Valor padrão caso não encontre
 * @returns {any} Dados carregados ou valor padrão
 */
function loadFromLocalStorage(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('Erro ao carregar do localStorage:', error);
    return defaultValue;
  }
}

// ===== FUNÇÕES DE PRODUTOS =====
/**
 * Renderiza a lista de produtos
 */
function renderProducts() {
  if (!productsRow) {
    console.error('Elemento productsRow não encontrado');
    return;
  }
  
  productsRow.innerHTML = '';
  
  products.forEach(product => {
    if (!product.inStock) return; // Pular produtos fora de estoque
    
    const col = document.createElement('div');
    col.className = 'col-sm-6 col-lg-4';
    col.setAttribute('role', 'gridcell');
    
    col.innerHTML = `
      <article class="card product-card h-100 shadow-hover">
        <div class="position-relative">
          <img 
            src="${product.images[0]}" 
            class="card-img-top" 
            alt="${product.name}"
            loading="lazy"
            onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbSBuZ28gZW5jb250cmFkYTwvdGV4dD48L3N2Zz4='"
          >
          <div class="position-absolute top-0 end-0 m-2">
            <span class="badge bg-success">Em estoque</span>
          </div>
        </div>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title text-truncate-2">${product.name}</h5>
          <p class="card-text text-muted small text-truncate-2">${product.description}</p>
          <div class="mt-auto">
            <div class="product-price mb-3">${formatBRL(product.price)}</div>
            <div class="product-buttons">
              <button 
                class="btn btn-outline-secondary btn-sm" 
                onclick="openProductModal('${product.id}')"
                aria-label="Ver detalhes de ${product.name}"
              >
                Ver detalhes
              </button>
              <button 
                class="btn btn-primary btn-sm" 
                onclick="quickAdd('${product.id}')"
                aria-label="Adicionar ${product.name} ao carrinho"
              >
                Adicionar ao carrinho
              </button>
            </div>
          </div>
        </div>
      </article>`;
    
    productsRow.appendChild(col);
  });
  
  // Aplicar animação de fade-in aos novos elementos
  const cards = productsRow.querySelectorAll('.product-card');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 100);
  });
}

/**
 * Adiciona produto ao carrinho rapidamente (sem modal)
 * @param {string} productId - ID do produto
 */
function quickAdd(productId) {
  const product = validateProduct(productId);
  if (!product) {
    showNotification('Produto não encontrado', 'error');
    return;
  }
  
  if (!product.inStock) {
    showNotification('Produto fora de estoque', 'warning');
    return;
  }
  
  const cartItem = {
    ...product,
    color: product.colors[0],
    size: product.sizes[0]
  };
  
  addToCart(cartItem, 1);
  showNotification(`${product.name} adicionado ao carrinho!`, 'success');
}

/**
 * Abre o modal de detalhes do produto
 * @param {string} productId - ID do produto
 */
function openProductModal(productId) {
  const product = validateProduct(productId);
  if (!product) {
    showNotification('Produto não encontrado', 'error');
    return;
  }
  
  const modal = new bootstrap.Modal(document.getElementById('productModal'));
  const modalElement = document.getElementById('productModal');
  
  // Preencher dados do produto
  document.getElementById('productModalTitle').textContent = product.name;
  document.getElementById('productModalImg').src = product.images[0];
  document.getElementById('productModalImg').alt = product.name;
  document.getElementById('productModalDesc').textContent = product.description;
  document.getElementById('productModalPrice').textContent = formatBRL(product.price);
  
  // Preencher opções de cor
  const colorSelect = document.getElementById('productColor');
  colorSelect.innerHTML = '<option value="">Selecione uma cor</option>';
  product.colors.forEach(color => {
    const option = document.createElement('option');
    option.value = color;
    option.textContent = color;
    colorSelect.appendChild(option);
  });
  
  // Preencher opções de tamanho
  const sizeSelect = document.getElementById('productSize');
  sizeSelect.innerHTML = '<option value="">Selecione um tamanho</option>';
  product.sizes.forEach(size => {
    const option = document.createElement('option');
    option.value = size;
    option.textContent = size;
    sizeSelect.appendChild(option);
  });
  
  // Resetar quantidade
  document.getElementById('productQty').value = '1';
  
  // Configurar eventos dos botões
  document.getElementById('addToCartBtn').onclick = () => {
    const form = document.getElementById('productForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    const qty = validateQuantity(document.getElementById('productQty').value);
    const color = colorSelect.value;
    const size = sizeSelect.value;
    
    if (!color || !size) {
      showNotification('Selecione cor e tamanho', 'warning');
      return;
    }
    
    const cartItem = { ...product, color, size };
    addToCart(cartItem, qty);
    modal.hide();
    showNotification(`${product.name} adicionado ao carrinho!`, 'success');
  };
  
  document.getElementById('buyNowBtn').onclick = () => {
    const form = document.getElementById('productForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    const qty = validateQuantity(document.getElementById('productQty').value);
    const color = colorSelect.value;
    const size = sizeSelect.value;
    
    if (!color || !size) {
      showNotification('Selecione cor e tamanho', 'warning');
      return;
    }
    
    const cartItem = { ...product, color, size };
    addToCart(cartItem, qty);
    modal.hide();
    openCart();
  };
  
  modal.show();
}

// ===== FUNÇÕES DO CARRINHO =====
/**
 * Adiciona produto ao carrinho
 * @param {Object} product - Produto a adicionar
 * @param {number} quantity - Quantidade
 */
function addToCart(product, quantity) {
  if (!product || !quantity) {
    console.error('Dados inválidos para adicionar ao carrinho:', { product, quantity });
    return;
  }
  
  const quantityNum = validateQuantity(quantity);
  const key = `${product.id}|${product.color}|${product.size}`;
  
  // Verificar se já existe no carrinho
  const existingItem = cart.find(item => item.key === key);
  
  if (existingItem) {
    existingItem.qty += quantityNum;
  } else {
    cart.push({
      key,
      id: product.id,
      name: product.name,
      price: product.price,
      qty: quantityNum,
      color: product.color,
      size: product.size,
      img: product.images[0],
      category: product.category
    });
  }
  
  updateCartUI();
  saveCartToStorage();
  
  // Abrir carrinho brevemente para mostrar feedback
  setTimeout(() => {
    const offcanvas = new bootstrap.Offcanvas(document.getElementById('offcanvasCart'));
    offcanvas.show();
  }, 300);
}

/**
 * Atualiza a interface do carrinho
 */
function updateCartUI() {
  if (!cartCount || !cartItems || !cartSubtotal) {
    console.error('Elementos do carrinho não encontrados');
    return;
  }
  
  // Atualizar contador
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCount.textContent = totalItems;
  cartCount.setAttribute('aria-label', `${totalItems} itens no carrinho`);
  
  // Limpar lista de itens
  cartItems.innerHTML = '';
  
  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="text-center text-muted py-4">
        <div class="mb-2">🛒</div>
        <p class="mb-0">Seu carrinho está vazio</p>
        <small>Adicione produtos para continuar</small>
      </div>
    `;
    cartSubtotal.textContent = formatBRL(0);
    return;
  }
  
  // Renderizar itens do carrinho
  cart.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'list-group-item d-flex gap-3 align-items-center';
    itemElement.setAttribute('role', 'listitem');
    
    const totalPrice = item.price * item.qty;
    
    itemElement.innerHTML = `
      <img 
        src="${item.img}" 
        alt="${item.name}"
        style="width:64px; height:64px; object-fit:cover;" 
        class="rounded"
        loading="lazy"
      >
      <div class="flex-grow-1">
        <div class="fw-bold">${item.name}</div>
        <div class="small text-muted">${item.color} • ${item.size}</div>
        <div class="mt-1">
          <span class="text-muted">${formatBRL(item.price)} x ${item.qty}</span>
          <span class="fw-bold ms-2">${formatBRL(totalPrice)}</span>
        </div>
      </div>
      <div class="d-flex flex-column align-items-end">
        <div class="d-flex align-items-center gap-1 mb-1">
          <button 
            class="btn btn-sm btn-outline-secondary" 
            onclick="changeQty('${item.key}', -1)"
            aria-label="Diminuir quantidade"
            ${item.qty <= 1 ? 'disabled' : ''}
          >
            -
          </button>
          <span class="badge bg-secondary">${item.qty}</span>
          <button 
            class="btn btn-sm btn-outline-secondary" 
            onclick="changeQty('${item.key}', 1)"
            aria-label="Aumentar quantidade"
            ${item.qty >= CONFIG.maxQuantity ? 'disabled' : ''}
          >
            +
          </button>
        </div>
        <button 
          class="btn btn-sm btn-link text-danger" 
          onclick="removeItem('${item.key}')"
          aria-label="Remover item do carrinho"
        >
          Remover
        </button>
      </div>`;
    
    cartItems.appendChild(itemElement);
  });
  
  // Atualizar subtotal
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  cartSubtotal.textContent = formatBRL(subtotal);
}

/**
 * Salva carrinho no localStorage
 */
function saveCartToStorage() {
  saveToLocalStorage(CONFIG.cartKey, cart);
}

/**
 * Carrega carrinho do localStorage
 */
function loadCartFromStorage() {
  const savedCart = loadFromLocalStorage(CONFIG.cartKey, []);
  if (Array.isArray(savedCart)) {
    cart = savedCart;
    updateCartUI();
  }
}

/**
 * Altera quantidade de um item no carrinho
 * @param {string} key - Chave do item
 * @param {number} delta - Mudança na quantidade
 */
function changeQty(key, delta) {
  const item = cart.find(x => x.key === key);
  if (!item) {
    console.error('Item não encontrado no carrinho:', key);
    return;
  }
  
  const newQty = item.qty + delta;
  if (newQty < CONFIG.minQuantity) {
    showNotification('Quantidade mínima é 1', 'warning');
    return;
  }
  
  if (newQty > CONFIG.maxQuantity) {
    showNotification(`Quantidade máxima é ${CONFIG.maxQuantity}`, 'warning');
    return;
  }
  
  item.qty = newQty;
  updateCartUI();
  saveCartToStorage();
}

/**
 * Remove item do carrinho
 * @param {string} key - Chave do item
 */
function removeItem(key) {
  const item = cart.find(x => x.key === key);
  if (!item) {
    console.error('Item não encontrado no carrinho:', key);
    return;
  }
  
  cart = cart.filter(x => x.key !== key);
  updateCartUI();
  saveCartToStorage();
  showNotification(`${item.name} removido do carrinho`, 'info');
}

/**
 * Abre o carrinho
 */
function openCart() {
  const offcanvas = new bootstrap.Offcanvas(document.getElementById('offcanvasCart'));
  offcanvas.show();
}

/**
 * Limpa todo o carrinho
 */
function clearCart() {
  cart = [];
  updateCartUI();
  saveCartToStorage();
  showNotification('Carrinho limpo', 'info');
}

// ===== FUNÇÕES DE AUTENTICAÇÃO =====
/**
 * Carrega usuários do localStorage
 */
function loadUsers() {
  const savedUsers = loadFromLocalStorage(CONFIG.usersKey, []);
  
  // Garantir que o usuário demo sempre exista
  if (!savedUsers.some(u => u.email === CONFIG.defaultUser.email)) {
    savedUsers.push(CONFIG.defaultUser);
    saveToLocalStorage(CONFIG.usersKey, savedUsers);
  }
  
  users = savedUsers;
}

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} Email válido
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida força da senha
 * @param {string} password - Senha a validar
 * @returns {Object} Resultado da validação
 */
function validatePassword(password) {
  const minLength = 6;
  const hasMinLength = password.length >= minLength;
  
  return {
    isValid: hasMinLength,
    errors: hasMinLength ? [] : [`Senha deve ter pelo menos ${minLength} caracteres`]
  };
}

/**
 * Realiza login do usuário
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Object} Resultado do login
 */
function login(email, password) {
  // Validações
  if (!email || !password) {
    return { success: false, error: 'email_and_password_required' };
  }
  
  if (!isValidEmail(email)) {
    return { success: false, error: 'invalid_email' };
  }
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    currentUser = { 
      name: user.name, 
      email: user.email, 
      type: user.type || 'client' 
    };
    
    updateAuthUI();
    
    // Fechar modal de login
    const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    if (modal) modal.hide();
    
    showNotification(`Bem-vindo, ${user.name}!`, 'success');
    
    // Limpar formulário
    document.getElementById('loginForm').reset();
    
    return { success: true };
  }
  
  return { success: false, error: 'invalid_credentials' };
}

/**
 * Realiza logout do usuário
 */
function logout() {
  // Salvar usuários no localStorage antes de fazer logout
  saveToLocalStorage(CONFIG.usersKey, users);
  
  const userName = currentUser?.name || 'Usuário';
  currentUser = null;
  updateAuthUI();
  
  showNotification(`Até logo, ${userName}!`, 'info');
}

/**
 * Registra novo usuário
 * @param {string} name - Nome do usuário
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Object} Resultado do registro
 */
function register(name, email, password) {
  // Validações
  if (!name || !email || !password) {
    return { success: false, error: 'all_fields_required' };
  }
  
  if (!isValidEmail(email)) {
    return { success: false, error: 'invalid_email' };
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return { success: false, error: 'weak_password', details: passwordValidation.errors };
  }
  
  // Verificar se email já existe
  if (users.find(u => u.email === email)) {
    return { success: false, error: 'email_exists' };
  }
  
  // Adicionar novo usuário
  const newUser = { name, email, password, type: 'client' };
  users.push(newUser);
  
  // Fazer login com o novo usuário
  currentUser = { name, email, type: 'client' };
  updateAuthUI();
  
  // Fechar modal de registro
  const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
  if (modal) modal.hide();
  
  // Salvar usuários no localStorage
  saveToLocalStorage(CONFIG.usersKey, users);
  
  showNotification(`Conta criada com sucesso! Bem-vindo, ${name}!`, 'success');
  
  // Limpar formulário
  document.getElementById('registerForm').reset();
  
  return { success: true };
}

/**
 * Atualiza interface de autenticação
 */
function updateAuthUI() {
  const userInfo = document.getElementById('userInfo');
  const btnLogin = document.getElementById('btnLogin');
  const userName = document.getElementById('userName');
  
  if (!userInfo || !btnLogin || !userName) {
    console.error('Elementos de autenticação não encontrados');
    return;
  }
  
  if (currentUser) {
    userInfo.classList.remove('d-none');
    btnLogin.classList.add('d-none');
    userName.textContent = currentUser.name;
    userName.setAttribute('aria-label', `Usuário logado: ${currentUser.name}`);
  } else {
    userInfo.classList.add('d-none');
    btnLogin.classList.remove('d-none');
  }
}

// ===== INICIALIZAÇÃO =====
/**
 * Inicializa a aplicação
 */
function initializeApp() {
  // Carregar dados salvos
  loadUsers();
  loadCartFromStorage();
  
  // Renderizar produtos
  renderProducts();
  updateAuthUI();
  
  // Configurar event listeners
  setupEventListeners();
  
  console.log('LojaX inicializada com sucesso!');
}

/**
 * Configura todos os event listeners
 */
function setupEventListeners() {
  // Carrinho
  const btnCart = document.getElementById('btnCart');
  if (btnCart) {
    btnCart.addEventListener('click', openCart);
  }
  
  // Login
  const btnLogin = document.getElementById('btnLogin');
  if (btnLogin) {
    btnLogin.addEventListener('click', () => {
      const modal = new bootstrap.Modal(document.getElementById('loginModal'));
      modal.show();
    });
  }
  
  // Formulário de login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Botão de registro
  const btnRegister = document.getElementById('btnRegister');
  if (btnRegister) {
    btnRegister.addEventListener('click', () => {
      const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      if (loginModal) loginModal.hide();
      
      const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
      registerModal.show();
    });
  }
  
  // Botão voltar ao login
  const btnBackToLogin = document.getElementById('btnBackToLogin');
  if (btnBackToLogin) {
    btnBackToLogin.addEventListener('click', () => {
      const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
      if (registerModal) registerModal.hide();
      
      const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
      loginModal.show();
    });
  }
  
  // Formulário de registro
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
  
  // Logout
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', logout);
  }
}

/**
 * Manipula o envio do formulário de login
 * @param {Event} e - Evento do formulário
 */
function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('userEmail').value.trim();
  const password = document.getElementById('userPassword').value;
  const loginError = document.getElementById('loginError');
  
  // Limpar estados anteriores
  clearFormValidation(['userEmail', 'userPassword']);
  
  const result = login(email, password);
  
  if (result.success) {
    hideError(loginError);
  } else {
    showLoginError(result.error, loginError);
  }
}

/**
 * Manipula o envio do formulário de registro
 * @param {Event} e - Evento do formulário
 */
function handleRegister(e) {
  e.preventDefault();
  
  const name = document.getElementById('newUserName').value.trim();
  const email = document.getElementById('newUserEmail').value.trim();
  const password = document.getElementById('newUserPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const registerError = document.getElementById('registerError');
  
  // Limpar estados anteriores
  clearFormValidation(['newUserName', 'newUserEmail', 'newUserPassword', 'confirmPassword']);
  
  // Validação básica
  if (!name || !email || !password || !confirmPassword) {
    showRegisterError('Preencha todos os campos', registerError);
    return;
  }
  
  if (password !== confirmPassword) {
    showRegisterError('As senhas não coincidem', registerError);
    document.getElementById('confirmPassword').classList.add('is-invalid');
    return;
  }
  
  const result = register(name, email, password);
  
  if (result.success) {
    hideError(registerError);
  } else {
    showRegisterError(getRegisterErrorMessage(result.error), registerError);
  }
}

/**
 * Mostra erro de login
 * @param {string} error - Código do erro
 * @param {HTMLElement} errorElement - Elemento de erro
 */
function showLoginError(error, errorElement) {
  const messages = {
    'email_and_password_required': 'Preencha email e senha',
    'invalid_email': 'Email inválido',
    'invalid_credentials': 'Email ou senha incorretos'
  };
  
  errorElement.textContent = messages[error] || 'Erro ao fazer login';
  errorElement.classList.remove('d-none');
  
  // Destacar campos com erro
  if (error === 'invalid_email') {
    document.getElementById('userEmail').classList.add('is-invalid');
  } else if (error === 'invalid_credentials') {
    document.getElementById('userPassword').classList.add('is-invalid');
  }
}

/**
 * Mostra erro de registro
 * @param {string} message - Mensagem de erro
 * @param {HTMLElement} errorElement - Elemento de erro
 */
function showRegisterError(message, errorElement) {
  errorElement.textContent = message;
  errorElement.classList.remove('d-none');
}

/**
 * Obtém mensagem de erro de registro
 * @param {string} error - Código do erro
 * @returns {string} Mensagem de erro
 */
function getRegisterErrorMessage(error) {
  const messages = {
    'all_fields_required': 'Preencha todos os campos',
    'invalid_email': 'Email inválido',
    'weak_password': 'Senha muito fraca',
    'email_exists': 'Este email já está em uso'
  };
  
  return messages[error] || 'Erro ao criar conta';
}

/**
 * Limpa validação de formulário
 * @param {string[]} fieldIds - IDs dos campos
 */
function clearFormValidation(fieldIds) {
  fieldIds.forEach(id => {
    const field = document.getElementById(id);
    if (field) {
      field.classList.remove('is-invalid', 'is-valid');
    }
  });
}

/**
 * Esconde elemento de erro
 * @param {HTMLElement} errorElement - Elemento de erro
 */
function hideError(errorElement) {
  if (errorElement) {
    errorElement.classList.add('d-none');
  }
}

// ===== FUNÇÕES DE PAGAMENTO =====
/**
 * Atualiza valor das parcelas
 */
function updateInstallmentValue() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const installments = parseInt(document.getElementById('installmentSelect')?.value || 1);
  let installmentValue = subtotal / installments;

  // Adicionar juros para parcelas acima de 6x
  if (installments > 6) {
    const interestRate = 1 + ((installments - 6) * 0.015); // 1.5% de juros por parcela adicional
    installmentValue = (subtotal * interestRate) / installments;
  }

  const installmentElement = document.getElementById('installmentValue');
  if (installmentElement) {
    installmentElement.textContent = 
      `${installments}x de ${formatBRL(installmentValue)}` + 
      (installments > 6 ? ' (com juros)' : ' (sem juros)');
  }
}

/**
 * Processa checkout
 */
function processCheckout() {
  if (!currentUser) {
    showNotification('Faça login para continuar com a compra', 'warning');
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
    return;
  }
  
  if (cart.length === 0) {
    showNotification('Carrinho vazio', 'warning');
    return;
  }
  
  // Mostrar modal de pagamento
  const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
  
  // Calcular valor total com possíveis descontos
  let total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  let discountMessage = '';
  let installmentMessage = '';
  
  // Aplicar descontos conforme método de pagamento
  const qrCodePayment = document.getElementById('paymentQRCode');
  const boletoPayment = document.getElementById('paymentBoleto');
  const cardPayment = document.getElementById('paymentCard');
  
  if (qrCodePayment?.checked) {
    const discount = total * 0.05;
    total -= discount;
    discountMessage = `Desconto de 5%: -${formatBRL(discount)}`;
    
    // Mostrar QR code, esconder outros
    document.getElementById('qrcodePayment')?.classList.remove('d-none');
    document.getElementById('boletoPayment')?.classList.add('d-none');
    document.getElementById('cardPayment')?.classList.add('d-none');
  } 
  else if (boletoPayment?.checked) {
    const discount = total * 0.03;
    total -= discount;
    discountMessage = `Desconto de 3%: -${formatBRL(discount)}`;
    
    // Mostrar boleto, esconder outros
    document.getElementById('qrcodePayment')?.classList.add('d-none');
    document.getElementById('boletoPayment')?.classList.remove('d-none');
    document.getElementById('cardPayment')?.classList.add('d-none');
  }
  else if (cardPayment?.checked) {
    const installments = parseInt(document.getElementById('installmentSelect')?.value || 1);
    let installmentValue = total / installments;
    
    // Adicionar juros para parcelas acima de 6x
    if (installments > 6) {
      const interestRate = 1 + ((installments - 6) * 0.015);
      total = total * interestRate;
      installmentValue = total / installments;
    }
    
    installmentMessage = `${installments}x de ${formatBRL(installmentValue)}` + 
      (installments > 6 ? ' (com juros)' : ' (sem juros)');
    
    // Mostrar cartão, esconder outros
    document.getElementById('qrcodePayment')?.classList.add('d-none');
    document.getElementById('boletoPayment')?.classList.add('d-none');
    document.getElementById('cardPayment')?.classList.remove('d-none');
  }
  
  document.getElementById('paymentTotal').textContent = formatBRL(total);
  document.getElementById('paymentDiscount').textContent = discountMessage;
  document.getElementById('paymentInstallment').textContent = installmentMessage;
  
  paymentModal.show();
}

/**
 * Finaliza compra
 */
function finalizarCompra() {
  // Simular finalização da compra
  showNotification('Pagamento confirmado! Seu pedido foi processado com sucesso.', 'success');
  
  // Limpar carrinho
  cart = [];
  updateCartUI();
  saveCartToStorage();
  
  // Fechar modal de pagamento
  const modal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
  if (modal) modal.hide();
}

/**
 * Configura event listeners de pagamento
 */
function setupPaymentListeners() {
  // Opções de pagamento
  const paymentCard = document.getElementById('paymentCard');
  const paymentQRCode = document.getElementById('paymentQRCode');
  const paymentBoleto = document.getElementById('paymentBoleto');
  const installmentSelect = document.getElementById('installmentSelect');
  const checkoutBtn = document.getElementById('checkoutBtn');
  
  if (paymentCard) {
    paymentCard.addEventListener('change', function() {
      document.getElementById('cardOptions')?.classList.remove('d-none');
      updateInstallmentValue();
    });
  }
  
  if (paymentQRCode) {
    paymentQRCode.addEventListener('change', function() {
      document.getElementById('cardOptions')?.classList.add('d-none');
    });
  }
  
  if (paymentBoleto) {
    paymentBoleto.addEventListener('change', function() {
      document.getElementById('cardOptions')?.classList.add('d-none');
    });
  }
  
  if (installmentSelect) {
    installmentSelect.addEventListener('change', updateInstallmentValue);
  }
  
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', processCheckout);
  }
}

// ===== INICIALIZAÇÃO FINAL =====
document.addEventListener('DOMContentLoaded', function() {
  try {
    initializeApp();
    setupPaymentListeners();
    
    // Configurar tracking de eventos
    if (typeof trackEvent === 'function') {
      trackEvent('page_load', 'navigation', 'homepage');
    }
  } catch (error) {
    console.error('Erro ao inicializar aplicação:', error);
    showNotification('Erro ao carregar a aplicação. Recarregue a página.', 'error');
  }
});