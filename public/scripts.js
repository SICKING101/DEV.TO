const minibar = document.getElementById('minibar');

// ===== MINIBAR FUNCTIONALITY =====
function initMinibar() {

}

// ===== LOGIN FORM HANDLER =====
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');

    if (!username || !password) {
        messageDiv.textContent = 'Por favor, complete todos los campos';
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
        return;
    }

    try {
        const response = await fetch('/authenticate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            messageDiv.textContent = data.message;
            messageDiv.className = 'message success';
            messageDiv.style.display = 'block';
            
            // Inicializar minibar antes de redirigir (si es necesario)
            initMinibar();
            
            // Redirigir al index después de un login exitoso
            setTimeout(() => {
                window.location.href = '/index';
            }, 1000);
        } else {
            messageDiv.textContent = data.message || 'Error al iniciar sesión';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        messageDiv.textContent = 'Error de conexión';
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
    }
});

// ===== URL MESSAGE HANDLER =====
const urlParams = new URLSearchParams(window.location.search);
const message = urlParams.get('message');
const messageType = urlParams.get('type');

if (message) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${messageType || 'error'}`;
    messageDiv.style.display = 'block';
}

// ===== INITIALIZE MINIBAR ON PAGE LOAD =====
initMinibar();