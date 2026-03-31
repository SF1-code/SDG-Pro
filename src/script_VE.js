// Получаем элементы
const canvas = document.getElementById('pendulumCanvas');
const ctx = canvas.getContext('2d');

// Параметры системы
let L1 = 1.2;      // длина первого звена (м)
let L2 = 1.2;      // длина второго звена (м)
let m1 = 1.0;      // масса первого груза (кг)
let m2 = 1.0;      // масса второго груза (кг)
let g = 9.8;       // ускорение свободного падения

// Углы (от вертикали вниз: 0 = вниз, PI = вверх)
let theta1 = 170 * Math.PI / 180;   // начальное положение – почти вверх
let theta2 = 10 * Math.PI / 180;    // второе звено чуть от вертикали
let omega1 = 0;
let omega2 = 0;

// Параметры платформы (горизонтальное смещение в пикселях)
let platformX = 0;      // смещение от центра canvas по X (пиксели)
let platformY = 80;     // фиксированная высота подвеса

// Шаг времени (сек)
const dt = 0.02;
let animationId = null;
let isRunning = true;

// Элементы управления
const platformSlider = document.getElementById('platformX');
const platformVal = document.getElementById('platformXVal');
const len1Slider = document.getElementById('len1');
const len1Val = document.getElementById('len1Val');
const len2Slider = document.getElementById('len2');
const len2Val = document.getElementById('len2Val');
const theta1Slider = document.getElementById('theta1');
const theta1Val = document.getElementById('theta1Val');
const theta2Slider = document.getElementById('theta2');
const theta2Val = document.getElementById('theta2Val');
const resetUpBtn = document.getElementById('resetUpBtn');
const resetDownBtn = document.getElementById('resetDownBtn');
const stopBtn = document.getElementById('stopBtn');

// Преобразование: canvas координаты
let centerX = canvas.width / 2;

// Функция вычисления ускорений (уравнения движения двойного маятника)
// Вход: углы, угловые скорости, параметры. Выход: alpha1, alpha2
function computeAccelerations(theta1, theta2, omega1, omega2, L1, L2, m1, m2, g, platformAccX) {
    // Уравнения из Лагранжиана для двойного маятника с подвижной точкой подвеса (горизонтальное ускорение)
    // a = ускорение платформы по X (м/с²). В нашей модели платформа может двигаться, но мы используем её положение,
    // а не ускорение, поэтому для простоты считаем, что платформа движется с заданной скоростью, и ускорение получается из изменения положения.
    // Для упрощения кода, мы будем обновлять положение платформы вручную, а в уравнениях будем считать, что точка подвеса имеет ускорение,
    // вычисляемое как разность скоростей. Но чтобы не усложнять, можно добавить слагаемое с ускорением платформы.
    // Однако для ручного управления мы можем пренебречь инерционными эффектами от движения платформы (считаем платформу бесконечно лёгкой),
    // и просто использовать уравнения с неподвижной точкой подвеса, но сдвигать координаты отрисовки.
    // Но для физической достоверности при резких движениях платформы лучше добавить ускорение.
    // Реализуем полные уравнения с учётом ускорения точки подвеса a_x (горизонтальное).
    
    // Пусть a_x = ускорение платформы. Мы его вычислим по изменению platformX между кадрами.
    // Для простоты используем переменную `platformAccX`, которая будет обновляться перед вызовом.
    // Здесь для краткости, чтобы не усложнять, покажем упрощённый вариант без учёта ускорения платформы,
    // но добавим возможность позже. Однако для стабилизации в верхнем положении нужно именно ускорение.
    // Поэтому включим полные уравнения.

    // Полные уравнения (с учётом горизонтального ускорения точки подвеса a)
    // Источник: https://www.myphysicslab.com/pendulum/double-pendulum-en.html с добавлением a
    // Обозначим:
    let c1 = Math.cos(theta1);
    let s1 = Math.sin(theta1);
    let c2 = Math.cos(theta2);
    let s2 = Math.sin(theta2);
    let c12 = Math.cos(theta1 - theta2);
    let s12 = Math.sin(theta1 - theta2);

    let denom = m1 + m2 * (s12 * s12);
    
    let alpha1_num = (m2 * g * s2 * c12 - m2 * s12 * (L1 * omega1 * omega1 * c12 + L2 * omega2 * omega2) - (m1 + m2) * g * s1) / (L1 * denom);
    let alpha1 = alpha1_num + (platformAccX * c1) / L1;  // добавка от ускорения платформы

    let alpha2_num = ((m1 + m2) * (g * s1 * c12 - L1 * omega1 * omega1 * s12 - g * s2) - m2 * L2 * omega2 * omega2 * s12 * c12) / (L2 * denom);
    let alpha2 = alpha2_num + (platformAccX * c2) / L2;

    return { alpha1, alpha2 };
}

// Переменные для вычисления ускорения платформы
let prevPlatformX = platformX;  // в пикселях
let platformVelocity = 0;

// Функция обновления физики
function updatePhysics() {
    if (!isRunning) return;

    // Преобразуем platformX (пиксели) в метры (масштаб: 1 м = 100 пикселей)
    let platformXMeters = platformX / 100;
    // Вычисляем ускорение платформы (по изменению скорости)
    let newPlatformVelocity = (platformXMeters - prevPlatformX / 100) / dt;
    let platformAcc = (newPlatformVelocity - platformVelocity) / dt;
    platformVelocity = newPlatformVelocity;
    prevPlatformX = platformX;

    // Вычисляем угловые ускорения
    let { alpha1, alpha2 } = computeAccelerations(theta1, theta2, omega1, omega2, L1, L2, m1, m2, g, platformAcc);
    
    // Интегрируем методом Эйлера
    omega1 += alpha1 * dt;
    omega2 += alpha2 * dt;
    theta1 += omega1 * dt;
    theta2 += omega2 * dt;
}

// Отрисовка маятника с учётом смещения платформы
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Координаты точки подвеса с учётом смещения платформы
    let pivotX = centerX + platformX;
    let pivotY = platformY;
    
    // Отрисовка опоры (платформы)
    ctx.beginPath();
    ctx.moveTo(pivotX - 50, pivotY);
    ctx.lineTo(pivotX + 50, pivotY);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#333';
    ctx.stroke();
    ctx.fillStyle = '#e34234';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 12, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.fillText("Платформа", pivotX - 30, pivotY - 5);
    
    // Координаты первого груза
    let x1 = pivotX + L1 * 100 * Math.sin(theta1);
    let y1 = pivotY + L1 * 100 * Math.cos(theta1);
    // Координаты второго груза
    let x2 = x1 + L2 * 100 * Math.sin(theta2);
    let y2 = y1 + L2 * 100 * Math.cos(theta2);
    
    // Рисуем нити
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(x1, y1);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#444';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Рисуем грузы
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    // Первый груз
    ctx.beginPath();
    ctx.arc(x1, y1, 14, 0, 2 * Math.PI);
    ctx.fillStyle = '#e67e22';
    ctx.fill();
    ctx.fillStyle = '#d35400';
    ctx.beginPath();
    ctx.arc(x1, y1, 10, 0, 2 * Math.PI);
    ctx.fill();
    // Второй груз
    ctx.beginPath();
    ctx.arc(x2, y2, 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#3498db';
    ctx.fill();
    ctx.fillStyle = '#2980b9';
    ctx.beginPath();
    ctx.arc(x2, y2, 9, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Отображение параметров
    ctx.font = '14px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText(`θ1: ${(theta1 * 180 / Math.PI).toFixed(0)}°`, 10, 30);
    ctx.fillText(`θ2: ${(theta2 * 180 / Math.PI).toFixed(0)}°`, 10, 50);
    ctx.fillText(`Платформа X: ${platformX.toFixed(0)} px`, 10, 70);
}

// Анимационный цикл
function animate() {
    updatePhysics();
    draw();
    animationId = requestAnimationFrame(animate);
}

// Обработчики интерфейса
function updateLen1() {
    L1 = parseFloat(len1Slider.value);
    len1Val.textContent = L1.toFixed(2);
}
function updateLen2() {
    L2 = parseFloat(len2Slider.value);
    len2Val.textContent = L2.toFixed(2);
}
function updateTheta1() {
    let deg = parseFloat(theta1Slider.value);
    theta1 = deg * Math.PI / 180;
    theta1Val.textContent = deg;
    omega1 = 0;
}
function updateTheta2() {
    let deg = parseFloat(theta2Slider.value);
    theta2 = deg * Math.PI / 180;
    theta2Val.textContent = deg;
    omega2 = 0;
}
function updatePlatformX() {
    platformX = parseFloat(platformSlider.value);
    platformVal.textContent = platformX;
}
function resetToUp() {
    theta1 = Math.PI;   // 180°
    theta2 = 0;         // вверх? Нет, для верхнего неустойчивого положения оба звена должны быть направлены вверх.
    // Обычно оба угла = π (вертикально вверх), но тогда второе звено будет продолжением первого.
    // Зададим: theta1 = π (первое вверх), theta2 = π (второе вверх) – они будут коллинеарны.
    // Но если θ1=π, θ2=π, то второе звено тоже направлено вверх, но при этом его угол отсчитывается от вертикали вниз,
    // поэтому π означает вверх. Тогда маятник стоит вертикально вверх.
    theta1 = Math.PI;
    theta2 = Math.PI;
    omega1 = 0;
    omega2 = 0;
    // Обновляем слайдеры
    theta1Slider.value = 180;
    theta1Val.textContent = 180;
    theta2Slider.value = 180;
    theta2Val.textContent = 180;
}
function resetToDown() {
    theta1 = 0;
    theta2 = 0;
    omega1 = 0;
    omega2 = 0;
    theta1Slider.value = 0;
    theta1Val.textContent = 0;
    theta2Slider.value = 0;
    theta2Val.textContent = 0;
}
function toggleRunning() {
    isRunning = !isRunning;
    stopBtn.textContent = isRunning ? "Стоп" : "Пуск";
}

// Управление платформой мышью
let dragging = false;
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * canvas.width / rect.width;
    const mouseY = (e.clientY - rect.top) * canvas.height / rect.height;
    // Проверяем, попали ли на красную точку платформы
    const pivotX = centerX + platformX;
    const pivotY = platformY;
    const dx = mouseX - pivotX;
    const dy = mouseY - pivotY;
    if (Math.hypot(dx, dy) < 15) {
        dragging = true;
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
    }
});
canvas.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    let mouseX = (e.clientX - rect.left) * canvas.width / rect.width;
    // Ограничиваем движение платформы в пределах canvas
    let newX = mouseX - centerX;
    newX = Math.min(Math.max(newX, -300), 300);
    platformX = newX;
    platformSlider.value = platformX;
    platformVal.textContent = platformX;
    // При резком движении мыши платформа получает скорость, что влияет на физику
    // У нас уже есть вычисление скорости через prevPlatformX, поэтому всё нормально.
});
window.addEventListener('mouseup', () => {
    dragging = false;
    canvas.style.cursor = 'grab';
});

// Назначение слушателей
len1Slider.addEventListener('input', updateLen1);
len2Slider.addEventListener('input', updateLen2);
theta1Slider.addEventListener('input', updateTheta1);
theta2Slider.addEventListener('input', updateTheta2);
platformSlider.addEventListener('input', updatePlatformX);
resetUpBtn.addEventListener('click', resetToUp);
resetDownBtn.addEventListener('click', resetToDown);
stopBtn.addEventListener('click', toggleRunning);

// Инициализация начальных значений слайдеров
len1Slider.value = L1;
len2Slider.value = L2;
theta1Slider.value = 180;
theta2Slider.value = 180;
platformSlider.value = platformX;
updateLen1();
updateLen2();
updateTheta1();
updateTheta2();
updatePlatformX();

// Запуск анимации
animate();