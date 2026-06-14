import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';

function line(label, value) {
  const text = value === null || value === undefined || value === '' ? '—' : String(value);
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun(text),
    ],
  });
}

/** @param {Record<string, unknown>} w */
export async function buildWaybillDocx(w) {
  const tripDate = w.tripDate
    ? new Date(w.tripDate).toLocaleDateString('ru-RU')
    : '—';

  const netWeight =
    w.netWeightKg != null
      ? w.netWeightKg
      : w.grossWeightKg != null && w.tareWeightKg != null
        ? Number(w.grossWeightKg) - Number(w.tareWeightKg)
        : null;

  const children = [
    new Paragraph({
      text: 'Путевой лист',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Система «Партнер»', italics: true })],
    }),
    new Paragraph({ text: '' }),
    line('Номер документа', w.documentNumber),
    line('Смена', w.shiftNumber),
    line('Дата рейса', tripDate),
    line('Вид работы', w.actionType),
    line('Культура / семена', w.cropName ?? w.seedType),
    line('Поле', w.fieldName),
    new Paragraph({ text: '' }),
    new Paragraph({ text: 'Экипаж и техника', heading: HeadingLevel.HEADING_2 }),
    line('Водитель', w.driverName),
    line('E-mail водителя', w.driverEmail),
    line('Механизатор', w.mechanizatorName),
    line('Трактор', w.tractorModel),
    line('Орудие', w.equipmentName),
    line('Гос. номер ТС', w.vehicleNumber),
    line('Прицеп', w.trailerNumber),
    new Paragraph({ text: '' }),
    new Paragraph({ text: 'Маршрут и время', heading: HeadingLevel.HEADING_2 }),
    line('Выезд', w.departureTime),
    line('Возвращение', w.returnTime),
    line('Маршрут', w.routeDescription),
    line('Пункт назначения', w.destination),
    line('Получатель', w.receiverName),
    line('Погода', w.weatherConditions),
    line('Ответственный', w.responsiblePerson),
    new Paragraph({ text: '' }),
    new Paragraph({ text: 'Показатели', heading: HeadingLevel.HEADING_2 }),
    line('Объём работ, га', w.workVolumeHa),
    line('Расстояние, км', w.routeDistanceKm),
    line('Одометр начало / конец', `${w.startOdometerKm ?? '—'} / ${w.endOdometerKm ?? '—'}`),
    line('Моточасы начало / конец', `${w.startEngineHours ?? '—'} / ${w.endEngineHours ?? '—'}`),
    line('Брутто / тара, кг', `${w.grossWeightKg ?? '—'} / ${w.tareWeightKg ?? '—'}`),
    line('Нетто, кг', netWeight),
    line('Топливо выдано / факт, л', `${w.fuelIssuedLiters ?? '—'} / ${w.fuelActualLiters ?? '—'}`),
    new Paragraph({ text: '' }),
    line('Примечание', w.notes),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Сформировано автоматически ${new Date().toLocaleString('ru-RU')}`,
          italics: true,
        }),
      ],
    }),
  ];

  const doc = new Document({
    title: `Путевой лист ${w.documentNumber ?? ''}`,
    creator: 'Партнер',
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}
