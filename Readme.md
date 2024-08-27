# XMPP Chat Project

This project is an implementation of an XMPP chat using a WebSocket-based API for communication between the client and the server.

## Requirements

To run the API backend, make sure you have `uvicorn` installed. Use the following command to start the server:

```bash
uvicorn webtest:app --reload
```

The `requirements.txt` file in the root directory contains the necessary dependencies for the backend. You can install the dependencies by running:

```bash
pip install -r requirements.txt
```

## Project Structure

The project is organized into the following folders:

- **frontend/**: Contains the source code of the chat frontend, developed in Next.js with TypeScript. Use Yarn as the package manager when working on the frontend.

## Frontend Setup

To install the frontend dependencies, navigate to the `frontend` directory and run:

```bash
yarn install
```

To start the frontend development server, use:

```bash
yarn dev
```

## XMPP Client Implementation

The backend-side client is implemented in Python and uses sockets for communication. The `ManagerXMPP` class handles the connection, authentication, and chat operations.

### Main Features

- **User Registration**: Allows registering a new user on the XMPP server.
- **Authentication**: Manages the authentication process using TLS to secure the connection.
- **Sending and Receiving Messages**: Enables real-time chat message sending and receiving.
- **Contact Management**: Adds, accepts, and removes contacts from the roster.
- **Retrieving Historical Messages**: Retrieves archived messages using MAM (Message Archive Management).

### Running the XMPP Client

To run the XMPP client, make sure you have the necessary dependencies installed. Then, run your Python script that uses the `ManagerXMPP` class to interact with the server.

## Contribution

If you want to contribute to this project, please follow these steps:

1. Fork the repository.
2. Create a branch for your feature or bug fix (`git checkout -b feature/new-feature`).
3. Make your changes and commit them (`git commit -am 'Add new feature'`).
4. Push your changes (`git push origin feature/new-feature`).
5. Create a Pull Request for review.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
