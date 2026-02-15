// ============================================================================
// SISTEMA DE GESTIÓN DE PELÍCULAS - CINEFLIX
// Arquitectura: POO + LocalStorage + Separación de Responsabilidades
// Autor: Sistema desarrollado con JavaScript ES6+
// ============================================================================

'use strict';

// ============================================================================
// CLASE: Pelicula
// Modelo de datos para una película
// ============================================================================
class Pelicula {
    constructor(titulo, genero, director, ano, calificacion, descripcion, imagen, id = null) {
        this.id = id || this.generarID();
        this.titulo = titulo;
        this.genero = genero;
        this.director = director;
        this.ano = parseInt(ano);
        this.calificacion = parseFloat(calificacion);
        this.descripcion = descripcion;
        this.imagen = imagen;
        this.fechaCreacion = new Date().toISOString();
    }

    /**
     * Genera un ID único usando timestamp y random
     * @returns {string} ID único
     */
    generarID() {
        return `movie_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Valida los datos de la película
     * @returns {Object} {valido: boolean, errores: string[]}
     */
    validar() {
        const errores = [];

        if (!this.titulo || this.titulo.trim().length < 2) {
            errores.push('El título debe tener al menos 2 caracteres');
        }

        if (!this.genero) {
            errores.push('Debe seleccionar un género');
        }

        if (!this.director || this.director.trim().length < 2) {
            errores.push('El director debe tener al menos 2 caracteres');
        }

        if (!this.ano || this.ano < 1900 || this.ano > new Date().getFullYear() + 5) {
            errores.push('El año debe estar entre 1900 y el año actual + 5');
        }

        if (!this.calificacion || this.calificacion < 1 || this.calificacion > 10) {
            errores.push('La calificación debe estar entre 1 y 10');
        }

        if (!this.descripcion || this.descripcion.trim().length < 10) {
            errores.push('La descripción debe tener al menos 10 caracteres');
        }

        if (!this.imagen || !this.validarURL(this.imagen)) {
            errores.push('Debe proporcionar una URL de imagen válida');
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }

    /**
     * Valida formato de URL
     * @param {string} url - URL a validar
     * @returns {boolean}
     */
    validarURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Convierte la película a objeto plano para LocalStorage
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            titulo: this.titulo,
            genero: this.genero,
            director: this.director,
            ano: this.ano,
            calificacion: this.calificacion,
            descripcion: this.descripcion,
            imagen: this.imagen,
            fechaCreacion: this.fechaCreacion
        };
    }
}

// ============================================================================
// CLASE: AuthManager
// Gestiona autenticación y registro de usuarios
// ============================================================================
class AuthManager {
    constructor() {
        this.STORAGE_USERS_KEY = 'cineflix_users';
        this.STORAGE_SESSION_KEY = 'cineflix_session';
        this.inicializarUsuariosPorDefecto();
    }

    /**
     * Crea usuarios de prueba si no existen
     */
    inicializarUsuariosPorDefecto() {
        const usuarios = this.obtenerUsuarios();
        
        if (usuarios.length === 0) {
            const usuariosPrueba = [
                { 
                    id: 'user_1',
                    nombre: 'Administrador',
                    email: 'admin@cineflix.com',
                    usuario: 'admin', 
                    password: 'admin123',
                    fechaRegistro: new Date().toISOString()
                },
                { 
                    id: 'user_2',
                    nombre: 'Usuario Demo',
                    email: 'usuario@cineflix.com',
                    usuario: 'usuario', 
                    password: '1234',
                    fechaRegistro: new Date().toISOString()
                },
                { 
                    id: 'user_3',
                    nombre: 'Demo User',
                    email: 'demo@cineflix.com',
                    usuario: 'demo', 
                    password: 'demo',
                    fechaRegistro: new Date().toISOString()
                }
            ];
            localStorage.setItem(this.STORAGE_USERS_KEY, JSON.stringify(usuariosPrueba));
        }
    }

    /**
     * Obtiene todos los usuarios del LocalStorage
     * @returns {Array}
     */
    obtenerUsuarios() {
        try {
            const usuarios = localStorage.getItem(this.STORAGE_USERS_KEY);
            return usuarios ? JSON.parse(usuarios) : [];
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            return [];
        }
    }

    /**
     * Guarda usuarios en LocalStorage
     * @param {Array} usuarios - Array de usuarios
     */
    guardarUsuarios(usuarios) {
        try {
            localStorage.setItem(this.STORAGE_USERS_KEY, JSON.stringify(usuarios));
        } catch (error) {
            console.error('Error al guardar usuarios:', error);
            throw new Error('No se pudieron guardar los usuarios');
        }
    }

    /**
     * Valida credenciales de login
     * @param {string} usuario - Nombre de usuario
     * @param {string} password - Contraseña
     * @returns {Object} {exito: boolean, mensaje: string, usuario?: Object}
     */
    login(usuario, password) {
        if (!usuario || !password) {
            return { exito: false, mensaje: 'Usuario y contraseña son requeridos' };
        }

        const usuarios = this.obtenerUsuarios();
        const usuarioEncontrado = usuarios.find(
            u => u.usuario === usuario && u.password === password
        );

        if (usuarioEncontrado) {
            // Guardar sesión
            const sesion = {
                id: usuarioEncontrado.id,
                nombre: usuarioEncontrado.nombre,
                usuario: usuarioEncontrado.usuario,
                email: usuarioEncontrado.email,
                fechaLogin: new Date().toISOString()
            };
            localStorage.setItem(this.STORAGE_SESSION_KEY, JSON.stringify(sesion));

            return {
                exito: true,
                mensaje: '¡Bienvenido!',
                usuario: sesion
            };
        }

        return {
            exito: false,
            mensaje: 'Usuario o contraseña incorrectos'
        };
    }

    /**
     * Registra un nuevo usuario
     * @param {Object} datos - {nombre, email, usuario, password}
     * @returns {Object} {exito: boolean, mensaje: string}
     */
    registrar(datos) {
        const { nombre, email, usuario, password, confirmPassword } = datos;

        // Validaciones
        if (!nombre || nombre.trim().length < 3) {
            return { exito: false, mensaje: 'El nombre debe tener al menos 3 caracteres' };
        }

        if (!email || !this.validarEmail(email)) {
            return { exito: false, mensaje: 'Email inválido' };
        }

        if (!usuario || usuario.trim().length < 4) {
            return { exito: false, mensaje: 'El usuario debe tener al menos 4 caracteres' };
        }

        if (!password || password.length < 6) {
            return { exito: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' };
        }

        if (password !== confirmPassword) {
            return { exito: false, mensaje: 'Las contraseñas no coinciden' };
        }

        const usuarios = this.obtenerUsuarios();

        // Verificar si el usuario ya existe
        if (usuarios.some(u => u.usuario === usuario)) {
            return { exito: false, mensaje: 'El usuario ya existe' };
        }

        if (usuarios.some(u => u.email === email)) {
            return { exito: false, mensaje: 'El email ya está registrado' };
        }

        // Crear nuevo usuario
        const nuevoUsuario = {
            id: `user_${Date.now()}`,
            nombre: nombre.trim(),
            email: email.trim().toLowerCase(),
            usuario: usuario.trim(),
            password,
            fechaRegistro: new Date().toISOString()
        };

        usuarios.push(nuevoUsuario);
        this.guardarUsuarios(usuarios);

        return {
            exito: true,
            mensaje: 'Cuenta creada exitosamente. Ya puedes iniciar sesión'
        };
    }

    /**
     * Valida formato de email
     * @param {string} email
     * @returns {boolean}
     */
    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    /**
     * Cierra sesión del usuario actual
     */
    logout() {
        localStorage.removeItem(this.STORAGE_SESSION_KEY);
    }

    /**
     * Obtiene la sesión activa
     * @returns {Object|null}
     */
    obtenerSesionActiva() {
        try {
            const sesion = localStorage.getItem(this.STORAGE_SESSION_KEY);
            return sesion ? JSON.parse(sesion) : null;
        } catch {
            return null;
        }
    }

    /**
     * Verifica si hay un usuario autenticado
     * @returns {boolean}
     */
    estaAutenticado() {
        return this.obtenerSesionActiva() !== null;
    }
}

// ============================================================================
// CLASE: PeliculaManager
// Gestiona operaciones CRUD de películas
// ============================================================================
class PeliculaManager {
    constructor() {
        this.STORAGE_KEY = 'cineflix_peliculas';
        this.peliculas = this.cargarPeliculas();
    }

    /**
     * Carga películas desde LocalStorage
     * @returns {Array<Pelicula>}
     */
    cargarPeliculas() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                const peliculasData = JSON.parse(data);
                return peliculasData.map(p => {
                    const pelicula = new Pelicula(
                        p.titulo,
                        p.genero,
                        p.director,
                        p.ano,
                        p.calificacion,
                        p.descripcion,
                        p.imagen,
                        p.id
                    );
                    pelicula.fechaCreacion = p.fechaCreacion;
                    return pelicula;
                });
            }
            return this.obtenerPeliculasIniciales();
        } catch (error) {
            console.error('Error al cargar películas:', error);
            return this.obtenerPeliculasIniciales();
        }
    }

    /**
     * Películas de ejemplo para inicializar el sistema
     * @returns {Array<Pelicula>}
     */
    obtenerPeliculasIniciales() {
        const peliculasIniciales = [
            new Pelicula(
                'Matrix',
                'Ciencia Ficción',
                'Lana Wachowski, Lilly Wachowski',
                1999,
                8.7,
                'Un hacker descubre la impactante verdad sobre su realidad y su papel en la guerra contra sus controladores.',
                'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg'
            ),
            new Pelicula(
                'El Padrino',
                'Drama',
                'Francis Ford Coppola',
                1972,
                9.2,
                'El patriarca envejecido de una dinastía del crimen organizado transfiere el control de su imperio clandestino a su hijo reacio.',
                'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg'
            ),
            new Pelicula(
                'Inception',
                'Ciencia Ficción',
                'Christopher Nolan',
                2010,
                8.8,
                'Un ladrón que roba secretos corporativos mediante el uso de tecnología de sueños compartidos recibe la tarea inversa de plantar una idea.',
                'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg'
            ),
            new Pelicula(
                'Forrest Gump',
                'Drama',
                'Robert Zemeckis',
                1994,
                8.8,
                'Las presidencias de Kennedy y Johnson, los eventos de Vietnam, Watergate y otros eventos históricos se desarrollan a través de la perspectiva de un hombre de Alabama.',
                'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg'
            ),
            new Pelicula(
                'Pulp Fiction',
                'Acción',
                'Quentin Tarantino',
                1994,
                8.9,
                'Las vidas de dos asesinos a sueldo, un boxeador, la esposa de un gánster y dos bandidos se entrelazan en cuatro historias de violencia y redención.',
                'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg'
            ),
            new Pelicula(
                'Interestelar',
                'Ciencia Ficción',
                'Christopher Nolan',
                2014,
                8.6,
                'Un equipo de exploradores viaja a través de un agujero de gusano en el espacio en un intento de asegurar la supervivencia de la humanidad.',
                'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'
            ),
            new Pelicula(
                'El Señor de los Anillos: El Retorno del Rey',
                'Aventura',
                'Peter Jackson',
                2003,
                8.9,
                'Gandalf y Aragorn lideran el Mundo de los Hombres contra el ejército de Sauron para atraer su mirada de Frodo y Sam mientras se acercan al Monte del Destino.',
                'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg'
            ),
            new Pelicula(
                'Gladiador',
                'Acción',
                'Ridley Scott',
                2000,
                8.5,
                'Un ex general romano busca venganza contra el corrupto emperador que asesinó a su familia y lo envió a la esclavitud.',
                'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg'
            )
        ];

        this.peliculas = peliculasIniciales;
        this.guardarPeliculas();
        return peliculasIniciales;
    }

    /**
     * Guarda películas en LocalStorage
     */
    guardarPeliculas() {
        try {
            const peliculasJSON = this.peliculas.map(p => p.toJSON());
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(peliculasJSON));
        } catch (error) {
            console.error('Error al guardar películas:', error);
            throw new Error('No se pudieron guardar las películas');
        }
    }

    /**
     * Obtiene todas las películas
     * @returns {Array<Pelicula>}
     */
    obtenerTodas() {
        return [...this.peliculas];
    }

    /**
     * Obtiene una película por ID
     * @param {string} id
     * @returns {Pelicula|null}
     */
    obtenerPorId(id) {
        return this.peliculas.find(p => p.id === id) || null;
    }

    /**
     * Agrega una nueva película
     * @param {Pelicula} pelicula
     * @returns {Object} {exito: boolean, mensaje: string, pelicula?: Pelicula}
     */
    agregar(pelicula) {
        const validacion = pelicula.validar();
        
        if (!validacion.valido) {
            return {
                exito: false,
                mensaje: validacion.errores.join('\n')
            };
        }

        this.peliculas.push(pelicula);
        this.guardarPeliculas();

        return {
            exito: true,
            mensaje: 'Película agregada exitosamente',
            pelicula
        };
    }

    /**
     * Actualiza una película existente
     * @param {string} id
     * @param {Object} datos - Datos actualizados
     * @returns {Object} {exito: boolean, mensaje: string}
     */
    actualizar(id, datos) {
        const index = this.peliculas.findIndex(p => p.id === id);

        if (index === -1) {
            return {
                exito: false,
                mensaje: 'Película no encontrada'
            };
        }

        const peliculaActualizada = new Pelicula(
            datos.titulo,
            datos.genero,
            datos.director,
            datos.ano,
            datos.calificacion,
            datos.descripcion,
            datos.imagen,
            id
        );

        // Mantener fecha de creación original
        peliculaActualizada.fechaCreacion = this.peliculas[index].fechaCreacion;

        const validacion = peliculaActualizada.validar();

        if (!validacion.valido) {
            return {
                exito: false,
                mensaje: validacion.errores.join('\n')
            };
        }

        this.peliculas[index] = peliculaActualizada;
        this.guardarPeliculas();

        return {
            exito: true,
            mensaje: 'Película actualizada exitosamente'
        };
    }

    /**
     * Elimina una película
     * @param {string} id
     * @returns {Object} {exito: boolean, mensaje: string}
     */
    eliminar(id) {
        const index = this.peliculas.findIndex(p => p.id === id);

        if (index === -1) {
            return {
                exito: false,
                mensaje: 'Película no encontrada'
            };
        }

        this.peliculas.splice(index, 1);
        this.guardarPeliculas();

        return {
            exito: true,
            mensaje: 'Película eliminada exitosamente'
        };
    }

    /**
     * Busca películas por término
     * @param {string} termino - Término de búsqueda
     * @returns {Array<Pelicula>}
     */
    buscar(termino) {
        if (!termino || termino.trim() === '') {
            return this.obtenerTodas();
        }

        const terminoLower = termino.toLowerCase();

        return this.peliculas.filter(pelicula => {
            return (
                pelicula.titulo.toLowerCase().includes(terminoLower) ||
                pelicula.director.toLowerCase().includes(terminoLower) ||
                pelicula.descripcion.toLowerCase().includes(terminoLower)
            );
        });
    }

    /**
     * Filtra películas por género
     * @param {string} genero
     * @returns {Array<Pelicula>}
     */
    filtrarPorGenero(genero) {
        if (!genero || genero === '') {
            return this.obtenerTodas();
        }

        return this.peliculas.filter(p => p.genero === genero);
    }

    /**
     * Combina búsqueda y filtro de género
     * @param {string} termino - Término de búsqueda
     * @param {string} genero - Género a filtrar
     * @returns {Array<Pelicula>}
     */
    buscarYFiltrar(termino, genero) {
        let resultado = this.obtenerTodas();

        // Aplicar filtro de género
        if (genero && genero !== '') {
            resultado = resultado.filter(p => p.genero === genero);
        }

        // Aplicar búsqueda
        if (termino && termino.trim() !== '') {
            const terminoLower = termino.toLowerCase();
            resultado = resultado.filter(p => {
                return (
                    p.titulo.toLowerCase().includes(terminoLower) ||
                    p.director.toLowerCase().includes(terminoLower) ||
                    p.descripcion.toLowerCase().includes(terminoLower)
                );
            });
        }

        return resultado;
    }

    /**
     * Obtiene las películas más recientes
     * @param {number} cantidad - Número de películas a obtener
     * @returns {Array<Pelicula>}
     */
    obtenerRecientes(cantidad = 5) {
        return [...this.peliculas]
            .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
            .slice(0, cantidad);
    }

    /**
     * Ordena películas por calificación
     * @param {boolean} descendente - true para mayor a menor
     * @returns {Array<Pelicula>}
     */
    ordenarPorCalificacion(descendente = true) {
        return [...this.peliculas].sort((a, b) => {
            return descendente ? b.calificacion - a.calificacion : a.calificacion - b.calificacion;
        });
    }

    /**
     * Ordena películas por año
     * @param {boolean} descendente - true para más reciente primero
     * @returns {Array<Pelicula>}
     */
    ordenarPorAno(descendente = true) {
        return [...this.peliculas].sort((a, b) => {
            return descendente ? b.ano - a.ano : a.ano - b.ano;
        });
    }
}

// ============================================================================
// CLASE: UIManager
// Gestiona la interfaz de usuario y eventos
// ============================================================================
class UIManager {
    constructor(authManager, peliculaManager) {
        this.authManager = authManager;
        this.peliculaManager = peliculaManager;
        this.peliculaEditando = null;
        this.inicializar();
    }

    /**
     * Inicializa la aplicación
     */
    inicializar() {
        this.cachearElementos();
        this.configurarEventos();
        this.verificarAutenticacion();
    }

    /**
     * Cachea referencias a elementos del DOM
     */
    cachearElementos() {
        // Secciones
        this.loginSection = document.getElementById('loginSection');
        this.mainContent = document.getElementById('mainContent');

        // Botones de navegación
        this.btnLogin = document.getElementById('btnLogin');
        this.btnLogout = document.getElementById('btnLogout');
        this.btnAgregar = document.getElementById('btnAgregar');

        // Formularios
        this.formLogin = document.getElementById('formLogin');
        this.formRegistro = document.getElementById('formRegistro');
        this.formPelicula = document.getElementById('formPelicula');

        // Inputs de Login
        this.inputUser = document.getElementById('inputUser');
        this.inputPassword = document.getElementById('inputPassword');

        // Inputs de Registro
        this.inputNombre = document.getElementById('inputNombre');
        this.inputEmail = document.getElementById('inputEmail');
        this.inputUserReg = document.getElementById('inputUserReg');
        this.inputPasswordReg = document.getElementById('inputPasswordReg');
        this.inputConfirmPassword = document.getElementById('inputConfirmPassword');

        // Inputs de Película
        this.inputTitulo = document.getElementById('inputTitulo');
        this.inputGenero = document.getElementById('inputGenero');
        this.inputDirector = document.getElementById('inputDirector');
        this.inputAno = document.getElementById('inputAno');
        this.inputCalificacion = document.getElementById('inputCalificacion');
        this.inputDescripcion = document.getElementById('inputDescripcion');
        this.inputImagen = document.getElementById('inputImagen');

        // Buscador y filtro
        this.inputBuscar = document.getElementById('inputBuscar');
        this.selectGenero = document.getElementById('selectGenero');

        // Contenedores
        this.gridPeliculas = document.getElementById('gridPeliculas');
        this.carouselMovies = document.getElementById('carouselMovies');
        this.sinResultados = document.getElementById('sinResultados');

        // Modales
        this.modalPelicula = new bootstrap.Modal(document.getElementById('modalPelicula'));
        this.modalDetalles = new bootstrap.Modal(document.getElementById('modalDetalles'));
        this.modalTitulo = document.getElementById('modalTitulo');
        this.btnGuardarPelicula = document.getElementById('btnGuardarPelicula');

        // Tabs
        this.linkLogin = document.getElementById('linkLogin');
    }

    /**
     * Configura todos los eventos de la aplicación
     */
    configurarEventos() {
        // Eventos de autenticación
        this.formLogin.addEventListener('submit', (e) => this.handleLogin(e));
        this.formRegistro.addEventListener('submit', (e) => this.handleRegistro(e));
        this.btnLogout.addEventListener('click', () => this.handleLogout());
        this.btnLogin.addEventListener('click', () => this.mostrarLogin());

        // Evento del link para volver al login
        if (this.linkLogin) {
            this.linkLogin.addEventListener('click', (e) => {
                e.preventDefault();
                const loginTab = new bootstrap.Tab(document.getElementById('login-tab'));
                loginTab.show();
            });
        }

        // Eventos de películas
        this.btnAgregar.addEventListener('click', () => this.abrirModalAgregar());
        this.btnGuardarPelicula.addEventListener('click', () => this.handleGuardarPelicula());

        // Eventos de búsqueda y filtrado
        this.inputBuscar.addEventListener('input', () => this.aplicarFiltros());
        this.selectGenero.addEventListener('change', () => this.aplicarFiltros());

        // Event listener para cuando se cierra el modal de película
        document.getElementById('modalPelicula').addEventListener('hidden.bs.modal', () => {
            this.limpiarFormularioPelicula();
            this.peliculaEditando = null;
        });
    }

    /**
     * Verifica si hay sesión activa y muestra interfaz correspondiente
     */
    verificarAutenticacion() {
        if (this.authManager.estaAutenticado()) {
            this.mostrarInterfazPrincipal();
        } else {
            this.mostrarLogin();
        }
    }

    /**
     * Maneja el evento de login
     * @param {Event} e
     */
    handleLogin(e) {
        e.preventDefault();

        const usuario = this.inputUser.value.trim();
        const password = this.inputPassword.value;

        const resultado = this.authManager.login(usuario, password);

        if (resultado.exito) {
            this.mostrarMensaje('¡Bienvenido, ' + resultado.usuario.nombre + '!', 'success');
            this.mostrarInterfazPrincipal();
            this.formLogin.reset();
        } else {
            this.mostrarMensaje(resultado.mensaje, 'danger');
        }
    }

    /**
     * Maneja el evento de registro
     * @param {Event} e
     */
    handleRegistro(e) {
        e.preventDefault();

        const datos = {
            nombre: this.inputNombre.value.trim(),
            email: this.inputEmail.value.trim(),
            usuario: this.inputUserReg.value.trim(),
            password: this.inputPasswordReg.value,
            confirmPassword: this.inputConfirmPassword.value
        };

        const resultado = this.authManager.registrar(datos);

        if (resultado.exito) {
            this.mostrarMensaje(resultado.mensaje, 'success');
            this.formRegistro.reset();
            
            // Cambiar al tab de login
            setTimeout(() => {
                const loginTab = new bootstrap.Tab(document.getElementById('login-tab'));
                loginTab.show();
            }, 1500);
        } else {
            this.mostrarMensaje(resultado.mensaje, 'danger');
        }
    }

    /**
     * Maneja el evento de logout
     */
    handleLogout() {
        if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
            this.authManager.logout();
            this.mostrarLogin();
            this.mostrarMensaje('Sesión cerrada correctamente', 'info');
        }
    }

    /**
     * Muestra la pantalla de login
     */
    mostrarLogin() {
        this.loginSection.style.display = 'flex';
        this.mainContent.style.display = 'none';
        this.btnLogin.style.display = 'none';
        this.btnLogout.style.display = 'none';
        this.btnAgregar.style.display = 'none';
    }

    /**
     * Muestra la interfaz principal de la aplicación
     */
    mostrarInterfazPrincipal() {
        this.loginSection.style.display = 'none';
        this.mainContent.style.display = 'block';
        this.btnLogin.style.display = 'none';
        this.btnLogout.style.display = 'inline-block';
        this.btnAgregar.style.display = 'inline-block';

        // Cargar películas
        this.renderizarPeliculas();
        this.renderizarSlider();
    }

    /**
     * Renderiza todas las películas en el grid
     */
    renderizarPeliculas() {
        const peliculas = this.peliculaManager.obtenerTodas();
        this.mostrarPeliculas(peliculas);
    }

    /**
     * Muestra películas en el grid
     * @param {Array<Pelicula>} peliculas
     */
    mostrarPeliculas(peliculas) {
        this.gridPeliculas.innerHTML = '';

        if (peliculas.length === 0) {
            this.sinResultados.style.display = 'block';
            return;
        }

        this.sinResultados.style.display = 'none';

        peliculas.forEach(pelicula => {
            const card = this.crearTarjetaPelicula(pelicula);
            this.gridPeliculas.appendChild(card);
        });
    }

    /**
     * Crea una tarjeta de película
     * @param {Pelicula} pelicula
     * @returns {HTMLElement}
     */
    crearTarjetaPelicula(pelicula) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 col-xl-3';

        col.innerHTML = `
            <div class="movie-card">
                <img src="${pelicula.imagen}" alt="${pelicula.titulo}" class="movie-image" 
                     onerror="this.src='https://via.placeholder.com/300x450?text=Sin+Imagen'">
                <div class="movie-content">
                    <h5 class="movie-title">${this.escapeHtml(pelicula.titulo)}</h5>
                    <span class="movie-genre">${this.escapeHtml(pelicula.genero)}</span>
                    <p class="movie-meta">
                        <i class="bi bi-person-fill"></i> ${this.escapeHtml(pelicula.director)}
                    </p>
                    <p class="movie-meta">
                        <i class="bi bi-calendar-fill"></i> ${pelicula.ano}
                    </p>
                    <p class="movie-rating">
                        <i class="bi bi-star-fill"></i> ${pelicula.calificacion}/10
                    </p>
                    <p class="movie-description">${this.escapeHtml(pelicula.descripcion)}</p>
                    <div class="movie-actions">
                        <button class="btn btn-info btn-sm" onclick="uiManager.verDetalles('${pelicula.id}')">
                            <i class="bi bi-eye"></i> Ver
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="uiManager.editarPelicula('${pelicula.id}')">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="uiManager.eliminarPelicula('${pelicula.id}')">
                            <i class="bi bi-trash"></i> Borrar
                        </button>
                    </div>
                </div>
            </div>
        `;

        return col;
    }

    /**
     * Renderiza el slider de películas recientes
     */
    renderizarSlider() {
        const peliculasRecientes = this.peliculaManager.obtenerRecientes(5);
        this.carouselMovies.innerHTML = '';

        peliculasRecientes.forEach(pelicula => {
            const card = this.crearTarjetaSlider(pelicula);
            this.carouselMovies.appendChild(card);
        });
    }

    /**
     * Crea una tarjeta para el slider
     * @param {Pelicula} pelicula
     * @returns {HTMLElement}
     */
    crearTarjetaSlider(pelicula) {
        const card = document.createElement('div');
        card.className = 'slider-movie-card';
        card.onclick = () => this.verDetalles(pelicula.id);

        card.innerHTML = `
            <img src="${pelicula.imagen}" alt="${pelicula.titulo}"
                 onerror="this.src='https://via.placeholder.com/180x250?text=Sin+Imagen'">
            <div class="slider-movie-info">
                <h6>${this.escapeHtml(pelicula.titulo)}</h6>
                <small class="text-muted">${pelicula.ano}</small>
            </div>
        `;

        return card;
    }

    /**
     * Aplica filtros de búsqueda y género
     */
    aplicarFiltros() {
        const termino = this.inputBuscar.value.trim();
        const genero = this.selectGenero.value;

        const peliculasFiltradas = this.peliculaManager.buscarYFiltrar(termino, genero);
        this.mostrarPeliculas(peliculasFiltradas);
    }

    /**
     * Abre modal para agregar película
     */
    abrirModalAgregar() {
        this.peliculaEditando = null;
        this.modalTitulo.textContent = 'Agregar Película';
        this.limpiarFormularioPelicula();
        this.modalPelicula.show();
    }

    /**
     * Edita una película
     * @param {string} id
     */
    editarPelicula(id) {
        const pelicula = this.peliculaManager.obtenerPorId(id);
        
        if (!pelicula) {
            this.mostrarMensaje('Película no encontrada', 'danger');
            return;
        }

        this.peliculaEditando = id;
        this.modalTitulo.textContent = 'Editar Película';

        // Llenar formulario
        this.inputTitulo.value = pelicula.titulo;
        this.inputGenero.value = pelicula.genero;
        this.inputDirector.value = pelicula.director;
        this.inputAno.value = pelicula.ano;
        this.inputCalificacion.value = pelicula.calificacion;
        this.inputDescripcion.value = pelicula.descripcion;
        this.inputImagen.value = pelicula.imagen;

        this.modalPelicula.show();
    }

    /**
     * Elimina una película con confirmación
     * @param {string} id
     */
    eliminarPelicula(id) {
        const pelicula = this.peliculaManager.obtenerPorId(id);
        
        if (!pelicula) {
            this.mostrarMensaje('Película no encontrada', 'danger');
            return;
        }

        if (confirm(`¿Estás seguro que deseas eliminar "${pelicula.titulo}"?\n\nEsta acción no se puede deshacer.`)) {
            const resultado = this.peliculaManager.eliminar(id);

            if (resultado.exito) {
                this.mostrarMensaje(resultado.mensaje, 'success');
                this.renderizarPeliculas();
                this.renderizarSlider();
                this.aplicarFiltros();
            } else {
                this.mostrarMensaje(resultado.mensaje, 'danger');
            }
        }
    }

    /**
     * Muestra detalles de una película en modal
     * @param {string} id
     */
    verDetalles(id) {
        const pelicula = this.peliculaManager.obtenerPorId(id);
        
        if (!pelicula) {
            this.mostrarMensaje('Película no encontrada', 'danger');
            return;
        }

        document.getElementById('detallesTitulo').textContent = pelicula.titulo;
        document.getElementById('detallesImagen').src = pelicula.imagen;
        document.getElementById('detallesImagen').alt = pelicula.titulo;
        document.getElementById('detallesGenero').textContent = pelicula.genero;
        document.getElementById('detallesDirector').textContent = pelicula.director;
        document.getElementById('detallesAno').textContent = pelicula.ano;
        document.getElementById('detallesCalificacion').textContent = pelicula.calificacion;
        document.getElementById('detallesDescripcion').textContent = pelicula.descripcion;

        this.modalDetalles.show();
    }

    /**
     * Maneja el guardado de película (crear o actualizar)
     */
    handleGuardarPelicula() {
        if (!this.formPelicula.checkValidity()) {
            this.formPelicula.reportValidity();
            return;
        }

        const datos = {
            titulo: this.inputTitulo.value.trim(),
            genero: this.inputGenero.value,
            director: this.inputDirector.value.trim(),
            ano: this.inputAno.value,
            calificacion: this.inputCalificacion.value,
            descripcion: this.inputDescripcion.value.trim(),
            imagen: this.inputImagen.value.trim()
        };

        let resultado;

        if (this.peliculaEditando) {
            // Actualizar película existente
            resultado = this.peliculaManager.actualizar(this.peliculaEditando, datos);
        } else {
            // Crear nueva película
            const nuevaPelicula = new Pelicula(
                datos.titulo,
                datos.genero,
                datos.director,
                datos.ano,
                datos.calificacion,
                datos.descripcion,
                datos.imagen
            );
            resultado = this.peliculaManager.agregar(nuevaPelicula);
        }

        if (resultado.exito) {
            this.mostrarMensaje(resultado.mensaje, 'success');
            this.modalPelicula.hide();
            this.limpiarFormularioPelicula();
            this.renderizarPeliculas();
            this.renderizarSlider();
            this.aplicarFiltros();
        } else {
            this.mostrarMensaje(resultado.mensaje, 'danger');
        }
    }

    /**
     * Limpia el formulario de película
     */
    limpiarFormularioPelicula() {
        this.formPelicula.reset();
        this.peliculaEditando = null;
    }

    /**
     * Muestra un mensaje temporal
     * @param {string} mensaje
     * @param {string} tipo - 'success', 'danger', 'warning', 'info'
     */
    mostrarMensaje(mensaje, tipo = 'info') {
        // Crear elemento de alerta
        const alerta = document.createElement('div');
        alerta.className = `alert alert-${tipo} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
        alerta.style.zIndex = '9999';
        alerta.style.minWidth = '300px';
        alerta.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alerta);

        // Auto-remover después de 4 segundos
        setTimeout(() => {
            alerta.classList.remove('show');
            setTimeout(() => alerta.remove(), 150);
        }, 4000);
    }

    /**
     * Escapa HTML para prevenir XSS
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// ============================================================================
// FUNCIÓN GLOBAL PARA SLIDER
// ============================================================================
/**
 * Desplaza el slider de películas
 * @param {number} direction - -1 para izquierda, 1 para derecha
 */
function scrollSlider(direction) {
    const carousel = document.getElementById('carouselMovies');
    const scrollAmount = 200;
    carousel.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

// ============================================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ============================================================================

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // Crear instancias de los managers
    const authManager = new AuthManager();
    const peliculaManager = new PeliculaManager();
    
    // Crear instancia global de UIManager para acceso desde onclick
    window.uiManager = new UIManager(authManager, peliculaManager);

    console.log('🎬 CineFlix - Sistema iniciado correctamente');
    console.log('📊 Películas cargadas:', peliculaManager.obtenerTodas().length);
});
