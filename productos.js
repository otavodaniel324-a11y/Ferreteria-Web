document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const formularioBusqueda = document.getElementById('formulario-busqueda');
    const campoBusqueda = document.getElementById('texto-busqueda');
    const estadoBusqueda = document.getElementById('estado-busqueda');
    const listaProductos = document.getElementById('lista-productos');
    const productos = listaProductos.querySelectorAll('li');

    // Elementos del Carrito Flotante (en el Header)
    const tablaCarritoBody = document.querySelector('#lista-carrito tbody');
    const btnVaciarCarritoHeader = document.getElementById('vaciar-carrito');

    // Elementos del Carrito Inferior / Sección (en el Main)
    const seccionCarrito = document.getElementById('carrito');
    const carritoItemsList = document.getElementById('carrito-items');
    const carritoTotalLabel = document.getElementById('carrito-total');
    const carritoVacioMensaje = document.getElementById('carrito-vacio');
    const btnFinalizarCompra = document.getElementById('finalizar-compra');
    const btnVaciarCarritoSeccion = seccionCarrito ? seccionCarrito.querySelector('#vaciar-carrito') : null;
    const btnCerrarCarrito = document.getElementById('cerrar-carrito');
    const avisoCarritoAccesibilidad = document.getElementById('aviso-carrito');

    // Estructura de datos interna del carrito
    let carrito = [];

    // ==========================================================================
    // 1. SISTEMA DE BÚSQUEDA DINÁMICA
    // ==========================================================================
    function filtrarProductos() {
        const termino = campoBusqueda.value.toLowerCase().trim();
        let encontrados = 0;

        productos.forEach(producto => {
            // Lee el atributo estructurado en tu HTML
            const textoData = producto.getAttribute('data-busqueda') || '';
            
            if (textoData.toLowerCase().includes(termino)) {
                producto.style.display = '';
                encontrados++;
            } else {
                producto.style.display = 'none';
            }
        });

        // Actualiza el texto de estado dinámico que se muestra en tu imagen
        if (termino === '') {
            estadoBusqueda.textContent = '';
        } else {
            estadoBusqueda.textContent = `${encontrados} ${encontrados === 1 ? 'producto encontrado' : 'productos encontrados'}`;
        }
    }

    // Filtrado en tiempo real al escribir
    campoBusqueda.addEventListener('input', filtrarProductos);

    // Evita que la página se recargue al presionar Enter o clic en "Buscar"
    formularioBusqueda.addEventListener('submit', (e) => {
        e.preventDefault();
        filtrarProductos();
    });

    // ==========================================================================
    // 2. CONTROL DEL CARRITO DE COMPRAS
    // ==========================================================================
    
    // Escucha los clics en la lista de productos (Delegación de eventos)
    listaProductos.addEventListener('click', (e) => {
        if (e.target.classList.contains('Agregar-carrito')) {
            e.preventDefault();
            const boton = e.target;
            const tarjetaProducto = boton.closest('li');
            
            // Extrae la información del producto de la interfaz
            const productoAgregado = {
                id: boton.getAttribute('data-id'),
                titulo: tarjetaProducto.querySelector('h3').textContent,
                precioTexto: tarjetaProducto.querySelector('.precio').textContent,
                // Si el producto no tiene imagen asignada, usa un marcador por defecto
                imagen: tarjetaProducto.querySelector('img') ? tarjetaProducto.querySelector('img').src : 'imagenes/logo1.png',
                cantidad: 1
            };

            agregarAlCarrito(productoAgregado);
        }
    });

    function agregarAlCarrito(productoNuevo) {
        // Verifica si el producto ya existe en el carrito
        const existe = carrito.some(item => item.id === productoNuevo.id);

        if (existe) {
            carrito = carrito.map(item => {
                if (item.id === productoNuevo.id) {
                    item.cantidad++;
                    return item;
                } else {
                    return item;
                }
            });
        } else {
            carrito.push(productoNuevo);
        }

        // Muestra la sección inferior del carrito al agregar algo
        if (seccionCarrito) seccionCarrito.removeAttribute('hidden');

        actualizarInterfazCarrito();
        notificarLector(productoNuevo.titulo);
    }

    function eliminarDelCarrito(id) {
        carrito = carrito.filter(item => item.id !== id);
        actualizarInterfazCarrito();
    }

    function vaciarCarrito() {
        carrito = [];
        actualizarInterfazCarrito();
    }

    // ==========================================================================
    // 3. RENDERIZADO Y ACTUALIZACIÓN DE LA INTERFAZ
    // ==========================================================================
    function actualizarInterfazCarrito() {
        // --- LIMPIAR AMBAS VISTAS ---
        tablaCarritoBody.innerHTML = '';
        if (carritoItemsList) carritoItemsList.innerHTML = '';

        let totalAcumulado = 0;

        carrito.forEach(item => {
            // Convierte el texto "$24.900" a un número entero operable (24900)
            const valorNumerico = parseInt(item.precioTexto.replace(/[^0-9]/g, ''), 10);
            totalAcumulado += (valorNumerico * item.cantidad);

            // A. Insertar en el Carrito Flotante del Header (Tabla)
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${item.imagen}" width="40" style="object-fit: contain;"></td>
                <td>${item.titulo} (x${item.cantidad})</td>
                <td>${item.precioTexto}</td>
                <td><a href="#" class="borrar-producto" data-id="${item.id}" style="color: #d32f2f; text-decoration: none; font-weight: bold;">X</a></td>
            `;
            tablaCarritoBody.appendChild(row);

            // B. Insertar en la sección de Carrito Inferior (Lista ul)
            if (carritoItemsList) {
                const li = document.createElement('li');
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.style.marginBottom = '10px';
                li.innerHTML = `
                    <span>${item.titulo} - <strong>${item.precioTexto}</strong> (Cantidad: ${item.cantidad})</span>
                    <button type="button" class="borrar-producto-btn" data-id="${item.id}" style="background:none; border:none; color:#d32f2f; cursor:pointer; font-weight:bold;">Eliminar</button>
                `;
                carritoItemsList.appendChild(li);
            }
        });

        // --- ACTUALIZAR VALORES DE TOTAL Y MENSAJES ---
        const totalFormateado = '$' + totalAcumulado.toLocaleString('es-CO');
        if (carritoTotalLabel) carritoTotalLabel.textContent = totalFormateado;

        if (carritoVacioMensaje) {
            if (carrito.length === 0) {
                carritoVacioMensaje.style.display = 'block';
            } else {
                carritoVacioMensaje.style.display = 'none';
            }
        }
    }

    // ==========================================================================
    // 4. ACCIONES DE LOS BOTONES Y PERMISOS
    // ==========================================================================
    
    // Captura clics para eliminar elementos individuales de la tabla del header
    tablaCarritoBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('borrar-producto')) {
            e.preventDefault();
            eliminarDelCarrito(e.target.getAttribute('data-id'));
        }
    });

    // Captura clics para eliminar elementos individuales del carrito inferior
    if (carritoItemsList) {
        carritoItemsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('borrar-producto-btn')) {
                eliminarDelCarrito(e.target.getAttribute('data-id'));
            }
        });
    }

    // Asignación de funciones de vaciado a ambos botones de tu HTML
    if (btnVaciarCarritoHeader) {
        btnVaciarCarritoHeader.addEventListener('click', (e) => {
            e.preventDefault();
            vaciarCarrito();
        });
    }
    if (btnVaciarCarritoSeccion) {
        btnVaciarCarritoSeccion.addEventListener('click', vaciarCarrito);
    }

    // Ocultar sección del carrito inferior
    if (btnCerrarCarrito) {
        btnCerrarCarrito.addEventListener('click', () => {
            seccionCarrito.setAttribute('hidden', 'true');
        });
    }

    // Finalizar compra simulada
    if (btnFinalizarCompra) {
        btnFinalizarCompra.addEventListener('click', () => {
            if (carrito.length === 0) {
                alert('Tu carrito está vacío. Agrega algunos materiales antes de proceder.');
            } else {
                alert('¡Pedido procesado con éxito en Ferretería Atlas! Redirigiendo...');
                vaciarCarrito();
            }
        });
    }

    // Accesibilidad para el elemento aria-live
    function notificarLector(nombreProducto) {
        if (avisoCarritoAccesibilidad) {
            avisoCarritoAccesibilidad.textContent = `Se ha agregado ${nombreProducto} al carrito de compras de manera exitosa.`;
        }
    }
});

