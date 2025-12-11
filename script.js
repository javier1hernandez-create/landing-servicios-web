// --- Config ---
const API_URL = "servicios.json";
let products = [];
let cart = [];

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  loadCartFromStorage();
  fetchProducts();
  setupFormValidation();
  setupCartPanelToggle();

  // Botón: Vaciar carrito
  const btnVaciar = document.getElementById("btn-vaciar-carrito");
  if (btnVaciar) {
    btnVaciar.addEventListener("click", () => {
      mostrarConfirmacion(
        "Vaciar carrito",
        "¿Seguro que querés vaciar todo el carrito?",
        (ok) => ok && emptyCart()
      );
    });
  }

  // Botón: Comprar
  const btnComprar = document.getElementById("btn-comprar");

  if (btnComprar) {
    btnComprar.addEventListener("click", () => {
      if (cart.length === 0) {
        mostrarAlerta("Carrito vacío", "El carrito está vacío ❤️");
        return;
      }

      mostrarConfirmacion(
        "Compra en proceso...",
        "Tu compra será procesada 🤓<br><br>Pero recién cuando curses Backend 😅",
        (ok) => {
          if (ok) {
            mostrarAlerta("¡Perfecto!", "Gracias por tu compra ❤️");
          }
        }
      );
    });
  }

  // Cerrar modal al clickear afuera
  const modalUniversalOverlay = document.getElementById("modal-universal-overlay");
  if (modalUniversalOverlay) {
    modalUniversalOverlay.addEventListener("click", (e) => {
      if (e.target === modalUniversalOverlay) {
        modalUniversalOverlay.classList.remove("open");
      }
    });
  }
});

// ===========================
//       Productos (Fetch)
// ===========================
async function fetchProducts() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Error HTTP " + res.status);

    products = await res.json();
    renderProducts(products);
  } catch (error) {
    console.error("Error cargando servicios:", error);
    const cont = document.getElementById("lista-productos");
    if (cont) cont.innerHTML = "<p>No se pudieron cargar los servicios.</p>";
  }
}

function renderProducts(lista) {
  const cont = document.getElementById("lista-productos");
  if (!cont) return;

  cont.innerHTML = "";

  lista.forEach((prod) => {
    const card = document.createElement("article");
    card.className = "card";

    const precioFormateado = prod.price.toLocaleString("es-AR");

    card.innerHTML = `
      <h3>${prod.title}</h3>
      <p>${prod.description}</p>
      <p><strong>$${precioFormateado}</strong></p>
      <button class="button-accent btn-agregar" data-id="${prod.id}">
        Agregar al carrito
      </button>
    `;

    cont.appendChild(card);
  });

  // Eventos de agregar
  document.querySelectorAll(".btn-agregar").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.currentTarget.dataset.id);
      addToCart(id);
    });
  });
}

// ===========================
//            Carrito
// ===========================
function addToCart(productId) {
  const existing = cart.find((i) => i.id === productId);

  if (existing) {
    existing.quantity++;
  } else {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
    });
  }

  saveCart();
  renderCart();

  if (typeof window.openCartPanel === "function") window.openCartPanel();
}

function renderCart() {
  const cont = document.getElementById("carrito-items");
  const totalEl = document.getElementById("carrito-total");
  const countEl = document.getElementById("cart-count");

  if (!cont) return;

  cont.innerHTML = "";
  let total = 0;
  let count = 0;

  cart.forEach((item, index) => {
    total += item.price * item.quantity;
    count += item.quantity;

    const div = document.createElement("div");
    div.className = "item";

    const subtotal = (item.price * item.quantity).toLocaleString("es-AR");
    const precioFormateado = item.price.toLocaleString("es-AR");

    div.innerHTML = `
      <p><strong>${item.title}</strong></p>
      <p>Precio: $${precioFormateado}</p>
      <p>
        Cantidad:
        <button data-i="${index}" class="btn-restar">-</button>
        <span>${item.quantity}</span>
        <button data-i="${index}" class="btn-sumar">+</button>
      </p>
      <p>Subtotal: $${subtotal}</p>
      <button data-i="${index}" class="btn-eliminar">Eliminar</button>
    `;

    cont.appendChild(div);
  });

  totalEl.textContent = total.toLocaleString("es-AR");
  countEl.textContent = count;

  // Eventos
  cont.querySelectorAll(".btn-sumar").forEach((btn) => {
    btn.addEventListener("click", () => updateQuantity(btn.dataset.i, 1));
  });

  cont.querySelectorAll(".btn-restar").forEach((btn) => {
    btn.addEventListener("click", () => updateQuantity(btn.dataset.i, -1));
  });

  cont.querySelectorAll(".btn-eliminar").forEach((btn) => {
    btn.addEventListener("click", () => removeItem(btn.dataset.i));
  });
}

function updateQuantity(i, delta) {
  const index = Number(i);
  if (!cart[index]) return;

  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) cart.splice(index, 1);

  saveCart();
  renderCart();
}

function removeItem(i) {
  const index = Number(i);
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function emptyCart() {
  cart = [];
  saveCart();
  renderCart();
}

// ===========================
//       LocalStorage
// ===========================
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function loadCartFromStorage() {
  const saved = localStorage.getItem("cart");
  cart = saved ? JSON.parse(saved) : [];
  renderCart();
}

// ===========================
//     Validación Formulario
// ===========================
function setupFormValidation() {
  const form = document.querySelector(".form-contacto");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    const nombre = form.querySelector("#nombre");
    const email = form.querySelector("#email");
    const mensaje = form.querySelector("#mensaje");

    if (!nombre.value.trim() || !mensaje.value.trim()) {
      e.preventDefault();
      mostrarAlerta("Campos incompletos", "Completá todo antes de enviar.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value.trim())) {
      e.preventDefault();
      mostrarAlerta("Correo inválido", "El correo electrónico no es válido.");
    }
  });
}

// ===========================
//     Panel Carrito Lateral
// ===========================
function setupCartPanelToggle() {
  const toggleLink = document.querySelector('a[href="#carrito"]');
  const panel = document.getElementById("carrito");
  const overlay = document.getElementById("cart-overlay");
  const closeBtn = document.getElementById("cart-close");

  if (!panel || !overlay) return;

  window.openCartPanel = () => {
    panel.classList.add("open");
    overlay.classList.add("open");
    document.body.classList.add("cart-open"); // Marca carrito abierto
  };

  window.closeCartPanel = () => {
    panel.classList.remove("open");
    overlay.classList.remove("open");
    document.body.classList.remove("cart-open"); // Quita estado
  };

  if (toggleLink) {
    toggleLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.openCartPanel();
    });
  }

  overlay.addEventListener("click", window.closeCartPanel);
  closeBtn && closeBtn.addEventListener("click", window.closeCartPanel);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") window.closeCartPanel();
  });
}

// ===========================
//        Modal Universal
// ===========================
function mostrarAlerta(titulo, mensaje) {
  const overlay = document.getElementById("modal-universal-overlay");
  if (!overlay) return;

  document.getElementById("modal-universal-titulo").textContent = titulo;
  document.getElementById("modal-universal-mensaje").innerHTML = mensaje;

  const botones = document.getElementById("modal-universal-buttons");
  botones.innerHTML = `<button class="modal-universal-btn btn-confirmar">Aceptar</button>`;

  botones.querySelector(".btn-confirmar").onclick = () => {
    overlay.classList.remove("open");
  };

  overlay.classList.add("open");
}

function mostrarConfirmacion(titulo, mensaje, callback) {
  const overlay = document.getElementById("modal-universal-overlay");
  if (!overlay) return callback(false);

  document.getElementById("modal-universal-titulo").textContent = titulo;
  document.getElementById("modal-universal-mensaje").innerHTML = mensaje;

  const botones = document.getElementById("modal-universal-buttons");
  botones.innerHTML = `
    <button class="modal-universal-btn btn-confirmar">Aceptar</button>
    <button class="modal-universal-btn btn-cancelar">Cancelar</button>
  `;

  botones.querySelector(".btn-confirmar").onclick = () => {
    overlay.classList.remove("open");
    callback(true);
  };

  botones.querySelector(".btn-cancelar").onclick = () => {
    overlay.classList.remove("open");
    callback(false);
  };

  overlay.classList.add("open");
}
