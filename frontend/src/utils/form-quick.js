/** Сегодня в формате YYYY-MM-DD для input[type=date] */
export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

/** Следующий номер путевого листа: ПЛ-20260605-01 */
export function nextWaybillNumber(existingRows = []) {
  const date = todayIsoDate().replace(/-/g, '');
  const prefix = `ПЛ-${date}-`;
  const sameDay = existingRows.filter((row) =>
    String(row.documentNumber ?? '').startsWith(prefix),
  );
  const next = String(sameDay.length + 1).padStart(2, '0');
  return `${prefix}${next}`;
}

export function buildWaybillDemoForm({ fields = [], crops = [], rows = [] } = {}) {
  const field = fields[0];
  const crop = crops.find((c) => c.name?.includes('Подсолнечник')) ?? crops[0];

  return {
    documentNumber: nextWaybillNumber(rows),
    shiftNumber: '1',
    fieldId: field ? String(field.id) : '',
    cropId: crop ? String(crop.id) : '',
    actionType: 'Уборка',
    seedType: 'Подсолнечник',
    driverName: 'Иванов Пётр Сергеевич',
    driverEmail: 'voditel1@example.com, kostrukova.lera@mail.ru',
    mechanizatorName: 'Сидоров Николай Викторович',
    vehicleNumber: 'К456МН56',
    trailerNumber: '',
    tractorModel: 'Беларус 1221.2',
    equipmentName: 'Зерновой прицеп',
    tripDate: todayIsoDate(),
    departureTime: '08:00',
    returnTime: '17:30',
    workVolumeHa: '42',
    routeDistanceKm: '28',
    startOdometerKm: '',
    endOdometerKm: '',
    startEngineHours: '',
    endEngineHours: '',
    grossWeightKg: '32500',
    tareWeightKg: '8500',
    fuelIssuedLiters: '120',
    fuelStartLiters: '',
    fuelEndLiters: '',
    fuelActualLiters: '95',
    destination: 'Элеватор «Партнёр»',
    receiverName: 'Главный склад',
    weatherConditions: 'Ясно, +18°C',
    routeDescription: 'Поле — элеватор',
    responsiblePerson: 'Петров Алексей Сергеевич',
    notes: 'Демо-рейс',
    ticketPhotoUrl: '',
  };
}
