// components/QRGenerator.js
import { useState } from 'react';
import QRCode from 'qrcode';

export default function QRGenerator() {
  const [text, setText] = useState('');
  const [qrCode, setQrCode] = useState('');

  const generateQR = async () => {
    try {
      const code = await QRCode.toDataURL(text);
      setQrCode(code);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to encode"
      />
      <button onClick={generateQR}>Generate QR Code</button>
      {qrCode && (
        <div>
          <img src={qrCode} alt="Generated QR Code" />
          <a href={qrCode} download="qrcode.png">
            Download QR Code
          </a>
        </div>
      )}
    </div>
  );
}