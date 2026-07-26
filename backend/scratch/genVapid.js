const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const keys = webpush.generateVAPIDKeys();
console.log('Generated VAPID Keys:');
console.log('Public Key:', keys.publicKey);
console.log('Private Key:', keys.privateKey);

const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  let content = fs.readFileSync(envPath, 'utf8');
  if (!content.includes('VAPID_PUBLIC_KEY')) {
    content += `\nVAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\n`;
    fs.writeFileSync(envPath, content, 'utf8');
    console.log('Appended VAPID keys successfully to .env!');
  } else {
    console.log('VAPID keys already exist in .env!');
  }
} else {
  console.log('.env file not found!');
}
