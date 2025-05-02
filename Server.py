import socket

# Define host and port
HOST = "0.0.0.0"  # Listen on all available interfaces
PORT = 12345       # Choose an unused port

# Create a socket
server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server_socket.bind((HOST, PORT))
server_socket.listen(5)  # Max 5 clients in queue

print(f"Server listening on {HOST}:{PORT}...")

conn, addr = server_socket.accept()
print(f"Connected by {addr}")

while True:
    data = conn.recv(1024)  # Receive data (max 1024 bytes)
    if not data:
        break
    print(f"Client says: {data.decode()}")
    conn.sendall(b"Message received")  # Send response

conn.close()
server_socket.close()
