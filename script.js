let menuData = [];
let enviando = false;

function cargarMenu() {
  // Siempre cargar desde menu.json para asegurar que los cambios se reflejen
  fetch('menu.json')
    .then(res => res.json())
    .then(data => {
      menuData = data;
      // Guardar en localStorage para persistencia
      localStorage.setItem("menu", JSON.stringify(data));
      mostrarMenu(data);
      generarBotonesCategorias(data);
    })
    .catch(error => {
      console.error('Error cargando menu.json:', error);
      // Si falla, intentar cargar desde localStorage como respaldo
      const menuLS = localStorage.getItem("menu");
      if (menuLS) {
        menuData = JSON.parse(menuLS);
        mostrarMenu(menuData);
        generarBotonesCategorias(menuData);
      }
    });
}

function generarBotonesCategorias(data) {
  const categorias = [...new Set(data.map(p => p.categoria))];
  const container = document.querySelector('.categorias');
  container.innerHTML = '<button class="cat-btn cat-todos activo" onclick="filtrar(\'todos\')">Todos</button>';
  categorias.forEach(cat => {
    const btnClass = 'cat-' + cat.toLowerCase().replace(' ', '-');
    container.innerHTML += `<button class="cat-btn ${btnClass}" onclick="filtrar('${cat}')">${cat}</button>`;
  });
}

cargarMenu();

function mostrarMenu(data) {

  let container = document.getElementById("menuContainer");
  container.innerHTML = "";

  data.forEach(pizza => {

    container.innerHTML += `
      <div class="col-6 col-md-4">
        <div class="card pizza-card" onclick="abrirModal('${pizza.nombre}', '${pizza.descripcion}', '${pizza.precio}', '${pizza.imagen}')">
          <img src="${pizza.imagen}" class="card-img-top" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width: 100%; height: 200px; object-fit: cover;">
          <div class="card-img-top placeholder-img" style="display: none; width: 100%; height: 200px; background: linear-gradient(135deg, #C0392B, #D4AF37); align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.2rem;">
            ${pizza.nombre.split(' ')[0]}
          </div>
          <div class="card-body bg-dark text-white text-center">
            <h5>${pizza.nombre}</h5>
          </div>
        </div>
      </div>
    `;



  });
}

function filtrar(categoria) {
  if (categoria === 'todos') {
    mostrarMenu(menuData);
  } else {
    let filtrados = menuData.filter(p => p.categoria === categoria);
    mostrarMenu(filtrados);
  }
}

function abrirModal(nombre, descripcion, precio, imagen) {

  document.getElementById("modalTitulo").innerText = nombre;
  document.getElementById("modalDesc").innerText = descripcion;
  document.getElementById("modalPrecio").innerText = precio;

  const modalImg = document.getElementById("modalImg");
  modalImg.src = imagen;
  modalImg.onerror = function() {
    this.style.display = 'none';
    const placeholder = this.nextElementSibling;
    if (placeholder) {
      placeholder.style.display = 'flex';
      placeholder.innerText = nombre.split(' ')[0];
    }
  };

  // Reset placeholder visibility
  const placeholder = modalImg.nextElementSibling;
  if (placeholder) {
    placeholder.style.display = 'none';
  }
  modalImg.style.display = 'block';

  let modal = new bootstrap.Modal(document.getElementById('pizzaModal'));
  modal.show();
}

let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

document.addEventListener("DOMContentLoaded", () => {
  actualizarContador();
});

// 🔹 Agregar al carrito (llamar desde modal)
function agregarAlCarrito(nombre, precio) {

  let item = carrito.find(p => p.nombre === nombre);

  if (item) {
    item.cantidad++;
  } else {
    let precioNumerico = parseInt(precio.replace(/\D/g, "")) || "Consultar";
    carrito.push({
      nombre,
      precio: precioNumerico,
      cantidad: 1
    });
  }
  animarCarrito();

  guardarCarrito();

  mostrarAlerta(`✅ ${nombre} agregado al carrito`, "success");
  reproducirSonido();
}

// 🔹 Guardar
function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
  cerrarTodosLosModales();
  actualizarContador();
}

// 🔹 Contador
function actualizarContador() {
  let total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  document.getElementById("contador").innerText = total;
}

// 🔹 Enviar directo a WhatsApp
function enviarDirecto() {
  console.log("Carrito actual:", carrito);

  if (carrito.length === 0) {
    mostrarAlerta("⚠️ Selecciona al menos un servicio", "warning");
    return;
  }

  // Pedir datos del cliente
  let nombre = prompt("¿Cuál es tu nombre completo?");
  if (!nombre || nombre.trim() === "") {
    mostrarAlerta("⚠️ Por favor ingresa tu nombre", "warning");
    return;
  }

  let telefono = prompt("¿Cuál es tu teléfono?");
  if (!telefono || telefono.trim() === "") {
    mostrarAlerta("⚠️ Por favor ingresa tu teléfono", "warning");
    return;
  }

  // Construir mensaje
  let mensaje = "*SOLICITUD DE SERVICIO - KEYREN ASESORES*\n\n";
  mensaje += `Cliente: ${nombre}\n`;
  mensaje += `Teléfono: ${telefono}\n\n`;
  mensaje += `*SERVICIOS SOLICITADOS:*\n\n`;

  carrito.forEach(item => {
    mensaje += `📋 ${item.nombre}\n`;
    mensaje += `Cantidad: ${item.cantidad}\n\n`;
  });

  mensaje += `*TOTAL A CONSULTAR*\n\nGracias por tu interés en nuestros servicios.`;

  console.log("Mensaje construido:", mensaje);

  // Mostrar mensaje para verificar antes de enviar
  if (confirm("¿Enviar este mensaje a WhatsApp?\n\n" + mensaje)) {
    let url = `https://wa.me/TU_NUMERO_DE_WHATSAPP_AQUI?text=${encodeURIComponent(mensaje)}`;
    console.log("URL de WhatsApp:", url);

    // Guardar solicitud
    guardarPedido(nombre, telefono, carrito, 0);

    // Abrir WhatsApp
    window.open(url, "_blank");

    // Limpiar carrito
    carrito = [];
    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarContador();

    mostrarAlerta("✅ Abriendo WhatsApp...", "success");
  }
}

/* FUNCIONES ELIMINADAS (no se usan más)
// 🔹 Abrir carrito (DEPRECATED)
function abrirCarrito() {
  let lista = document.getElementById("listaCarrito");
  let total = 0;

  lista.innerHTML = "";

  carrito.forEach((item, index) => {
    let subtotal = (typeof item.precio === 'number') ? item.precio * item.cantidad : 'Consultar';
    if (typeof item.precio === 'number') total += subtotal;

    lista.innerHTML += `
      <div class="item-carrito">
        <div>
          <strong>${item.nombre}</strong><br>
          ${typeof item.precio === 'number' ? '$' + item.precio + ' c/u' : 'Valor a consultar'}
        </div>

        <div class="controles">
          <button onclick="cambiarCantidad(${index}, -1)">−</button>
          <span>${item.cantidad}</span>
          <button onclick="cambiarCantidad(${index}, 1)">+</button>
        </div>

        <div>
          ${typeof subtotal === 'number' ? '$' + subtotal : 'Consultar'}
          <button onclick="eliminarItem(${index})">X</button>
        </div>
      </div>
    `;
  });

  let carrito_tiene_precios = carrito.some(item => typeof item.precio === 'number');
  document.getElementById("total").innerText = carrito_tiene_precios ? "$" + total : "Consultar";

  let modal = new bootstrap.Modal(document.getElementById('carritoModal'));
  modal.show();
}
*/

/* FUNCIÓN ELIMINADA (DEPRECATED)
// 🔹 Enviar pedido (ya no se usa)
function enviarPedido() {

  if (carrito.length === 0) {
    mostrarAlerta("⚠️ El carrito está vacío", "warning");
    return;
  }
}
*/

/* FUNCIÓN ELIMINADA (DEPRECATED)
function confirmarPedido() {

  if (enviando) return;

  let nombre = document.getElementById("nombreCliente").value.trim();
  let telefono = document.getElementById("telefonoCliente").value.trim();

  if (nombre === "" || telefono === "") {
    mostrarAlerta("⚠️ Ingresa tu nombre y teléfono", "warning");
    return;
  }

  enviando = true;

  setTimeout(() => {
    enviando = false;
  }, 2000);

  let total = 0;
  let mensaje = "*SOLICITUD DE SERVICIO - KEYREN ASESORES*\n\n";
  mensaje += `Cliente: ${nombre}\n`;
  mensaje += `Teléfono: ${telefono}\n\n`;
  mensaje += `*SERVICIOS SOLICITADOS:*\n\n`;

  carrito.forEach(item => {
    let subtotal = (typeof item.precio === 'number') ? item.precio * item.cantidad : 'Consultar';
    if (typeof item.precio === 'number') total += subtotal;

    mensaje += `📋 ${item.nombre}\n`;
    mensaje += `Cantidad: ${item.cantidad}\n`;
    if (typeof subtotal === 'number') {
      mensaje += `Valor: $${subtotal}\n\n`;
    } else {
      mensaje += `Valor: ${subtotal}\n\n`;
    }
  });

  mensaje += `*TOTAL A CONSULTAR*\n\nGracias por tu interés en nuestros servicios.`;

  let url = `https://wa.me/TU_NUMERO_DE_WHATSAPP_AQUI?text=${encodeURIComponent(mensaje)}`;

  guardarPedido(nombre, telefono, carrito, total);

  window.open(url, "_blank");

  // Limpiar el carrito después de enviar el pedido
  carrito = [];
  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarContador();

  cerrarTodosLosModales();

  mostrarAlerta("Solicitud de servicio lista para enviar en WhatsApp", "success");

  document.getElementById("nombreCliente").value = "";
  document.getElementById("telefonoCliente").value = "";
}
*/

function guardarPedido(nombre, telefono, carrito, total) {

  let pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];

  let nuevoPedido = {
    cliente: nombre,
    telefono: telefono,
    productos: JSON.parse(JSON.stringify(carrito)),
    total: total,
    fecha: new Date().toISOString(),
    estado: "pendiente"
  };

  pedidos.push(nuevoPedido);

  localStorage.setItem("pedidos", JSON.stringify(pedidos));
}

function verPedidos() {
  let pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
  console.log(pedidos);
}

// 🔹 Inicializar contador al cargar
actualizarContador();

function cambiarCantidad(index, cambio) {
    mostrarAlerta("🔄 Cantidad actualizada", "info");
  carrito[index].cantidad += cambio;

  if (carrito[index].cantidad <= 0) {
    carrito.splice(index, 1);
  }

  guardarCarrito();
  cerrarTodosLosModales();
  abrirCarrito();
}

function mostrarAlerta(mensaje, tipo = "success") {

  let colores = {
    success: "bg-success",
    error: "bg-danger",
    warning: "bg-warning",
    info: "bg-primary"
  };

  let toast = document.createElement("div");
  toast.className = `toast align-items-center text-white ${colores[tipo]} border-0 show mb-2`;

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${mensaje}
      </div>
      <button class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button>
    </div>
  `;

  document.getElementById("toastContainer").appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

const sonidoAgregar = new Audio("sounds/click.mp3");

function reproducirSonido() {
  sonidoAgregar.currentTime = 0;
  sonidoAgregar.play();
}

let indexAEliminar = null;

function eliminarItem(index) {

  indexAEliminar = index;

  document.getElementById("productoEliminar").innerText =
    carrito[index].nombre;

  let modal = new bootstrap.Modal(document.getElementById('confirmModal'));
  modal.show();
}

// botón confirmar
document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("btnConfirmarEliminar")
    .addEventListener("click", () => {

      if (indexAEliminar !== null) {
        let nombre = carrito[indexAEliminar].nombre;

        carrito.splice(indexAEliminar, 1);

        guardarCarrito();
        cerrarTodosLosModales();
        abrirCarrito();

        mostrarAlerta(`❌ ${nombre} eliminado`, "error");

        indexAEliminar = null;
      }
    });

});

function cerrarTodosLosModales() {

  document.querySelectorAll('.modal.show').forEach(modal => {
    let instancia = bootstrap.Modal.getInstance(modal);
    if (instancia) instancia.hide();
  });

  document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
  document.body.classList.remove('modal-open');
  document.body.style = '';
}

function animarCarrito() {
  let btn = document.querySelector(".carrito-btn");

  btn.classList.add("animar");

  setTimeout(() => {
    btn.classList.remove("animar");
  }, 300);
}

window.addEventListener('storage', (event) => {
  if (event.key === 'menu') {
    cargarMenu();
  }
});

document.addEventListener("DOMContentLoaded", () => {

  const carousel = document.querySelector('#carouselPizza');

  if (carousel) {
    carousel.addEventListener('slide.bs.carousel', function () {
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        video.pause();
        video.currentTime = 0;
      });
    });
  }

});
