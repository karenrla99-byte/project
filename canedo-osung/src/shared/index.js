// 파트에서는 이 파일에서만 가져다 쓰세요: import { Stage, Window, Button, useT } from '../../shared';
export { default as Stage } from './components/Stage.jsx';
export { default as Window } from './components/Window.jsx';
export { default as Button } from './components/Button.jsx';
export { default as QuizWindow } from './components/QuizWindow.jsx';
export { SettingsProvider, useSettings, useT } from './settings/SettingsContext.jsx';
export * as braille from './braille/table.js';
