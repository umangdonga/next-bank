import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './app/App';
import { PhoneUpload } from './app/PhoneUpload';

// The kiosk QR codes open #/up/... on the visitor's own phone.
const onPhone = location.hash.startsWith('#/up/');

createRoot(document.getElementById('root')!).render(<StrictMode>{onPhone ? <PhoneUpload /> : <App />}</StrictMode>);
