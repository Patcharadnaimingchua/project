exports.validateRegister = (body) => {
  const errors = [];

  if (!body.name || body.name.length < 2 || body.name.length > 100) {
    errors.push({
      field: 'name',
      message: 'ชื่อต้องมีความยาว 2-100 ตัวอักษร',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!body.email || !emailRegex.test(body.email)) {
    errors.push({
      field: 'email',
      message: 'รูปแบบอีเมลไม่ถูกต้อง',
    });
  }

  if (!body.password || body.password.length < 8) {
    errors.push({
      field: 'password',
      message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
    });
  }

  return errors;
};