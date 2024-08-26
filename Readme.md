# Proyecto de Chat XMPP

Este proyecto es una implementación de un chat XMPP utilizando una API basada en WebSockets para la comunicación entre el cliente y el servidor.

## Requisitos

Para ejecutar el backend de la API, asegúrate de tener instalado `uvicorn`. Utiliza el siguiente comando para iniciar el servidor:

```bash
uvicorn webtest:app --reload
```

El archivo `requirements.txt` en el directorio raíz contiene las dependencias necesarias para el backend. Puedes instalar las dependencias ejecutando:

```bash
pip install -r requirements.txt
```

## Estructura del Proyecto

El proyecto está organizado en las siguientes carpetas:

- **frontend/**: Contiene el código fuente del frontend del chat, desarrollado en Next.js con TypeScript. Para trabajar en el frontend, usa Yarn como gestor de paquetes.

## Configuración del Frontend

Para instalar las dependencias del frontend, navega al directorio `frontend` y ejecuta:

```bash
yarn install
```

Para iniciar el servidor de desarrollo del frontend, usa:

```bash
yarn dev
```

## Implementación del Cliente XMPP

El cliente del lado del backend está implementado en Python y utiliza sockets para la comunicación. La clase `ManagerXMPP` maneja la conexión, autenticación, y operaciones de chat. 

### Funcionalidades Principales

- **Registro de Usuario**: Permite registrar un nuevo usuario en el servidor XMPP.
- **Autenticación**: Maneja el proceso de autenticación utilizando TLS para asegurar la conexión.
- **Envío y Recepción de Mensajes**: Permite enviar y recibir mensajes de chat en tiempo real.
- **Gestión de Contactos**: Agrega, acepta y elimina contactos del roster.
- **Obtención de Mensajes Históricos**: Recupera los mensajes archivados utilizando MAM (Message Archive Management).

### Ejecución del Cliente XMPP

Para ejecutar el cliente XMPP, asegúrate de tener las dependencias necesarias instaladas. Luego, ejecuta tu script Python que usa la clase `ManagerXMPP` para interactuar con el servidor.

## Contribución

Si deseas contribuir a este proyecto, por favor sigue estos pasos:

1. Realiza un fork del repositorio.
2. Crea una rama para tu característica o corrección de errores (`git checkout -b feature/nueva-caracteristica`).
3. Realiza tus cambios y confirma (`git commit -am 'Añadir nueva característica'`).
4. Envía tus cambios (`git push origin feature/nueva-caracteristica`).
5. Crea un Pull Request para revisión.

## Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para obtener más detalles.

