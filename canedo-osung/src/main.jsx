import { createRoot } from 'react-dom/client';
import './shared/theme/tokens.css';
import { SettingsProvider } from './shared';
import Flow from './flow/Flow.jsx';

createRoot(document.getElementById('root')).render(
  <SettingsProvider>
    <Flow />
  </SettingsProvider>,
);
