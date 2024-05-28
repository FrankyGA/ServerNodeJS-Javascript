// Importación de módulos
const http = require("http");
const url = require("url");
const fs = require("fs");
const { MongoClient } = require("mongodb");
const { ObjectId } = require('mongodb'); // Uso en borrar personaje


// Conexión a la base de datos MongoDB
const urlConexion = "mongodb://127.0.0.1:27017";
// Ruta del archivo JSON que contiene los datos a importar
const jsonFilePath = "harry-potter-characters.json";

// Creación del servidor HTTP
const server = http.createServer();


// Manejo de las solicitudes al servidor
server.on("request", async function (peticion, respuesta) {
    let parsedUrl = url.parse(peticion.url, true);
    let urlPathname = parsedUrl.pathname;

    // Hacemos switch para controlar las rutas y la funcionalidad
    switch (urlPathname) {

        // Ruta raíz del servidor
        case "/":
            // Responder con mensaje de bienvenida y un botón para mostrar todos los personajes
            respuesta.end('<h1>Bienvenido al servidor Node.js con MongoDB</h1> <button class="btn btn-primary" onclick="window.location.href = \'/personajes\'">Mostrar personajes</button>');
            break;


        // Ruta para importar datos a la base de datos
        case "/importar":
            try {
                // Establecer conexión a la base de datos
                const conexion = new MongoClient(urlConexion);

                // Definir el nombre de la base de datos y de la colección
                await conexion.connect();
                console.log("Conexión establecida");

                let dbName = "harry";
                let nombreColeccion = "personajes";

                const db = conexion.db(dbName);

                // Crear una colección en la base de datos
                let resultado = await db.createCollection(nombreColeccion);
                console.log("Colección creada:", resultado.collectionName);

                // Leer el archivo JSON y convertirlo en objeto JavaScript
                const jsonData = fs.readFileSync(jsonFilePath, "utf8");
                const data = JSON.parse(jsonData);

                // Insertar los datos en la colección de la base de datos
                let insertDatos = await db.collection(nombreColeccion).insertMany(data);
                console.log(`${insertDatos.insertedCount} documentos insertados en la colección`);

                respuesta.writeHead(200, { 'Content-Type': 'text/plain' });
                respuesta.end('Importación exitosa');

            } catch (error) {
                console.error("Error en la importación:", error);
                respuesta.writeHead(500, { 'Content-Type': 'text/plain' });
                respuesta.end('Error al importar datos');
            } finally {
                if (conexion) {
                    // Cerrar conexión a la base de datos
                    await conexion.close();
                    console.log("Conexión cerrada");
                }
            }
            break;

        // Ruta para mostrar todos los personajes
        case "/personajes":
            try {
                const conexion = new MongoClient(urlConexion);
                await conexion.connect();
                console.log("Conexión establecida");

                const db = conexion.db("harry");
                const collection = db.collection("personajes");

                // Obtener todos los personajes de la base de datos
                let todosPersonajes = await collection.find({}).toArray();

                // Leer el archivo HTML que contiene la página web
                let html = fs.readFileSync("hogwarts.html", "utf8");

                // Reemplazar los datos de los personajes en el HTML
                let tablaPersonajes = todosPersonajes.map(personaje => {
                    return `<tr>
                        <td><img src="${personaje.image}" alt="${personaje.name}" style="max-width: 100px;"></td>
                        <td>${personaje.name}</td>
                        <td>${personaje.species}</td>
                        <td>${personaje.gender}</td>
                        <td>${personaje.house || '-'}</td>
                        <td>${personaje.yearOfBirth || '-'}</td>
                        <td><button onclick="confirmarBorrado('${personaje._id}')">Borrar</button></td>
                    </tr>`;
                }).join('');

                let htmlModificado = html.replace("<!-- Los datos de los personajes se mostrarán aquí -->", tablaPersonajes); // El cuerpo de la tabla con la consulta ira en el comentario que esta en el html

                // Enviar la respuesta con el HTML modificado
                respuesta.writeHead(200, { 'Content-Type': 'text/html' });
                respuesta.end(htmlModificado);// Saca el html modificado con la tabla de personajes

            } catch (error) {
                console.error("Error al obtener los personajes:", error);
                respuesta.writeHead(500, { 'Content-Type': 'text/plain' });
                respuesta.end('Error al obtener los personajes');
            }
            break;

        //Filtro 1: Mostrar todos los personajes cuyo atributo "species" tenga como valor "human".
        case "/filtro1":
            try {
                const conexion = new MongoClient(urlConexion);
                await conexion.connect();
                console.log("Conexión establecida");

                const db = conexion.db("harry");
                const collection = db.collection("personajes");

                // Realizar la consulta para obtener los personajes con species igual a "human"
                let personajesFiltrados = await collection.find({ species: "human" }).toArray();

                // Generar la tabla HTML con los resultados de la consulta
                let tablaFiltrada = personajesFiltrados.map(personaje => {
                    return `<tr>
                            <td><img src="${personaje.image}" alt="${personaje.name}" style="max-width: 100px;"></td>
                            <td>${personaje.name}</td>
                            <td>${personaje.species}</td>
                            <td>${personaje.gender}</td>
                            <td>${personaje.house || '-'}</td>
                            <td>${personaje.yearOfBirth || '-'}</td>
                            <td><button onclick="confirmarBorrado('${personaje._id}')">Borrar</button></td>
                        </tr>`;
                }).join('');

                // Leer el archivo HTML que contiene la página web
                let html = fs.readFileSync("hogwarts.html", "utf8");

                // Reemplazar los datos de los personajes en el HTML
                let htmlModificado = html.replace("<!-- Los datos de los personajes se mostrarán aquí -->", tablaFiltrada); // El cuerpo de la tabla con la consulta ira en el comentario que esta en el html

                // Enviar la respuesta con el HTML modificado
                respuesta.writeHead(200, { 'Content-Type': 'text/html' });
                respuesta.end(htmlModificado);

            } catch (error) {
                console.error("Error al aplicar el filtro:", error);
                respuesta.writeHead(500, { 'Content-Type': 'text/plain' });
                respuesta.end('Error al aplicar el filtro');
            }
            break;
        // Filtro 2: Mostrar todos los personajes cuyo atributo "yearOfBirth" sea anterior a 1979.
        case "/filtro2":
            try {
                const conexion = new MongoClient(urlConexion);
                await conexion.connect();
                console.log("Conexión establecida");

                const db = conexion.db("harry");
                const collection = db.collection("personajes");

                // Realizar la consulta para obtener los personajes con yearOfBirth anterior a 1979
                let personajesFiltrados = await collection.find({ yearOfBirth: { $lt: 1979 } }).toArray();

                // Generar la tabla HTML con los resultados de la consulta
                let tablaFiltrada = personajesFiltrados.map(personaje => {
                    return `<tr>
                            <td><img src="${personaje.image}" alt="${personaje.name}" style="max-width: 100px;"></td>
                            <td>${personaje.name}</td>
                            <td>${personaje.species}</td>
                            <td>${personaje.gender}</td>
                            <td>${personaje.house || '-'}</td>
                            <td>${personaje.yearOfBirth || '-'}</td>
                            <td><button onclick="confirmarBorrado('${personaje._id}')">Borrar</button></td>
                        </tr>`;
                }).join('');

                // Leer el archivo HTML que contiene la página web
                let html = fs.readFileSync("hogwarts.html", "utf8");

                // Reemplazar los datos de los personajes en el HTML
                let htmlModificado = html.replace("<!-- Los datos de los personajes se mostrarán aquí -->", tablaFiltrada); // El cuerpo de la tabla con la consulta ira en el comentario que esta en el html

                // Enviar la respuesta con el HTML modificado
                respuesta.writeHead(200, { 'Content-Type': 'text/html' });
                respuesta.end(htmlModificado);

            } catch (error) {
                console.error("Error al aplicar el filtro:", error);
                respuesta.writeHead(500, { 'Content-Type': 'text/plain' });
                respuesta.end('Error al aplicar el filtro');
            }
            break;

        // Filtro 3: Mostrar todos los personajes cuyo atributo "wood" de la propiedad "wand" sea "holly".
        case "/filtro3":
            try {
                const conexion = new MongoClient(urlConexion);
                await conexion.connect();
                console.log("Conexión establecida");

                const db = conexion.db("harry");
                const collection = db.collection("personajes");

                // Realizar la consulta para obtener los personajes con wand.wood igual a "holly"
                let personajesFiltrados = await collection.find({ "wand.wood": "holly" }).toArray();

                // Generar la tabla HTML con los resultados de la consulta
                let tablaFiltrada = personajesFiltrados.map(personaje => {
                    return `<tr>
                            <td><img src="${personaje.image}" alt="${personaje.name}" style="max-width: 100px;"></td>
                            <td>${personaje.name}</td>
                            <td>${personaje.species}</td>
                            <td>${personaje.gender}</td>
                            <td>${personaje.house || '-'}</td>
                            <td>${personaje.yearOfBirth || '-'}</td>
                            <td><button onclick="confirmarBorrado('${personaje._id}')">Borrar</button></td>
                        </tr>`;
                }).join('');

                // Leer el archivo HTML que contiene la página web
                let html = fs.readFileSync("hogwarts.html", "utf8");

                // Reemplazar los datos de los personajes en el HTML en donde esta el comentario
                let htmlModificado = html.replace("<!-- Los datos de los personajes se mostrarán aquí -->", tablaFiltrada); // El cuerpo de la tabla con la consulta ira en el comentario que esta en el html

                // Enviar la respuesta con el HTML modificado
                respuesta.writeHead(200, { 'Content-Type': 'text/html' });
                respuesta.end(htmlModificado);

            } catch (error) {
                console.error("Error al aplicar el filtro:", error);
                respuesta.writeHead(500, { 'Content-Type': 'text/plain' });
                respuesta.end('Error al aplicar el filtro');
            }
            break;
        // Filtro 4: Mostrar todos los personajes que estén vivos (propiedad "alive" igual a true) y además sean estudiantes (propiedad "hogwartsStudent" igual a true).
        case "/filtro4":
            try {
                const conexion = new MongoClient(urlConexion);
                await conexion.connect();
                console.log("Conexión establecida");

                const db = conexion.db("harry");
                const collection = db.collection("personajes");

                // Realizar la consulta para obtener los personajes que estén vivos y sean estudiantes
                let personajesFiltrados = await collection.find({ alive: true, hogwartsStudent: true }).toArray();

                // Generar la tabla HTML con los resultados de la consulta
                let tablaFiltrada = personajesFiltrados.map(personaje => {
                    return `<tr>
                <td><img src="${personaje.image}" alt="${personaje.name}" style="max-width: 100px;"></td>
                <td>${personaje.name}</td>
                <td>${personaje.species}</td>
                <td>${personaje.gender}</td>
                <td>${personaje.house || '-'}</td>
                <td>${personaje.yearOfBirth || '-'}</td>
                <td><button onclick="confirmarBorrado('${personaje._id}')">Borrar</button></td>
            </tr>`;
                }).join('');

                // Leer el archivo HTML que contiene la página web
                let html = fs.readFileSync("hogwarts.html", "utf8");

                // Reemplazar los datos de los personajes en el HTML
                let htmlModificado = html.replace("<!-- Los datos de los personajes se mostrarán aquí -->", tablaFiltrada); // El cuerpo de la tabla con la consulta ira en el comentario que esta en el html

                // Enviar la respuesta con el HTML modificado
                respuesta.writeHead(200, { 'Content-Type': 'text/html' });
                respuesta.end(htmlModificado);

            } catch (error) {
                console.error("Error al aplicar el filtro:", error);
                respuesta.writeHead(500, { 'Content-Type': 'text/plain' });
                respuesta.end('Error al aplicar el filtro');
            }
            break;

        // Guardar nuevo personaje en la base de datos
        case "/guardarPersonaje":
            try {
                const conexion = new MongoClient(urlConexion);
                await conexion.connect();
                console.log("Conexión establecida");

                const db = conexion.db("harry");
                const collection = db.collection("personajes");

                // Obtener los datos del cuerpo de la solicitud en formato JSON
                let body = '';
                peticion.on('data', chunk => {
                    body += chunk.toString(); // Convertir el buffer a una cadena
                });

                // Obtenemos los datos del formulario
                peticion.on('end', async () => {
                    console.log('Datos recibidos del formulario:', body);
                    // Analizar los datos del formulario JSON
                    let formData = JSON.parse(body);

                    // Datos del nuevo personaje recogidos del formulario
                    let nuevoPersonaje = {
                        image: formData.image,
                        name: formData.name,
                        species: formData.species,
                        gender: formData.gender,
                        house: formData.house,
                        yearOfBirth: parseInt(formData.yearOfBirth)
                    };

                    // Insertar el nuevo personaje en la base de datos
                    let resultado = await collection.insertOne(nuevoPersonaje);
                    console.log("Nuevo personaje insertado:", resultado);

                    // Enviar una respuesta al cliente indicando que se guardó el nuevo personaje
                    respuesta.writeHead(200, { 'Content-Type': 'text/plain' });
                    respuesta.end('Nuevo personaje guardado correctamente');
                });

            } catch (error) {
                console.error("Error al guardar el nuevo personaje:", error);
                respuesta.writeHead(500, { 'Content-Type': 'text/plain' });
                respuesta.end('Error al guardar el nuevo personaje');
            }
            break;

        // Eliminar personaje de la base de datos
        case "/eliminarPersonaje":
            try {
                const conexion = new MongoClient(urlConexion);
                await conexion.connect();
                console.log("Conexión establecida");

                const db = conexion.db("harry");
                const collection = db.collection("personajes");

                // Obtener el ID del personaje a eliminar desde la consulta URL
                let params = parsedUrl.query;
                let _id = params.id;

                console.log("ID del personaje:", _id); // Para comprobar el ID

                try {
                    // Convertir el ID a ObjectId
                    let objectId = new ObjectId(_id);

                    // Verificar si el ID del personaje existe en la base de datos
                    let resultado = await collection.findOne({ _id: objectId });
                    if (resultado) {
                        // Si el personaje existe, procedemos a eliminarlo de la base de datos
                        // Le pasamos el id del registro de la tabla
                        await collection.deleteOne({ _id: objectId });
                        console.log("Personaje eliminado correctamente");

                        // Enviar una respuesta al cliente indicando que el personaje fue eliminado
                        respuesta.writeHead(200, { 'Content-Type': 'text/plain' });
                        respuesta.end('Personaje eliminado correctamente');
                    } else {
                        // Si el personaje no existe, enviamos un mensaje indicándolo
                        console.log("No se encontró el personaje para eliminar");
                        respuesta.writeHead(404, { 'Content-Type': 'text/plain' });
                        respuesta.end('No se encontró el personaje para eliminar');
                    }
                } catch (error) {
                    console.error("Error al eliminar el personaje:", error);
                    respuesta.writeHead(500, { 'Content-Type': 'text/plain' });
                    respuesta.end('Error al eliminar el personaje');
                }
            } catch (error) {
                console.error("Error al conectar con la base de datos:", error);
                respuesta.writeHead(500, { 'Content-Type': 'text/plain' });
                respuesta.end('Error al conectar con la base de datos');
            }
            break;



        default:
            respuesta.writeHead(404, { 'Content-Type': 'text/plain' });
            respuesta.end('Ruta no reconocida. Por favor, usa /importar, /personajes, filtro1, filtro2, filtro3, filtro4');
    }
});

const PORT = 8080;
const HOST = "127.0.0.1";
server.listen(PORT, HOST, () => {
    console.log(`Servidor ejecutándose en http://${HOST}:${PORT}/`);
});




