// Получаем элементы
const canvas = document.getElementById('pendulumCanvas');
const ctx = canvas.getContext('2d');

// Параметры системы
let L = 1.2;          // длина нити (м)
let theta = Math.PI / 4;  // начальный угол (45°)
let omega = 0;        // угловая скорость (рад/с)
const g = 9.8;        // ускорение свободного падения (м/с²)
const dt = 0.02;      // шаг времени (с)
let animationId = null;

// Элементы управления
const lengthSlider = document.getElementById('lengthSlider');
const lengthValue = document.getElementById('lengthValue');
const angleSlider = document.getElementById('angleSlider');
const angleValue = document.getElementById('angleValue');
const resetBtn = document.getElementById('resetBtn');

// Координаты точки подвеса (центр верхней части canvas)
let pivotX = canvas.width / 2;
let pivotY = 80;

// Функция обновления физики (метод Эйлера)
function updatePhysics() {
    // Угловое ускорение: alpha = -(g/L) * sin(theta)
    const alpha = -(g / L) * Math.sin(theta);
    omega += alpha * dt;
    theta += omega * dt;
}

// Функция отрисовки
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем опору (потолок)
    ctx.beginPath();
    ctx.moveTo(pivotX - 50, pivotY);
    ctx.lineTo(pivotX + 50, pivotY);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#333';
    ctx.stroke();
    ctx.fillStyle = '#555';
    ctx.fillRect(pivotX - 8, pivotY - 8, 16, 16);
    
    // Координаты груза
    const ballX = pivotX + L * 100 * Math.sin(theta);   // масштабируем: 1 м = 100 пикселей
    const ballY = pivotY + L * 100 * Math.cos(theta);
    
    // Рисуем нить
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(ballX, ballY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#444';
    ctx.stroke();
    
    // Рисуем груз
    ctx.beginPath();
    ctx.arc(ballX, ballY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#e67e22';
    ctx.fill();
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#d35400';
    ctx.beginPath();
    ctx.arc(ballX, ballY, 12, 0, 2 * Math.PI);
    ctx.fill();
    
    // Отображаем текущие параметры
    ctx.font = '14px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText(`Угол: ${(theta * 180 / Math.PI).toFixed(1)}°`, 10, 30);
    ctx.fillText(`Длина: ${L.toFixed(2)} м`, 10, 50);
}

// Анимационный цикл
function animate() {
    updatePhysics();
    draw();
    animationId = requestAnimationFrame(animate);
}

// Обработчики для слайдеров
function updateLength() {
    L = parseFloat(lengthSlider.value);
    lengthValue.textContent = L.toFixed(2);
}

function updateAngle() {
    const newAngleDeg = parseFloat(angleSlider.value);
    theta = newAngleDeg * Math.PI / 180;
    angleValue.textContent = newAngleDeg;
    omega = 0;  // сбрасываем скорость при ручном изменении угла
}

function resetSimulation() {
    // Сбрасываем угол на 45°, длину на 1.2, скорость 0
    angleSlider.value = '45';
    updateAngle();
    lengthSlider.value = '1.2';
    updateLength();
    omega = 0;
}

// Назначаем слушатели
lengthSlider.addEventListener('input', updateLength);
angleSlider.addEventListener('input', updateAngle);
resetBtn.addEventListener('click', resetSimulation);

// Запускаем анимацию
animate();