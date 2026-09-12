TURK SETTINGS - KEYAUTH LOGIN

- ช่อง Login เริ่มว่าง และแสดง placeholder: ใส่ Key
- ไม่มี License Key ตัวอย่างฝังอยู่ใน HTML/JS/CSS
- ไม่โหลดหรือแสดง saved key ในหน้าเว็บ
- ตรวจสอบผ่าน window.pywebview.api.verify_key(key) เท่านั้น
- หาก Native bridge ไม่ตอบกลับ ระบบจะหยุดรอภายใน 5 วินาที ไม่ค้างหน้า VERIFYING
- KeyAuth credentials/secret ควรเก็บไว้ฝั่ง native/backend ไม่ใช่ frontend

KeyAuth license login ต้อง initialize ก่อน แล้วจึงเรียก license login ตาม API ของ KeyAuth
