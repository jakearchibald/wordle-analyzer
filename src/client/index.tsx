import { h, render } from 'preact';
import App from './App';
import { addServiceWorker } from './utils';

render(<App />, document.getElementById('app')!);

addServiceWorker();
