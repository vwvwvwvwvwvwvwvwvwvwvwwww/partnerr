export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Ошибка валидации данных',
        details: result.error.flatten(),
      });
    }

    req.validatedBody = result.data;
    return next();
  };
}
