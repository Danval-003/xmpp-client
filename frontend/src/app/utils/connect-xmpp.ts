

class ConnectXMPP {
  private ws: WebSocket;
  private username: string;
  private password: string;
  private type: string;
  private fullname: string;

  constructor(username: string, password: string, type: string, fullname: string = "") {
    this.username = username;
    this.password = password;
    this.fullname = fullname;
    this.type = type;
    this.ws = new WebSocket('ws://localhost:8080/ws');
  }

  connect() {
    return new Promise<void>((resolve, reject) => {
      
      this.ws.onopen = () => {
        console.log('WebSocket connection established');
        const userInfo = {
          username: this.username,
          fullname: "Web Service",
          password: this.password,
          type: this.type,
        };
        this.ws.send(JSON.stringify(userInfo));
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        console.log('Message from server:', event.data);
      };
    });
  }

  sendMessage(message:string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      console.error('WebSocket is not open.');
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
      console.log('WebSocket connection closed');
    }
  }
}

export default ConnectXMPP;
