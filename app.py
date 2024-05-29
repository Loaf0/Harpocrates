import os
import signal
import tkinter as tk
from tkinterweb import HtmlFrame
import threading
from flask import Flask, render_template, request

def run_tkinter():
    def on_closing():
        shutdown_server()
        root.destroy()

    def start_move(event):
        root.x = event.x
        root.y = event.y

    def stop_move(event):
        root.x = None
        root.y = None
    
    def minimize_window():
        root.withdraw()
        root.after(200, lambda: root.overrideredirect(0))
        root.iconify()

    def on_move(event):
        x = (event.x_root - root.x)
        y = (event.y_root - root.y)
        root.geometry(f"+{x}+{y}")

    root = tk.Tk()
    root.overrideredirect(1)
    root.geometry("800x600")
    root.resizable(False, False)

    title_bar = tk.Frame(root, bg="#1b0808", relief="raised", bd=0, height=30)
    title_bar.pack(fill=tk.X)

    title_label = tk.Label(title_bar, text="Nyx", bg="#1b0808", fg="White", font=("Arial", 12))
    title_label.pack(side=tk.LEFT, padx=10)

    close_button = tk.Button(title_bar, text="X", command=on_closing, bg="#1b0808", fg="White", relief="flat")
    close_button.pack(side=tk.RIGHT, padx=5)

    minimize_button = tk.Button(title_bar, text="─", command=root.iconify, bg="#1b0808", fg="White", relief="flat")
    minimize_button.pack(side=tk.RIGHT, padx=5)

    title_bar.bind("<Button-1>", start_move)
    title_bar.bind("<ButtonRelease-1>", stop_move)
    title_bar.bind("<B1-Motion>", on_move)

    container = tk.Frame(root, bg="#1b0808", bd=0)
    container.pack(fill="both", expand=True, padx=0, pady=0)

    frame = HtmlFrame(container)
    frame.load_website("http://127.0.0.1:8080")
    frame.pack(fill="both", expand=False)

    root.mainloop()

app = Flask(__name__)

@app.route('/shutdown', methods=['POST'])
def shutdown():
    if request.method == 'POST':
        shutdown_server()
    return 'Server shutting down...'

def shutdown_server():
    pid = os.getpid()
    os.kill(pid, signal.SIGINT)

@app.route('/', methods=['GET', 'POST'])
def home():
    return render_template('home.html')

def run_flask():
    app.run(port=8080)

if __name__ == '__main__':
    tkinter_thread = threading.Thread(target=run_tkinter)
    flask_thread = threading.Thread(target=run_flask)

    tkinter_thread.start()
    flask_thread.start()

    tkinter_thread.join()
    flask_thread.join()
