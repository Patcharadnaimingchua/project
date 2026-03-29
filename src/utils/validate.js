exports.validateRegister = (body) => {
  const errors = [];

  if (!body.name || body.name.trim().length < 2 || body.name.trim().length > 100) {
    errors.push({
      field: 'name',
      message: 'ชื่อต้องมีความยาว 2-100 ตัวอักษร',
    });
  }

  const email = body.email?.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
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