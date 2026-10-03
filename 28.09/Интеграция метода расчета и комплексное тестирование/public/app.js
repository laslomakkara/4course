const form = document.querySelector('#calculator-form');
const result = document.querySelector('#result');

function showError(message) {
  result.className = 'result result--error';
  result.textContent = `Ошибка: ${message}`;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form));

  try {
    const param1 = Number(values.param1.replace(',', '.'));
    const param2 = Number(values.param2.replace(',', '.'));
    // Функция загружается отдельным скриптом до запуска интерфейса.
    const materialQuantity = window.calculateMaterialQuantity(
      Number(values.productTypeId),
      Number(values.materialTypeId),
      Number(values.quantity),
      param1,
      param2,
    );

    if (materialQuantity === -1) {
      showError('Проверьте ID типов, количество и положительные параметры продукции.');
      return;
    }

    result.className = 'result result--success';
    result.textContent = `Необходимое количество материала: ${materialQuantity} ед.`;
  } catch (error) {
    showError(error.message || 'Не удалось выполнить расчет.');
  }
});
