// Types and Interfaces
export interface QuarksChatConfig {
    url: string;
    userId: string;
    defaultRoom?: string;
    autoReconnect?: boolean;
    reconnectAttempts?: number;
    reconnectInterval?: number;
    pingInterval?: number;
    debug?: boolean;
}

export interface QuarksMessage {
    room?: string;
    from?: string;
    to?: string;
    message?: string;
    send?: string;
    key?: string;
    timestamp?: number;
    joined?: string;
    left?: string;
    replyuserlist?: string[];
    replygetkeys?: MessageHistoryItem[];
    received?: boolean;
}

export interface MessageHistoryItem {
    key: string;
    value: QuarksMessage;
}

export type MessageHandler = (message: QuarksMessage) => void;
export type ConnectionHandler = (state: ConnectionState) => void;
export type ErrorHandler = (error: Event) => void;

export enum ConnectionState {
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    DISCONNECTED = 'DISCONNECTED',
    RECONNECTING = 'RECONNECTING',
    ERROR = 'ERROR'
}

// Main Quarks Client Class
export class QuarksChat {
    private socket: WebSocket | null = null;
    private config: Required<QuarksChatConfig>;
    private reconnectAttempt = 0;
    private pingIntervalId: number | null = null;
    private state: ConnectionState = ConnectionState.DISCONNECTED;
    private messageHandlers: Set<MessageHandler> = new Set();
    private connectionHandlers: Set<ConnectionHandler> = new Set();
    private errorHandlers: Set<ErrorHandler> = new Set();
    private currentRoom: string;

    private readonly defaultConfig: Required<QuarksChatConfig> = {
        url: '',
        userId: '',
        defaultRoom: 'skyharvest',
        autoReconnect: true,
        reconnectAttempts: 5,
        reconnectInterval: 5000,
        pingInterval: 30000,
        debug: true
    };

    constructor(config: QuarksChatConfig) {
        this.config = { ...this.defaultConfig, ...config };
        this.currentRoom = this.config.defaultRoom;
        this.log('QuarksChat initialized with config:', this.config);
    }

    // Connection Management
    public connect(): void {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.log('Already connected');
            return;
        }

        this.updateState(ConnectionState.CONNECTING);
        try {
            const wsUrl = `${this.config.url}?_id=${this.config.userId}`;
            this.socket = new WebSocket(wsUrl);

            this.socket.onopen = () => this.handleOpen();
            this.socket.onclose = () => this.handleClose();
            this.socket.onerror = (error) => this.handleError(error);
            this.socket.onmessage = (event) => this.handleMessage(event);
        } catch (error) {
            console.error('Error connecting:', error);
            this.handleError(error as ErrorEvent);
        }
    }

    public disconnect(): void {
        this.updateState(ConnectionState.DISCONNECTED);
        this.clearPingInterval();
        this.socket?.close();
    }

    // Room Management
    public joinRoom(room: string, notifyJoin: boolean = true, notifyLeave: boolean = true): void {
        const message = {
            join: room,
            notifyjoin: notifyJoin,
            notifyleave: notifyLeave
        };
        this.currentRoom = room;
        this.sendRaw(message);
    }

    public leaveRoom(room: string): void {
        const message = {
            leave: room
        };
        this.sendRaw(message);
    }

    public listUsers(room: string = this.currentRoom): void {
        const message = {
            userlist: room,
            skip: 0,
            limit: -1
        };
        this.sendRaw(message);
    }

    // Messaging
    public sendMessage(content: string, options: {
        room?: string;
        to?: string;
        key?: string;
    } = {}): void {
        const message: QuarksMessage = {
            room: options.room || this.currentRoom,
            send: content
        };

        if (options.to) {
            message.to = options.to;
        }

        if (options.key) {
            message.key = options.key;
        } else {
            message.key = `${message.room}_${Date.now()}_${this.config.userId}`;
        }

        this.sendRaw(message);
    }

    public getMessageHistory(room: string = this.currentRoom, limit: number = 500, skip: number = 0): void {
        const message = {
            getkeys: `${room}_*`,
            skip,
            limit
        };
        this.sendRaw(message);
    }

    // Event Handlers
    public onMessage(handler: MessageHandler): () => void {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    public onConnection(handler: ConnectionHandler): () => void {
        this.connectionHandlers.add(handler);
        return () => this.connectionHandlers.delete(handler);
    }

    public onError(handler: ErrorHandler): () => void {
        this.errorHandlers.add(handler);
        return () => this.errorHandlers.delete(handler);
    }

    // State Management
    public getState(): ConnectionState {
        return this.state;
    }

    public getCurrentRoom(): string {
        return this.currentRoom;
    }

    // Private Methods
    private handleOpen(): void {
        this.updateState(ConnectionState.CONNECTED);
        this.reconnectAttempt = 0;
        this.setupPingInterval();
        this.joinRoom(this.currentRoom);
        this.log('Connected successfully');
    }

    private handleClose(): void {
        const wasConnected = this.state === ConnectionState.CONNECTED;
        this.updateState(ConnectionState.DISCONNECTED);
        this.clearPingInterval();

        if (wasConnected && this.config.autoReconnect && this.reconnectAttempt < this.config.reconnectAttempts) {
            this.updateState(ConnectionState.RECONNECTING);
            this.reconnectAttempt++;
            setTimeout(() => this.connect(), this.config.reconnectInterval);
            this.log(`Reconnecting... Attempt ${this.reconnectAttempt}`);
        }
    }

    private handleError(error: Event): void {
        this.updateState(ConnectionState.ERROR);
        this.errorHandlers.forEach(handler => handler(error));
        this.log('Connection error:', error);
    }

    private handleMessage(event: MessageEvent): void {
        try {
            const message: QuarksMessage = JSON.parse(event.data);
            this.messageHandlers.forEach(handler => handler(message));
            this.log('Received message:', message);
        } catch (error) {
            this.log('Error parsing message:', error);
        }
    }

    private sendRaw(data: any): void {
        if (this.socket?.readyState !== WebSocket.OPEN) {
            this.log('Cannot send message - connection not open');
            return;
        }

        try {
            const message = JSON.stringify(data);
            this.socket.send(message);
            this.log('Sent message:', data);
        } catch (error) {
            this.log('Error sending message:', error);
        }
    }

    private setupPingInterval(): void {
        this.clearPingInterval();
        this.pingIntervalId = window.setInterval(() => {
            this.sendRaw({ ping: "1" });
        }, this.config.pingInterval);
    }

    private clearPingInterval(): void {
        if (this.pingIntervalId) {
            clearInterval(this.pingIntervalId);
            this.pingIntervalId = null;
        }
    }

    private updateState(newState: ConnectionState): void {
        this.state = newState;
        this.connectionHandlers.forEach(handler => handler(newState));
        this.log('State updated:', newState);
    }

    private log(...args: any[]): void {
        if (this.config.debug) {
            console.log('[QuarksChat]', ...args);
        }
    }
}

// Utility Classes
export class QuarksRoomManager {
    private client: QuarksChat;
    private rooms: Set<string> = new Set();

    constructor(client: QuarksChat) {
        this.client = client;
    }

    public joinRoom(room: string): void {
        this.rooms.add(room);
        this.client.joinRoom(room);
    }

    public leaveRoom(room: string): void {
        this.rooms.delete(room);
        this.client.leaveRoom(room);
    }

    public listRooms(): string[] {
        return Array.from(this.rooms);
    }

    public isInRoom(room: string): boolean {
        return this.rooms.has(room);
    }
}