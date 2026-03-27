exports.validateRegister = (data) => {
  const errors = [];

  // name
  if (!data.name || data.name.length < 2 || data.name.length > 100) {
    errors.push({
      field: "name",
      message: "ชื่อต้องยาว 2-100 ตัวอักษร",
    });
  }

  // email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.push({
      field: "email",
      message: "รูปแบบอีเมลไม่ถูกต้อง",
    });
  }

  // password
  const password = data.password || "";
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (password.length < 8 || !hasLetter || !hasNumber) {
    errors.push({
      field: "password",
      message: "รหัสผ่านต้องอย่างน้อย 8 ตัว และมีตัวอักษรกับตัวเลข",
    });
  }

  return errors;
};