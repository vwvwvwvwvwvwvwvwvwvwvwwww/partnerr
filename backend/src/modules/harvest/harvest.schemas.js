import { z } from 'zod';

const actionTypes = [
  'Боронование',
  'Культивация',
  'Посев',
  'Уборка',
  'Глубокорыхление',
  'Опрыскивание',
  'Внесение удобрения',
];

const seedTypes = [
  'Гречиха',
  'Подсолнечник',
  'Нут',
  'Озимая пшеница',
];

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Неверный формат времени').optional().nullable();

export const createWaybillSchema = z.object({
  fieldId: z.number().int().positive(),
  cropId: z.number().int().positive().optional().nullable(),
  documentNumber: z.string().trim().min(1).max(50),
  shiftNumber: z.string().trim().max(20).optional().nullable(),
  actionType: z.enum(actionTypes),
  seedType: z.enum(seedTypes),
  driverName: z.string().trim().min(3).max(150),
  driverEmail: z.string().trim().email('Некорректный e-mail водителя').max(255).optional().nullable(),
  mechanizatorName: z.string().trim().max(150).optional().nullable(),
  vehicleNumber: z.string().trim().min(2).max(30),
  trailerNumber: z.string().trim().max(30).optional().nullable(),
  tractorModel: z.string().trim().max(100).optional().nullable(),
  equipmentName: z.string().trim().max(150).optional().nullable(),
  tripDate: z.string().date(),
  departureTime: timeSchema,
  returnTime: timeSchema,
  workVolumeHa: z.number().min(0).max(1000000).optional().nullable(),
  routeDistanceKm: z.number().min(0).max(1000000).optional().nullable(),
  startOdometerKm: z.number().min(0).max(1000000).optional().nullable(),
  endOdometerKm: z.number().min(0).max(1000000).optional().nullable(),
  startEngineHours: z.number().min(0).max(1000000).optional().nullable(),
  endEngineHours: z.number().min(0).max(1000000).optional().nullable(),
  grossWeightKg: z.number().min(0).max(1000000).optional().nullable(),
  tareWeightKg: z.number().min(0).max(1000000).optional().nullable(),
  fuelIssuedLiters: z.number().min(0).max(1000000).optional().nullable(),
  fuelStartLiters: z.number().min(0).max(1000000).optional().nullable(),
  fuelEndLiters: z.number().min(0).max(1000000).optional().nullable(),
  fuelActualLiters: z.number().min(0).max(1000000).optional().nullable(),
  destination: z.string().trim().max(150).optional().nullable(),
  receiverName: z.string().trim().max(150).optional().nullable(),
  weatherConditions: z.string().trim().max(150).optional().nullable(),
  routeDescription: z.string().trim().max(1000).optional().nullable(),
  responsiblePerson: z.string().trim().max(150).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  ticketPhotoUrl: z.string().trim().url().optional().nullable(),
});

export const updateWaybillSchema = createWaybillSchema;
